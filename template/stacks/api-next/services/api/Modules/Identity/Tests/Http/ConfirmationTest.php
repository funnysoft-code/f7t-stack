<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Fortify\Features;
use Modules\Identity\Models\Users\User;

it('requires confirmation again after expiry and never accepts invalid proof', function (): void {
    Notification::fake();
    config(['auth.password_timeout' => 60]);
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $this->getJson('/api/auth/confirmed-password-status')->assertJsonPath('confirmed', false);
    $this->postJson('/api/auth/confirm-password', ['password' => 'wrong'])->assertUnprocessable();
    $this->deleteJson('/api/auth/settings/account')->assertStatus(423);
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $this->getJson('/api/auth/confirmed-password-status')->assertJsonPath('confirmed', true);
    $this->travel(61)->seconds();
    $this->putJson('/api/auth/settings/password')->assertStatus(423);
    $this->deleteJson('/api/auth/settings/account')->assertStatus(423);
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $this->patchJson('/api/auth/settings/profile', ['email' => 'new@example.test'])->assertOk();
    $this->travel(61)->seconds();
    $this->getJson('/api/auth/confirmed-password-status')->assertJsonPath('confirmed', false);
    $this->patchJson('/api/auth/settings/profile', ['email' => 'next@example.test'])->assertStatus(423);
});

it('rejects previously usable remember cookies and idle sessions after credential replacement', function (string $mutation): void {
    $this->withCredentials();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $cookieName = Auth::guard('web')->getRecallerName();
    $login = $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password', 'remember' => true])->assertOk();
    $remember = $login->getCookie($cookieName)?->getValue();
    assert(is_string($remember));
    $oldSession = session()->getId();
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), 'remember-control-session')->withCookie($cookieName, $remember)->getJson('/api/auth/me')->assertOk();
    $this->getJson('/api/auth/confirmed-password-status')->assertJsonPath('confirmed', false);
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), 'replacement-browser-session')->withCookie($cookieName, '');
    if ($mutation === 'reset') {
        $this->postJson('/api/auth/reset-password', ['email' => $user->email, 'token' => Password::createToken($user), 'password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertOk();
    } else {
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
        $this->withCookie(config()->string('session.cookie'), session()->getId())->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
        $this->putJson('/api/auth/settings/password', ['password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertNoContent();
    }
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), $oldSession)->getJson('/api/app')->assertUnauthorized();
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), 'remember-browser-session')->withCookie($cookieName, $remember)->getJson('/api/auth/me')->assertUnauthorized();
})->with(['reset', 'change']);

it('binds actual pending password proof to credentials and rejects it after reset change or deletion', function (string $mutation): void {
    config(['fortify.features' => [...config()->array('fortify.features'), Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])]]);
    $this->withCredentials();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now(), 'two_factor_secret' => encrypt('secret'), 'two_factor_confirmed_at' => now()]);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk()->assertJsonPath('two_factor', true);
    $pendingSession = session()->getId();
    expect(session()->get('login.credential_hash'))->toBe(hash('sha256', $user->password));
    $this->withCookie(config()->string('session.cookie'), $pendingSession)->getJson('/api/auth/capabilities')->assertOk();
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), 'other-browser-session');
    if ($mutation === 'reset') {
        $this->postJson('/api/auth/reset-password', ['email' => $user->email, 'token' => Password::createToken($user), 'password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertOk();
    } else {
        // U8 owns factor completion; disable the feature to create a second real password session here.
        config(['fortify.features' => [Features::resetPasswords(), Features::emailVerification()]]);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
        $this->withCookie(config()->string('session.cookie'), session()->getId())->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
        if ($mutation === 'change') {
            $this->putJson('/api/auth/settings/password', ['password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertNoContent();
        } else {
            $this->deleteJson('/api/auth/settings/account')->assertNoContent();
        }
    }
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), $pendingSession)->getJson('/api/auth/capabilities')->assertUnauthorized()->assertHeader('Cache-Control', 'no-store, private');
    expect(session()->has('login'))->toBeFalse();
    $this->getJson('/api/auth/me')->assertUnauthorized();
})->with(['reset', 'change', 'delete']);

it('clears pending proof that predates credential binding', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $this->withSession(['login.id' => $user->id, 'login.remember' => true])->getJson('/api/auth/capabilities')->assertUnauthorized();
    expect(session()->has('login'))->toBeFalse();
});
