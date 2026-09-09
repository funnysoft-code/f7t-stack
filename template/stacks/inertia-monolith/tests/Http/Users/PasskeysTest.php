<?php

declare(strict_types=1);

use App\Models\Users\Passkey;
use App\Models\Users\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\RouteCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;
use Tests\Support\TestAuthenticator;

pest()->use(RefreshDatabase::class);

beforeEach(function (): void {
    config(['passkeys.relying_party_id' => 'account.test', 'passkeys.allowed_origins' => ['https://account.test']]);
});

test('a real user verified credential enrolls lists logs in confirms and is removed', function (): void {
    $user = User::factory()->verified()->create(['two_factor_secret' => encrypt(app(Google2FA::class)->generateSecretKey()), 'two_factor_confirmed_at' => now()]);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/user/passkeys/options')->assertOk()->json('options');
    $id = $this->postJson('/user/passkeys', ['name' => 'Test device', 'credential' => $authenticator->register($options)])->assertOk()->json('id');
    assert(is_string($id));
    expect(Str::isUuid($id))->toBeTrue();
    $this->getJson('/user/passkeys')->assertOk()->assertJsonPath('data.0.id', $id)->assertJsonMissingPath('data.0.credential');
    $this->postJson('/logout')->assertNoContent();
    Auth::forgetGuards();
    $options = $this->getJson('/passkeys/login/options')->assertOk()->json('options');
    $this->postJson('/passkeys/login', ['credential' => $authenticator->assert($options)])->assertOk();
    $this->assertAuthenticatedAs($user);
    $this->getJson('/user/confirmed-password-status')->assertJsonPath('confirmed', false);
    $this->deleteJson('/user/passkeys/'.$id)->assertStatus(423);
    $options = $this->getJson('/passkeys/confirm/options')->assertOk()->json('options');
    $this->postJson('/passkeys/confirm', ['credential' => $authenticator->assert($options)])->assertOk();
    $this->deleteJson('/user/passkeys/'.$id)->assertOk();
    $this->postJson('/logout')->assertNoContent();
    Auth::forgetGuards();
    $options = $this->getJson('/passkeys/login/options')->assertOk()->json('options');
    $this->postJson('/passkeys/login', ['credential' => $authenticator->assert($options)])->assertUnprocessable();
    $this->assertGuest();
});

test('invalid and competing registration ceremonies are consumed and restartable', function (string $failure): void {
    $user = User::factory()->verified()->create();
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/user/passkeys/options')->assertOk()->json('options');
    $credential = $authenticator->register($options, origin: $failure === 'origin' ? 'https://other.test' : 'https://account.test', rp: $failure === 'rp' ? 'other.test' : 'account.test');
    if ($failure === 'expired') {
        $this->travel(61)->seconds();
    } elseif ($failure === 'competing') {
        $this->getJson('/user/passkeys/options')->assertOk();
    } elseif ($failure === 'purpose') {
        $this->getJson('/passkeys/confirm/options')->assertOk();
    } elseif ($failure === 'malformed') {
        $credential = [];
    }
    $this->postJson('/user/passkeys', ['name' => 'Device', 'credential' => $credential])->assertUnprocessable();
    expect(session()->has('passkey'))->toBeFalse()->and($user->passkeys()->count())->toBe(0);
    $this->postJson('/user/passkeys', ['name' => 'Device', 'credential' => $credential])->assertUnprocessable();
    $options = $this->getJson('/user/passkeys/options')->assertOk()->json('options');
    $this->postJson('/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk();
})->with(['origin', 'rp', 'expired', 'competing', 'purpose', 'malformed']);

test('assertions reject wrong origin RP absent UV replay and competing options', function (string $failure): void {
    $user = User::factory()->verified()->create();
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/user/passkeys/options')->json('options');
    $this->postJson('/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk();
    $options = $this->getJson('/passkeys/confirm/options')->json('options');
    $credential = $authenticator->assert($options, origin: $failure === 'origin' ? 'https://other.test' : 'https://account.test', rp: $failure === 'rp' ? 'other.test' : 'account.test', verified: $failure !== 'uv');
    if ($failure === 'expired') {
        $this->travel(61)->seconds();
    } elseif ($failure === 'competing') {
        $this->getJson('/passkeys/confirm/options')->assertOk();
    } elseif ($failure === 'replay') {
        $this->postJson('/passkeys/confirm', ['credential' => $credential])->assertOk();
    }
    session()->forget('auth.password_confirmed_at');
    $this->postJson('/passkeys/confirm', ['credential' => $credential])->assertUnprocessable();
    $this->getJson('/user/confirmed-password-status')->assertJsonPath('confirmed', false);
    expect(session()->has('passkey'))->toBeFalse();
    $options = $this->getJson('/passkeys/confirm/options')->json('options');
    $this->postJson('/passkeys/confirm', ['credential' => $authenticator->assert($options)])->assertOk();
})->with(['origin', 'rp', 'uv', 'expired', 'competing', 'replay']);

test('passkeys cannot confirm or be removed by another account and deletion cascades real credentials', function (): void {
    $owner = User::factory()->verified()->create();
    $this->actingAs($owner)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/user/passkeys/options')->json('options');
    $id = $this->postJson('/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk()->json('id');
    assert(is_string($id));
    $other = User::factory()->verified()->create();
    $this->actingAs($other)->withSession(['password_hash_web' => $other->password]);
    $this->getJson('/user/passkeys')->assertExactJson(['data' => []]);
    $this->deleteJson('/user/passkeys/'.$id)->assertForbidden();
    $options = $this->getJson('/passkeys/confirm/options')->json('options');
    $this->postJson('/passkeys/confirm', ['credential' => $authenticator->assert($options)])->assertUnprocessable();
    $this->actingAs($owner)->withSession(['password_hash_web' => $owner->password]);
    session()->forget('auth.password_confirmed_at');
    $options = $this->getJson('/passkeys/confirm/options')->json('options');
    $this->postJson('/passkeys/confirm', ['credential' => $authenticator->assert($options)])->assertOk();
    $this->deleteJson('/settings/account')->assertNoContent();
    expect(Passkey::query()->count())->toBe(0);
    Auth::forgetGuards();
    $options = $this->getJson('/passkeys/login/options')->json('options');
    $this->postJson('/passkeys/login', ['credential' => $authenticator->assert($options)])->assertUnprocessable();
});

test('compiled factor management and secret reads enforce authentication verification and recent proof', function (): void {
    $user = User::factory()->verified()->create();
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/user/passkeys/options')->json('options');
    $id = $this->postJson('/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk()->json('id');
    assert(is_string($id));
    $routes = Route::getRoutes();
    assert($routes instanceof RouteCollection);
    Route::setCompiledRoutes($routes->compile());
    $operations = [['POST', '/user/two-factor-authentication'], ['POST', '/user/confirmed-two-factor-authentication'], ['DELETE', '/user/two-factor-authentication'], ['GET', '/user/two-factor-qr-code'], ['GET', '/user/two-factor-secret-key'], ['GET', '/user/two-factor-recovery-codes'], ['POST', '/user/two-factor-recovery-codes'], ['GET', '/user/passkeys/options'], ['POST', '/user/passkeys'], ['DELETE', '/user/passkeys/'.$id]];
    foreach ($operations as [$method, $path]) {
        session()->forget('auth.password_confirmed_at');
        $this->json($method, $path)->assertStatus(423);
        $this->withSession(['auth.password_confirmed_at' => time() - config()->integer('auth.password_timeout') - 1])->json($method, $path)->assertStatus(423);
    }
    $user->forceFill(['email_verified_at' => null])->save();
    $this->withSession(['auth.password_confirmed_at' => time()]);
    foreach ($operations as [$method, $path]) {
        $this->json($method, $path)->assertForbidden();
    }
    Auth::guard('web')->logoutCurrentDevice();
    foreach ($operations as [$method, $path]) {
        $this->json($method, $path)->assertUnauthorized();
    }
});
