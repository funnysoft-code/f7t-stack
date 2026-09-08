<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureRegistrationEnabled;
use App\Models\Users\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

pest()->use(RefreshDatabase::class);

test('registration defaults off in routes and public capabilities', function (): void {
    expect(config('funnysoft.registration_enabled'))->toBeFalse()
        ->and(Route::has('register'))->toBeFalse();
    $this->getJson('/login')->assertOk()->assertJsonPath('props.capabilities.registrationEnabled', false);
    $this->postJson('/register', [])->assertNotFound();
});

test('stale registration routes enforce the current switch before validation or creation', function (): void {
    Route::middleware(['web', EnsureRegistrationEnabled::class])
        ->post('/register', [RegisteredUserController::class, 'store'])->name('register.store');
    $this->postJson('/register', [])->assertNotFound();
    expect(User::count())->toBe(0);
});

test('enabled registration validates and creates only an unverified ordinary account', function (): void {
    Notification::fake();
    config(['funnysoft.registration_enabled' => true]);
    Route::middleware(['web', EnsureRegistrationEnabled::class])
        ->post('/register', [RegisteredUserController::class, 'store'])->name('register.store');
    $this->getJson('/login')->assertJsonPath('props.capabilities.registrationEnabled', true);
    $this->postJson('/register', [])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
    $this->postJson('/register', ['name' => 'First', 'email' => 'FIRST@example.test', 'password' => 'secure-password', 'password_confirmation' => 'secure-password', 'email_verified_at' => now(), 'permissions' => ['view-horizon']])->assertCreated();
    $user = User::sole();
    expect($user->email)->toBe('first@example.test')->and($user->hasVerifiedEmail())->toBeFalse()
        ->and($user->getAllPermissions())->toBeEmpty()->and($user->roles)->toBeEmpty();
    Notification::assertSentTo($user, VerifyEmail::class);
    $this->getJson('/')->assertForbidden();
});

test('login rejects invalid credentials throttles and rotates session then logout invalidates it', function (): void {
    $user = User::factory()->create(['password' => 'secure-password']);
    $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable();
    $this->withSession(['sentinel' => 'present']);
    $before = session()->getId();
    $token = session()->token();
    $this->postJson('/login', ['email' => $user->email, 'password' => 'secure-password'])->assertOk()->assertJson(['two_factor' => false]);
    expect(session()->getId())->not->toBe($before);
    $signedIn = session()->getId();
    $this->postJson('/logout')->assertNoContent();
    $this->assertGuest();
    expect(session()->getId())->not->toBe($signedIn)->and(session()->token())->not->toBe($token)->and(session()->has('sentinel'))->toBeFalse();
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/login', ['email' => 'missing@example.test', 'password' => 'wrong'])->assertUnprocessable();
    }
    $this->postJson('/login', ['email' => 'missing@example.test', 'password' => 'wrong'])->assertTooManyRequests();
});

test('reset requests conceal existing missing and broker-throttled accounts', function (): void {
    Notification::fake();
    $user = User::factory()->create();
    $known = $this->postJson('/forgot-password', ['email' => $user->email])->assertOk()->json();
    assert(is_array($known));
    $this->postJson('/forgot-password', ['email' => 'missing@example.test'])->assertOk()->assertExactJson($known);
    $this->postJson('/forgot-password', ['email' => $user->email])->assertOk()->assertExactJson($known);
    Notification::assertSentTo($user, ResetPassword::class);
    $this->postJson('/forgot-password', ['email' => 'invalid'])->assertUnprocessable();
});

test('password reset validates replaces credentials and rejects expired and reused tokens', function (): void {
    $user = User::factory()->create();
    $token = Password::createToken($user);
    $payload = ['email' => $user->email, 'token' => $token, 'password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password'];
    $this->postJson('/reset-password', [...$payload, 'password_confirmation' => 'different'])->assertUnprocessable();
    $this->postJson('/reset-password', $payload)->assertOk();
    expect(Hash::check('new-secure-password', $user->refresh()->password))->toBeTrue()->and($user->remember_token)->not->toBeNull();
    $this->postJson('/reset-password', $payload)->assertUnprocessable();
    $payload['token'] = Password::createToken($user);
    $this->travel(61)->minutes();
    $this->postJson('/reset-password', $payload)->assertUnprocessable();
});

test('invalid reset submissions do not reveal account existence', function (): void {
    $user = User::factory()->create();
    $payload = ['token' => 'invalid', 'password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password'];
    $known = $this->postJson('/reset-password', [...$payload, 'email' => $user->email])->assertUnprocessable()->json();
    assert(is_array($known));
    $this->postJson('/reset-password', [...$payload, 'email' => 'missing@example.test'])->assertUnprocessable()->assertExactJson($known);
});

test('account page contracts support Inertia and JSON without production screens', function (): void {
    $this->getJson('/forgot-password')->assertOk()->assertJsonPath('component', 'auth/forgot-password');
    $this->getJson('/reset-password/sample?email=first@example.test')->assertOk()
        ->assertJsonPath('props.token', 'sample')->assertJsonPath('props.email', 'first@example.test');
    $this->get('/login', ['X-Inertia' => 'true', 'X-Inertia-Version' => Inertia\Inertia::getVersion()])->assertOk()->assertHeader('X-Inertia', 'true');
    $this->actingAs(User::factory()->create())->getJson('/user/confirm-password')->assertOk()->assertJsonPath('component', 'auth/confirm-password');
});

test('HTML reset request statuses are uniform too', function (): void {
    Notification::fake();
    $user = User::factory()->create();
    $this->from('/forgot-password')->post('/forgot-password', ['email' => $user->email])->assertRedirect('/forgot-password');
    $status = session('status');
    $this->from('/forgot-password')->post('/forgot-password', ['email' => 'missing@example.test'])->assertRedirect('/forgot-password')->assertSessionHas('status', $status)->assertSessionHasNoErrors();
});

test('registration mail failure retains an ordinary account that can sign in and resend', function (): void {
    Notification::shouldReceive('send')->once()->andThrow(new RuntimeException('transport unavailable'));
    config(['funnysoft.registration_enabled' => true]);
    Route::middleware(['web', EnsureRegistrationEnabled::class])
        ->post('/register', [RegisteredUserController::class, 'store'])->name('register.store');
    $this->postJson('/register', ['name' => 'First', 'email' => 'first@example.test', 'password' => 'secure-password', 'password_confirmation' => 'secure-password'])->assertServerError();
    $user = User::sole();
    expect($user->hasVerifiedEmail())->toBeFalse()->and($user->getAllPermissions())->toBeEmpty();
    Notification::fake();
    $this->postJson('/login', ['email' => $user->email, 'password' => 'secure-password'])->assertOk();
    $this->postJson('/email/verification-notification')->assertAccepted();
    Notification::assertSentTo($user, VerifyEmail::class);
});
