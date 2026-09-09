<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Modules\Identity\Models\Users\User;
use Modules\Identity\Notifications\VerifyEmail;
use Spatie\Permission\Models\Permission;

it('updates names without confirmation but gates email before validation or mutation', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $this->patchJson('/api/auth/settings/profile', ['name' => 'New name', 'email' => $user->email])->assertOk()->assertJsonPath('data.name', 'New name')->assertJsonMissingPath('data.id');
    $this->patchJson('/api/auth/settings/profile', ['name' => 'Not saved', 'email' => 'invalid'])->assertStatus(423)->assertHeader('Cache-Control', 'no-store, private');
    expect($user->refresh()->name)->toBe('New name');
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $this->patchJson('/api/auth/settings/profile', ['name' => 'Not saved', 'email' => 'invalid'])->assertUnprocessable()->assertJsonValidationErrors('email');
    User::query()->create(['name' => 'Other', 'email' => 'taken@example.test', 'password' => 'test-password']);
    $this->patchJson('/api/auth/settings/profile', ['name' => 'Not saved', 'email' => 'taken@example.test'])->assertUnprocessable()->assertJsonValidationErrors('email');
    expect($user->refresh()->name)->toBe('New name');
});

it('invalidates old verification links and the verified access of another real session', function (): void {
    Notification::fake();
    $this->withCredentials();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $oldLink = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->uuid, 'hash' => sha1($user->email)], absolute: false);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $otherSession = session()->getId();
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), 'second-browser-session')->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $currentSession = session()->getId();
    $this->withCookie(config()->string('session.cookie'), $currentSession)->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $this->patchJson('/api/auth/settings/profile', ['email' => 'corrected@example.test'])->assertOk()->assertJsonPath('data.email_verified', false);
    Notification::assertSentTo($user->refresh(), VerifyEmail::class);
    $this->getJson($oldLink)->assertForbidden();
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), $otherSession)->getJson('/api/app')->assertForbidden();
    $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.email', 'corrected@example.test');
    $newLink = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->uuid, 'hash' => sha1($user->email)], absolute: false);
    $this->getJson($newLink)->assertOk()->assertJsonPath('data.email_verified', true);
    $this->getJson('/api/app')->assertOk();
});

it('limits unverified settings to recently confirmed email correction', function (): void {
    Notification::fake();
    $user = User::query()->create(['name' => 'User', 'email' => 'typo@example.test', 'password' => 'test-password']);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $this->patchJson('/api/auth/settings/profile', ['email' => 'correct@example.test'])->assertStatus(423);
    $this->patchJson('/api/auth/settings/profile', ['name' => 'Other'])->assertForbidden();
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $this->patchJson('/api/auth/settings/profile', ['name' => 'Other', 'email' => 'correct@example.test'])->assertForbidden();
    $this->putJson('/api/auth/settings/password', ['password' => 'new-test-password', 'password_confirmation' => 'new-test-password'])->assertForbidden();
    $this->deleteJson('/api/auth/settings/account')->assertForbidden();
    $this->patchJson('/api/auth/settings/profile', ['email' => 'correct@example.test'])->assertOk();
    expect($user->refresh()->email)->toBe('correct@example.test')->and($user->name)->toBe('User');
});

it('changes passwords without another raw password and revokes an idle session from login', function (): void {
    $this->withCredentials();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $otherSession = session()->getId();
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), 'second-browser-session')->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $this->withCookie(config()->string('session.cookie'), session()->getId());
    $this->putJson('/api/auth/settings/password', [])->assertStatus(423);
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $this->putJson('/api/auth/settings/password', ['password' => 'short', 'password_confirmation' => 'different'])->assertUnprocessable()->assertJsonValidationErrors('password');
    expect(Hash::check('test-password', $user->refresh()->password))->toBeTrue();
    $this->putJson('/api/auth/settings/password', ['password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertNoContent();
    expect(Hash::check('replacement-password', $user->refresh()->password))->toBeTrue();
    session()->flush();
    Auth::forgetGuards();
    $this->getJson('/api/app')->assertOk();
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), $otherSession)->getJson('/api/app')->assertUnauthorized()->assertHeader('Cache-Control', 'no-store, private');
});

it('deletes account reset tokens factors grants and both actual sessions', function (): void {
    $this->withCredentials();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now(), 'two_factor_secret' => encrypt('secret')]);
    $user->givePermissionTo(Permission::findOrCreate('view-horizon', 'web'));
    $token = Password::createToken($user);
    $cookieName = Auth::guard('web')->getRecallerName();
    $login = $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password', 'remember' => true])->assertOk();
    $remember = $login->getCookie($cookieName)?->getValue();
    assert(is_string($remember));
    $otherSession = session()->getId();
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), 'second-browser-session')->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $currentSession = session()->getId();
    $this->withCookie(config()->string('session.cookie'), $currentSession)->deleteJson('/api/auth/settings/account')->assertStatus(423);
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $this->deleteJson('/api/auth/settings/account')->assertNoContent();
    $this->assertDatabaseMissing('users', ['id' => $user->id]);
    $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
    $this->assertDatabaseMissing('model_has_permissions', ['model_id' => $user->id]);
    foreach ([$currentSession, $otherSession] as $session) {
        session()->flush();
        Auth::forgetGuards();
        $this->withCookie(config()->string('session.cookie'), $session)->getJson('/api/auth/me')->assertUnauthorized();
    }
    session()->flush();
    Auth::forgetGuards();
    $this->withCookie(config()->string('session.cookie'), 'remember-browser-session')->withCookie($cookieName, $remember)->getJson('/api/auth/me')->assertUnauthorized();
    $this->postJson('/api/auth/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertUnprocessable();
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertUnprocessable();
});

it('retains corrected unverified email after failed delivery and offers resend', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $this->patchJson('/api/auth/settings/profile', ['name' => ''])->assertUnprocessable()->assertJsonValidationErrors('name');
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    Notification::shouldReceive('send')->once()->andThrow(new RuntimeException('Test delivery unavailable'));
    $this->patchJson('/api/auth/settings/profile', ['email' => 'corrected@example.test'])->assertOk()->assertJsonPath('data.email_verified', false);
    expect($user->refresh()->email)->toBe('corrected@example.test');
    Notification::fake();
    $this->postJson('/api/auth/email/verification-notification')->assertSuccessful();
});
