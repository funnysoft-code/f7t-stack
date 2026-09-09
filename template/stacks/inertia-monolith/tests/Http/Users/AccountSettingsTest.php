<?php

declare(strict_types=1);

use App\Models\Users\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\AccountBrowser;
use Tests\Support\TestAuthenticator;

pest()->use(RefreshDatabase::class);

test('name edits need no confirmation and validation never partially updates the account', function (): void {
    $user = User::factory()->verified()->create();
    $other = User::factory()->create();
    $this->actingAs($user)->patchJson('/settings/profile', ['name' => 'New name', 'email' => $user->email])->assertNoContent();
    expect($user->refresh()->name)->toBe('New name');
    $this->withSession(['auth.password_confirmed_at' => time()]);
    $this->patchJson('/settings/profile', ['name' => 'Bad edit', 'email' => $other->email])->assertUnprocessable()->assertJsonValidationErrors('email');
    $this->patchJson('/settings/profile', ['name' => '', 'email' => 'bad'])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email']);
    $this->putJson('/settings/password', ['password' => 'short', 'password_confirmation' => 'short'])->assertUnprocessable();
    expect($user->refresh()->name)->toBe('New name')->and(Hash::check('test-password-only', $user->password))->toBeTrue();
});

test('email changes clear verification notify the new address reject old links and allow confirmed correction only', function (): void {
    Notification::fake();
    $user = User::factory()->verified()->create();
    $link = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->email)]);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $this->patchJson('/settings/profile', ['name' => $user->name, 'email' => 'NEW@example.test'])->assertNoContent();
    expect($user->refresh()->email)->toBe('new@example.test')->and($user->hasVerifiedEmail())->toBeFalse();
    Notification::assertSentTo($user, VerifyEmail::class, fn (VerifyEmail $notification, array $channels, User $notifiable): bool => $notifiable->email === 'new@example.test');
    $this->getJson($link)->assertForbidden();
    $this->getJson('/')->assertForbidden();
    $this->patchJson('/settings/profile', ['name' => 'Forbidden', 'email' => 'correct@example.test'])->assertForbidden();
    $this->patchJson('/settings/profile', ['name' => $user->name, 'email' => $user->email])->assertForbidden();
    $this->patchJson('/settings/profile', ['name' => $user->name, 'email' => 'correct@example.test'])->assertNoContent();
});

test('mail failure leaves the new email unverified and recoverable through resend', function (): void {
    $user = User::factory()->create();
    Notification::shouldReceive('send')->once()->andThrow(new RuntimeException('mail unavailable'));
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()])->patchJson('/settings/profile', ['name' => $user->name, 'email' => 'new@example.test'])->assertServerError();
    expect($user->refresh()->email)->toBe('new@example.test')->and($user->hasVerifiedEmail())->toBeFalse();
    Notification::fake();
    $this->postJson('/email/verification-notification')->assertAccepted();
    Notification::assertSentTo($user, VerifyEmail::class);
});

test('password update retains current authentication and rejects another stored session hash', function (): void {
    $user = User::factory()->verified()->create();
    $oldHash = $user->password;
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $before = session()->getId();
    $this->putJson('/settings/password', ['password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password'])->assertNoContent();
    expect(session()->getId())->not->toBe($before)->and(Hash::check('new-secure-password', $user->refresh()->password))->toBeTrue();
    $this->getJson('/')->assertOk();
    $this->withSession(['password_hash_web' => $oldHash])->getJson('/')->assertUnauthorized();
    $this->assertGuest();
});

test('deletion clears account grants tokens and current session without a repeated password', function (): void {
    $user = User::factory()->create();
    $user->givePermissionTo(Permission::create(['name' => 'viewHorizon', 'guard_name' => 'web']));
    $user->assignRole(Role::create(['name' => 'ordinary', 'guard_name' => 'web']));
    $token = Password::createToken($user);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time(), 'passkey.verification_options' => 'pending']);
    $this->deleteJson('/settings/account')->assertNoContent();
    $this->assertGuest();
    expect(User::find($user->id))->toBeNull()->and(DB::table('password_reset_tokens')->count())->toBe(0)
        ->and(DB::table('model_has_permissions')->count())->toBe(0)->and(DB::table('model_has_roles')->count())->toBe(0)->and(session()->has('passkey'))->toBeFalse();
    Auth::forgetGuards();
    $this->getJson('/')->assertUnauthorized();
    $this->postJson('/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password'])->assertUnprocessable();
    expect(User::find($user->id))->toBeNull();
});

test('independent login sessions and remember cookies are revoked by password changes and deletion', function (): void {
    $user = User::factory()->verified()->create();
    $first = new AccountBrowser($this);
    $second = new AccountBrowser($this);
    $remembered = new AccountBrowser($this);
    $credentials = ['email' => $user->email, 'password' => 'test-password-only', 'remember' => true];
    $first->request('POST', '/login', $credentials)->assertOk();
    $second->request('POST', '/login', $credentials)->assertOk();
    $remembered->request('POST', '/login', $credentials)->assertOk();
    $remembered->forgetSession();
    $remembered->request('GET', '/')->assertOk();
    $first->request('POST', '/user/confirm-password', ['password' => 'test-password-only'])->assertCreated();
    $first->request('PUT', '/settings/password', ['password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password'])->assertNoContent();
    $first->request('GET', '/')->assertOk();
    $second->request('GET', '/')->assertUnauthorized();
    $remembered->forgetSession();
    $remembered->request('GET', '/')->assertUnauthorized();
    $credentials['password'] = 'new-secure-password';
    $second->request('POST', '/login', $credentials)->assertOk();
    $remembered->request('POST', '/login', $credentials)->assertOk();
    $first->request('DELETE', '/settings/account')->assertNoContent();
    $first->request('GET', '/')->assertUnauthorized();
    $second->request('GET', '/')->assertUnauthorized();
    $remembered->forgetSession();
    $remembered->request('GET', '/')->assertUnauthorized();
});

test('an email change blocks the other active session and reset revokes all password sessions', function (): void {
    Notification::fake();
    $user = User::factory()->verified()->create();
    $first = new AccountBrowser($this);
    $second = new AccountBrowser($this);
    foreach ([$first, $second] as $browser) {
        $browser->request('POST', '/login', ['email' => $user->email, 'password' => 'test-password-only'])->assertOk();
    }
    $oldToken = Password::createToken($user);
    $first->request('POST', '/user/confirm-password', ['password' => 'test-password-only'])->assertCreated();
    $first->request('PATCH', '/settings/profile', ['name' => $user->name, 'email' => 'changed@example.test'])->assertNoContent();
    $second->request('GET', '/')->assertForbidden();
    expect(Password::tokenExists($user, $oldToken))->toBeFalse();
    $user->refresh();
    $token = Password::createToken($user);
    new AccountBrowser($this)->request('POST', '/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'reset-password-only', 'password_confirmation' => 'reset-password-only'])->assertOk();
    $first->request('GET', '/')->assertUnauthorized();
    $second->request('GET', '/')->assertUnauthorized();
});

test('deletion removes passkey rows', function (): void {
    $user = User::factory()->create();
    $user->passkeys()->create(['name' => 'Device', 'credential_id' => 'test-credential', 'credential' => []]);
    Password::createToken($user);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $this->deleteJson('/settings/account')->assertNoContent();
    expect(DB::table('passkeys')->count())->toBe(0);
});

test('a failed deletion rolls back credential and permission cleanup and retains the session', function (): void {
    Schema::create('account_references', function (Blueprint $table): void {
        $table->foreignUuid('user_id')->constrained('users');
    });
    $user = User::factory()->verified()->create();
    DB::table('account_references')->insert(['user_id' => $user->id]);
    $user->givePermissionTo(Permission::create(['name' => 'viewHorizon', 'guard_name' => 'web']));
    $token = Password::createToken($user);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    config(['passkeys.relying_party_id' => 'account.test', 'passkeys.allowed_origins' => ['https://account.test']]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/user/passkeys/options')->assertOk()->json('options');
    $this->postJson('/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk();
    $this->deleteJson('/settings/account')->assertServerError();
    expect(User::find($user->id))->not->toBeNull()->and(Password::tokenExists($user, $token))->toBeTrue()
        ->and(DB::table('model_has_permissions')->count())->toBe(1)->and($user->passkeys()->count())->toBe(1);
    $this->getJson('/')->assertOk();
});
