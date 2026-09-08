<?php

declare(strict_types=1);

use App\Models\Users\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use PragmaRX\Google2FA\Google2FA;
use Tests\Support\AccountBrowser;

pest()->use(RefreshDatabase::class);

test('authenticator enrollment confirmation recovery rotation and removal use real HTTP contracts', function (): void {
    $user = User::factory()->verified()->create();
    $this->actingAs($user);
    foreach (['/user/two-factor-qr-code', '/user/two-factor-secret-key', '/user/two-factor-recovery-codes'] as $path) {
        $this->getJson($path)->assertStatus(423);
    }
    $this->postJson('/user/confirm-password', ['password' => 'test-password-only'])->assertCreated();
    $this->postJson('/user/two-factor-authentication')->assertOk();
    $secret = $this->getJson('/user/two-factor-secret-key')->assertOk()->json('secretKey');
    assert(is_string($secret));
    $this->getJson('/user/two-factor-qr-code')->assertOk()->assertJsonStructure(['svg', 'url']);
    $old = $this->getJson('/user/two-factor-recovery-codes')->assertOk()->json();
    $this->postJson('/user/confirmed-two-factor-authentication', ['code' => 'invalid'])->assertUnprocessable();
    $code = app(Google2FA::class)->getCurrentOtp($secret);
    $this->postJson('/user/confirmed-two-factor-authentication', ['code' => $code])->assertOk();
    $this->postJson('/user/two-factor-recovery-codes')->assertOk();
    $codes = $this->getJson('/user/two-factor-recovery-codes')->assertOk()->json();
    assert(is_array($old) && is_array($codes));
    foreach ($old as $oldCode) {
        expect($codes)->not->toContain($oldCode);
    }
    $this->postJson('/logout')->assertNoContent();
    Auth::forgetGuards();
    $this->postJson('/login', ['email' => $user->email, 'password' => 'test-password-only'])->assertJsonPath('two_factor', true);
    $this->postJson('/two-factor-challenge', ['recovery_code' => $old[0]])->assertUnprocessable();
    $this->postJson('/two-factor-challenge', ['recovery_code' => $codes[0]])->assertNoContent();
    $this->assertAuthenticatedAs($user);
    $this->postJson('/logout')->assertNoContent();
    Auth::forgetGuards();
    $this->postJson('/login', ['email' => $user->email, 'password' => 'test-password-only'])->assertJsonPath('two_factor', true);
    $this->postJson('/two-factor-challenge', ['recovery_code' => $codes[0]])->assertUnprocessable();
    $this->postJson('/two-factor-challenge', ['recovery_code' => $codes[1]])->assertNoContent();
    $this->deleteJson('/user/two-factor-authentication')->assertStatus(423);
    $this->postJson('/user/confirm-password', ['password' => 'test-password-only'])->assertCreated();
    $this->deleteJson('/user/two-factor-authentication')->assertOk();
    expect($user->refresh()->two_factor_secret)->toBeNull();
    $this->postJson('/logout')->assertNoContent();
    Auth::forgetGuards();
    $this->postJson('/login', ['email' => $user->email, 'password' => 'test-password-only'])->assertJsonPath('two_factor', false);
});

test('factor completion rejects replaced deleted and expired password proof even with a valid factor', function (string $mutation, string $factor): void {
    $secret = app(Google2FA::class)->generateSecretKey();
    $recovery = ['test-recovery-one', 'test-recovery-two'];
    $user = User::factory()->verified()->create(['two_factor_secret' => encrypt($secret), 'two_factor_recovery_codes' => encrypt(json_encode($recovery)), 'two_factor_confirmed_at' => now()]);
    $pending = new AccountBrowser($this);
    $other = new AccountBrowser($this);
    $pending->request('POST', '/login', ['email' => $user->email, 'password' => 'test-password-only'])->assertJsonPath('two_factor', true);
    if ($mutation === 'reset') {
        $other->request('POST', '/reset-password', ['email' => $user->email, 'token' => Password::createToken($user), 'password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertOk();
    } elseif ($mutation === 'expired') {
        $this->travel(301)->seconds();
    } else {
        $other->request('POST', '/login', ['email' => $user->email, 'password' => 'test-password-only'])->assertJsonPath('two_factor', true);
        $other->request('POST', '/two-factor-challenge', ['recovery_code' => $recovery[1]])->assertNoContent();
        $other->request('POST', '/user/confirm-password', ['password' => 'test-password-only'])->assertCreated();
        if ($mutation === 'change') {
            $other->request('PUT', '/settings/password', ['password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertNoContent();
        } else {
            $other->request('DELETE', '/settings/account')->assertNoContent();
        }
    }
    $payload = $factor === 'totp' ? ['code' => app(Google2FA::class)->getCurrentOtp($secret)] : ['recovery_code' => $recovery[0]];
    $pending->request('POST', '/two-factor-challenge', $payload)->assertUnauthorized();
    $this->assertGuest();
    expect(session()->has('login'))->toBeFalse();
    if ($mutation !== 'delete') {
        $pending->request('POST', '/login', ['email' => $user->email, 'password' => $mutation === 'expired' ? 'test-password-only' : 'replacement-password'])->assertJsonPath('two_factor', true);
        $pending->request('POST', '/two-factor-challenge', $payload)->assertNoContent();
        $this->assertAuthenticatedAs($user);
    }
})->with(['reset', 'change', 'delete', 'expired'])->with(['totp', 'recovery']);

test('pending authenticator enrollment preserves ordinary password login', function (): void {
    $user = User::factory()->verified()->create();
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $this->postJson('/user/two-factor-authentication')->assertOk();
    $this->postJson('/logout')->assertNoContent();
    Auth::forgetGuards();
    $this->postJson('/login', ['email' => $user->email, 'password' => 'test-password-only'])->assertJsonPath('two_factor', false);
});
