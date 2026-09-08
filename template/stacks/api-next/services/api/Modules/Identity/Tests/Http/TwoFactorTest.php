<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Password;
use Modules\Identity\Models\Users\User;
use PragmaRX\Google2FA\Google2FA;
use Tests\Support\AccountBrowser;

it('enrolls and confirms an authenticator through protected package HTTP routes', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'factor@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->actingAs($user);
    foreach (['/api/auth/user/two-factor-qr-code', '/api/auth/user/two-factor-secret-key', '/api/auth/user/two-factor-recovery-codes'] as $path) {
        $this->getJson($path)->assertStatus(423);
    }
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $this->postJson('/api/auth/user/two-factor-authentication')->assertOk();
    $secret = $this->getJson('/api/auth/user/two-factor-secret-key')->assertOk()->json('secretKey');
    assert(is_string($secret));
    $this->getJson('/api/auth/user/two-factor-qr-code')->assertOk()->assertJsonStructure(['svg', 'url']);
    $this->postJson('/api/auth/user/confirmed-two-factor-authentication', ['code' => app(Google2FA::class)->getCurrentOtp($secret)])->assertOk();
    $this->getJson('/api/auth/user/two-factor-recovery-codes')->assertOk();
    $this->deleteJson('/api/auth/user/two-factor-authentication')->assertOk();
    expect($user->refresh()->two_factor_secret)->toBeNull();
});

it('rejects replaced deleted and expired password proof at actual factor completion', function (string $mutation, string $factor): void {
    $secret = app(Google2FA::class)->generateSecretKey();
    $recovery = ['test-recovery-one', 'test-recovery-two'];
    $user = User::query()->create(['name' => 'User', 'email' => 'factor@example.test', 'password' => 'test-password', 'email_verified_at' => now(), 'two_factor_secret' => encrypt($secret), 'two_factor_recovery_codes' => encrypt(json_encode($recovery)), 'two_factor_confirmed_at' => now()]);
    $pending = new AccountBrowser($this);
    $other = new AccountBrowser($this);
    $pending->request('POST', '/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertJsonPath('two_factor', true);
    if ($mutation === 'reset') {
        $other->request('POST', '/api/auth/reset-password', ['email' => $user->email, 'token' => Password::createToken($user), 'password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertOk();
    } elseif ($mutation === 'expired') {
        $this->travel(301)->seconds();
    } else {
        $other->request('POST', '/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertJsonPath('two_factor', true);
        $other->request('POST', '/api/auth/two-factor-challenge', ['recovery_code' => $recovery[1]])->assertNoContent();
        $other->request('POST', '/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
        if ($mutation === 'change') {
            $other->request('PUT', '/api/auth/settings/password', ['password' => 'replacement-password', 'password_confirmation' => 'replacement-password'])->assertNoContent();
        } else {
            $other->request('DELETE', '/api/auth/settings/account')->assertNoContent();
        }
    }
    $payload = $factor === 'totp' ? ['code' => app(Google2FA::class)->getCurrentOtp($secret)] : ['recovery_code' => $recovery[0]];
    $pending->request('POST', '/api/auth/two-factor-challenge', $payload)->assertUnauthorized();
    $this->assertGuest();
    expect(session()->has('login'))->toBeFalse();
    if ($mutation !== 'delete') {
        $pending->request('POST', '/api/auth/login', ['email' => $user->email, 'password' => $mutation === 'expired' ? 'test-password' : 'replacement-password'])->assertJsonPath('two_factor', true);
        $pending->request('POST', '/api/auth/two-factor-challenge', $payload)->assertNoContent();
        $this->assertAuthenticatedAs($user);
    }
})->with(['reset', 'change', 'delete', 'expired'])->with(['totp', 'recovery']);

it('keeps pending enrollment optional and recovery codes single use with rotation invalidating old codes', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'factor@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $browser = new AccountBrowser($this);
    $browser->request('POST', '/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertJsonPath('two_factor', false);
    $browser->request('POST', '/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $browser->request('POST', '/api/auth/user/two-factor-authentication')->assertOk();
    $secret = $browser->request('GET', '/api/auth/user/two-factor-secret-key')->json('secretKey');
    assert(is_string($secret));
    $browser->request('POST', '/api/auth/logout')->assertNoContent();
    $browser->request('POST', '/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertJsonPath('two_factor', false);
    $browser->request('POST', '/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $browser->request('POST', '/api/auth/user/confirmed-two-factor-authentication', ['code' => 'invalid'])->assertUnprocessable();
    $browser->request('POST', '/api/auth/user/confirmed-two-factor-authentication', ['code' => app(Google2FA::class)->getCurrentOtp($secret)])->assertOk();
    $old = $browser->request('GET', '/api/auth/user/two-factor-recovery-codes')->json();
    $browser->request('POST', '/api/auth/user/two-factor-recovery-codes')->assertOk();
    $codes = $browser->request('GET', '/api/auth/user/two-factor-recovery-codes')->json();
    assert(is_array($codes) && is_array($old));
    foreach ($old as $oldCode) {
        expect($codes)->not->toContain($oldCode);
    }
    $browser->request('POST', '/api/auth/logout')->assertNoContent();
    $this->travel(61)->seconds();
    $browser->request('POST', '/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertJsonPath('two_factor', true);
    $browser->request('POST', '/api/auth/two-factor-challenge', ['recovery_code' => $old[0]])->assertUnprocessable();
    $browser->request('POST', '/api/auth/two-factor-challenge', ['recovery_code' => $codes[0]])->assertNoContent();
    $browser->request('POST', '/api/auth/logout')->assertNoContent();
    $browser->request('POST', '/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertJsonPath('two_factor', true);
    $browser->request('POST', '/api/auth/two-factor-challenge', ['recovery_code' => $codes[0]])->assertUnprocessable();
    $browser->request('POST', '/api/auth/two-factor-challenge', ['recovery_code' => $codes[1]])->assertNoContent();
    $browser->request('DELETE', '/api/auth/user/two-factor-authentication')->assertStatus(423);
    $browser->request('POST', '/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $browser->request('DELETE', '/api/auth/user/two-factor-authentication')->assertOk();
    $browser->request('POST', '/api/auth/logout')->assertNoContent();
    $browser->request('POST', '/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertJsonPath('two_factor', false);
});
