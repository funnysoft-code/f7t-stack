<?php

declare(strict_types=1);

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Modules\Identity\Models\Users\User;

it('keeps registration disabled and reports the same public capability', function (): void {
    $this->getJson('/api/auth/capabilities')->assertOk()->assertJsonPath('data.registration', false);
    $this->postJson('/api/auth/register', ['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'password_confirmation' => 'test-password'])->assertNotFound();
    expect(User::query()->count())->toBe(0);
});

it('registers an ordinary user and rejects stale cached registration routes', function (): void {
    Notification::fake();
    config(['funnysoft.registration_enabled' => true]);
    require base_path('Modules/Identity/Routes/auth.php');
    Route::getRoutes()->refreshNameLookups();
    $this->getJson('/api/auth/capabilities')->assertJsonPath('data.registration', true);
    $this->postJson('/api/auth/register', ['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'password_confirmation' => 'test-password'])->assertCreated();
    $user = User::query()->sole();
    expect($user->hasVerifiedEmail())->toBeFalse()->and($user->permissions()->count())->toBe(0)->and($user->roles()->count())->toBe(0);
    $this->postJson('/api/auth/logout')->assertNoContent();
    config(['funnysoft.registration_enabled' => false]);
    $this->postJson('/api/auth/register', ['name' => 'Other', 'email' => 'other@example.test', 'password' => 'test-password', 'password_confirmation' => 'test-password'])->assertNotFound();
    expect(User::query()->count())->toBe(1);
});

it('guards a real enabled route cache after registration is disabled', function (): void {
    putenv('FUNNYSOFT_REGISTRATION_ENABLED=true');
    try {
        expect(Artisan::call('route:cache'))->toBe(0);
        require app()->getCachedRoutesPath();
        expect(Route::has('register.store'))->toBeTrue();
        config(['funnysoft.registration_enabled' => false]);
        $this->getJson('/api/auth/capabilities')->assertJsonPath('data.registration', false);
        $this->postJson('/api/auth/register', ['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'password_confirmation' => 'test-password'])->assertNotFound();
        expect(User::query()->count())->toBe(0);
    } finally {
        Artisan::call('route:clear');
        putenv('FUNNYSOFT_REGISTRATION_ENABLED');
    }
});

it('rotates the session on login and invalidates the old session on logout', function (): void {
    $this->withCredentials();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $this->getJson('/api/auth/csrf-cookie')->assertNoContent();
    $before = session()->getId();
    $this->withCookie(config()->string('session.cookie'), $before);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $authenticated = session()->getId();
    expect($authenticated)->not->toBe($before)
        ->and(session()->getHandler()->read($authenticated))->not->toBe('');
    $this->withCookie(config()->string('session.cookie'), $authenticated);
    Auth::forgetGuards();
    $this->getJson('/api/auth/me')->assertOk();
    $this->postJson('/api/auth/logout')->assertNoContent();
    expect(session()->getId())->not->toBe($authenticated)
        ->and(session()->getHandler()->read($authenticated))->toBe('');
    Auth::forgetGuards();
    $this->getJson('/api/auth/me')->assertUnauthorized();
});

it('requires CSRF outside the test bypass and returns private JSON errors', function (): void {
    app()->detectEnvironment(fn (): string => 'local');
    $this->get('/api/auth/csrf-cookie')->assertNoContent()->assertCookie('XSRF-TOKEN');
    $this->postJson('/api/auth/login', ['email' => 'missing@example.test', 'password' => 'invalid'])->assertStatus(419)->assertHeader('Cache-Control', 'no-store, private');
    $this->withSession(['_token' => 'test-csrf-token'])->withHeader('X-CSRF-TOKEN', 'test-csrf-token')->postJson('/api/auth/login', ['email' => 'missing@example.test', 'password' => 'invalid'])->assertUnprocessable();
    $this->get('/api/auth/me')->assertUnauthorized()->assertHeader('Content-Type', 'application/json')->assertHeader('Cache-Control', 'no-store, private');
});

it('throttles invalid login attempts', function (): void {
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->postJson('/api/auth/login', ['email' => 'missing@example.test', 'password' => 'invalid'])->assertUnprocessable();
    }
    $this->postJson('/api/auth/login', ['email' => 'missing@example.test', 'password' => 'invalid'])->assertTooManyRequests();
});

it('resets with a valid token and rejects expired and already consumed tokens', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $token = Password::createToken($user);
    $payload = ['email' => $user->email, 'token' => $token, 'password' => 'replacement-password', 'password_confirmation' => 'replacement-password'];
    $this->postJson('/api/auth/reset-password', $payload)->assertOk();
    expect(Hash::check('replacement-password', $user->fresh()->password ?? ''))->toBeTrue();
    $this->postJson('/api/auth/reset-password', $payload)->assertUnprocessable();
    $payload['token'] = Password::createToken($user);
    $this->travel(61)->minutes();
    $this->postJson('/api/auth/reset-password', $payload)->assertUnprocessable();
});

it('keeps password reset responses safe when mail delivery fails', function (): void {
    User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    Notification::shouldReceive('send')->once()->andThrow(new RuntimeException('Test mail unavailable'));
    $this->postJson('/api/auth/forgot-password', ['email' => 'user@example.test'])->assertOk()->assertJsonPath('message', 'If the account exists, a password reset link will be sent.');
});

it('does not enumerate accounts through rejected reset tokens', function (): void {
    User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $payload = ['email' => 'user@example.test', 'token' => 'invalid', 'password' => 'replacement-password', 'password_confirmation' => 'replacement-password'];
    $known = $this->postJson('/api/auth/reset-password', $payload)->assertUnprocessable()->json();
    $payload['email'] = 'missing@example.test';
    expect($this->postJson('/api/auth/reset-password', $payload)->assertUnprocessable()->json())->toBe($known);
});

it('retains public signup and offers resend when verification mail fails', function (): void {
    config(['funnysoft.registration_enabled' => true]);
    require base_path('Modules/Identity/Routes/auth.php');
    Notification::shouldReceive('send')->once()->andThrow(new RuntimeException('Test mail unavailable'));
    $this->postJson('/api/auth/register', ['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'password_confirmation' => 'test-password'])->assertCreated();
    $this->getJson('/api/auth/email/verify')->assertOk()->assertJsonPath('data.email_verified', false);
    Notification::fake();
    $this->postJson('/api/auth/email/verification-notification')->assertSuccessful();
});

it('logs in through the session and restricts unverified app access', function (): void {
    Notification::fake();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'incorrect'])->assertUnprocessable();
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.uuid', $user->uuid)->assertJsonMissingPath('data.id');
    $this->getJson('/api/app')->assertForbidden();
    $this->getJson('/api/auth/email/verify')->assertOk();
    $this->postJson('/api/auth/email/verification-notification')->assertSuccessful();
    $this->postJson('/api/auth/logout')->assertNoContent();
    $this->getJson('/api/auth/me')->assertUnauthorized();
});

it('returns an enumeration safe reset response', function (): void {
    Notification::fake();
    User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $known = $this->postJson('/api/auth/forgot-password', ['email' => 'user@example.test'])->assertOk()->json();
    $unknown = $this->postJson('/api/auth/forgot-password', ['email' => 'missing@example.test'])->assertOk()->json();
    expect($known)->toBe($unknown);
});

it('delivers a usable reset link at the configured frontend origin', function (): void {
    Notification::fake();
    config(['funnysoft.frontend_url' => 'https://accounts.example.test/']);
    $user = User::query()->create(['name' => 'User', 'email' => 'user+reset@example.test', 'password' => 'test-password']);
    $this->postJson('/api/auth/forgot-password', ['email' => $user->email])->assertOk();
    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
        expect($notification->toMail($user)->actionUrl)->toBe('https://accounts.example.test/reset-password?'.http_build_query(['token' => $notification->token, 'email' => $user->email]));
        $this->postJson('/api/auth/reset-password', ['email' => $user->email, 'token' => $notification->token, 'password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertOk();

        return true;
    });
    expect(Hash::check('replacement-password', $user->refresh()->password))->toBeTrue();
});
