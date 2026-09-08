<?php

declare(strict_types=1);

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Routing\RouteCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Modules\Identity\Models\Users\Passkey;
use Modules\Identity\Models\Users\User;
use PragmaRX\Google2FA\Google2FA;
use Tests\Support\TestAuthenticator;

beforeEach(function (): void {
    config(['passkeys.relying_party_id' => 'account.test', 'passkeys.allowed_origins' => ['https://account.test']]);
});

it('returns a public UUID from real enrollment and uses it for listing confirmation and removal', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'passkey@example.test', 'password' => 'test-password', 'email_verified_at' => now(), 'two_factor_secret' => encrypt(app(Google2FA::class)->generateSecretKey()), 'two_factor_confirmed_at' => now()]);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/api/auth/user/passkeys/options')->assertOk()->json('options');
    $result = $this->postJson('/api/auth/user/passkeys', ['name' => 'Test device', 'credential' => $authenticator->register($options)])->assertOk();
    $id = $result->json('data.uuid');
    assert(is_string($id));
    expect(Str::isUuid($id))->toBeTrue();
    $result->assertJsonMissingPath('id')->assertJsonMissingPath('data.id')->assertJsonMissingPath('data.credential');
    $this->getJson('/api/auth/user/passkeys')->assertOk()->assertJsonPath('data.0.uuid', $id)->assertJsonMissingPath('data.0.credential')->assertJsonMissingPath('data.0.id');
    $this->postJson('/api/auth/logout')->assertNoContent();
    Auth::forgetGuards();
    $options = $this->getJson('/api/auth/passkeys/login/options')->assertOk()->json('options');
    $this->postJson('/api/auth/passkeys/login', ['credential' => $authenticator->assert($options)])->assertOk();
    $this->assertAuthenticatedAs($user);
    $this->getJson('/api/auth/confirmed-password-status')->assertJsonPath('confirmed', false);
    $this->deleteJson('/api/auth/user/passkeys/'.$id)->assertStatus(423);
    $options = $this->getJson('/api/auth/passkeys/confirm/options')->assertOk()->json('options');
    $this->postJson('/api/auth/passkeys/confirm', ['credential' => $authenticator->assert($options)])->assertOk();
    $this->deleteJson('/api/auth/user/passkeys/'.$id)->assertOk();
    $this->postJson('/api/auth/logout')->assertNoContent();
    Auth::forgetGuards();
    $options = $this->getJson('/api/auth/passkeys/login/options')->assertOk()->json('options');
    $this->postJson('/api/auth/passkeys/login', ['credential' => $authenticator->assert($options)])->assertUnprocessable();
    $this->assertGuest();
});

it('consumes invalid and competing registration ceremonies and permits a fresh restart', function (string $failure): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'passkey@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/api/auth/user/passkeys/options')->assertOk()->json('options');
    $credential = $authenticator->register($options, origin: $failure === 'origin' ? 'https://other.test' : 'https://account.test', rp: $failure === 'rp' ? 'other.test' : 'account.test');
    if ($failure === 'expired') {
        $this->travel(61)->seconds();
    } elseif ($failure === 'competing') {
        $this->getJson('/api/auth/user/passkeys/options')->assertOk();
    } elseif ($failure === 'purpose') {
        $this->getJson('/api/auth/passkeys/confirm/options')->assertOk();
    } elseif ($failure === 'malformed') {
        $credential = [];
    }
    $this->postJson('/api/auth/user/passkeys', ['name' => 'Device', 'credential' => $credential])->assertUnprocessable()->assertHeader('Cache-Control', 'no-store, private');
    expect(session()->has('passkey'))->toBeFalse()->and($user->passkeys()->count())->toBe(0);
    $this->postJson('/api/auth/user/passkeys', ['name' => 'Device', 'credential' => $credential])->assertUnprocessable();
    $options = $this->getJson('/api/auth/user/passkeys/options')->assertOk()->json('options');
    $this->postJson('/api/auth/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk();
})->with(['origin', 'rp', 'expired', 'competing', 'purpose', 'malformed']);

it('rejects assertions with wrong origin RP absent UV replay and competing options', function (string $failure): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'passkey@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/api/auth/user/passkeys/options')->json('options');
    $this->postJson('/api/auth/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk();
    $options = $this->getJson('/api/auth/passkeys/confirm/options')->json('options');
    $credential = $authenticator->assert($options, origin: $failure === 'origin' ? 'https://other.test' : 'https://account.test', rp: $failure === 'rp' ? 'other.test' : 'account.test', verified: $failure !== 'uv');
    if ($failure === 'expired') {
        $this->travel(61)->seconds();
    } elseif ($failure === 'competing') {
        $this->getJson('/api/auth/passkeys/confirm/options')->assertOk();
    } elseif ($failure === 'replay') {
        $this->postJson('/api/auth/passkeys/confirm', ['credential' => $credential])->assertOk();
    }
    session()->forget('auth.password_confirmed_at');
    $this->postJson('/api/auth/passkeys/confirm', ['credential' => $credential])->assertUnprocessable();
    $this->getJson('/api/auth/confirmed-password-status')->assertJsonPath('confirmed', false);
    expect(session()->has('passkey'))->toBeFalse();
    $options = $this->getJson('/api/auth/passkeys/confirm/options')->json('options');
    $this->postJson('/api/auth/passkeys/confirm', ['credential' => $authenticator->assert($options)])->assertOk();
})->with(['origin', 'rp', 'uv', 'expired', 'competing', 'replay']);

it('forbids cross account confirmation removal and integer binding and cascades account deletion', function (): void {
    $owner = User::query()->create(['name' => 'Owner', 'email' => 'passkey@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->actingAs($owner)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/api/auth/user/passkeys/options')->json('options');
    $id = $this->postJson('/api/auth/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk()->json('data.uuid');
    assert(is_string($id));
    $this->deleteJson('/api/auth/user/passkeys/'.$owner->passkeys()->firstOrFail()->id)->assertNotFound();
    $other = User::query()->create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->actingAs($other)->withSession(['password_hash_web' => $other->password]);
    $this->getJson('/api/auth/user/passkeys')->assertExactJson(['data' => []]);
    $this->deleteJson('/api/auth/user/passkeys/'.$id)->assertForbidden();
    $options = $this->getJson('/api/auth/passkeys/confirm/options')->json('options');
    $this->postJson('/api/auth/passkeys/confirm', ['credential' => $authenticator->assert($options)])->assertUnprocessable();
    $this->actingAs($owner)->withSession(['password_hash_web' => $owner->password]);
    session()->forget('auth.password_confirmed_at');
    $options = $this->getJson('/api/auth/passkeys/confirm/options')->json('options');
    $this->postJson('/api/auth/passkeys/confirm', ['credential' => $authenticator->assert($options)])->assertOk();
    $this->deleteJson('/api/auth/settings/account')->assertNoContent();
    expect(Passkey::query()->count())->toBe(0);
    Auth::forgetGuards();
    $options = $this->getJson('/api/auth/passkeys/login/options')->json('options');
    $this->postJson('/api/auth/passkeys/login', ['credential' => $authenticator->assert($options)])->assertUnprocessable();
});

it('rolls back real credential deletion and preserves authentication when account deletion fails', function (): void {
    Schema::create('account_references', function (Blueprint $table): void {
        $table->foreignId('user_id')->constrained('users');
    });
    $user = User::query()->create(['name' => 'User', 'email' => 'passkey@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    DB::table('account_references')->insert(['user_id' => $user->id]);
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password', 'remember' => true])->assertOk();
    $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/api/auth/user/passkeys/options')->json('options');
    $this->postJson('/api/auth/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk();
    $token = Password::createToken($user);
    $this->deleteJson('/api/auth/settings/account')->assertServerError();
    $this->assertAuthenticatedAs($user);
    expect($user->passkeys()->count())->toBe(1)->and(Password::tokenExists($user, $token))->toBeTrue();
    $this->getJson('/api/auth/me')->assertOk();
});

it('gates every compiled factor management and secret read with authentication verification and recent proof', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'passkey@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);
    $authenticator = new TestAuthenticator;
    $options = $this->getJson('/api/auth/user/passkeys/options')->json('options');
    $id = $this->postJson('/api/auth/user/passkeys', ['name' => 'Device', 'credential' => $authenticator->register($options)])->assertOk()->json('data.uuid');
    assert(is_string($id));
    $routes = Route::getRoutes();
    assert($routes instanceof RouteCollection);
    Route::setCompiledRoutes($routes->compile());
    $operations = [['POST', '/user/two-factor-authentication'], ['POST', '/user/confirmed-two-factor-authentication'], ['DELETE', '/user/two-factor-authentication'], ['GET', '/user/two-factor-qr-code'], ['GET', '/user/two-factor-secret-key'], ['GET', '/user/two-factor-recovery-codes'], ['POST', '/user/two-factor-recovery-codes'], ['GET', '/user/passkeys/options'], ['POST', '/user/passkeys'], ['DELETE', '/user/passkeys/'.$id]];
    foreach ($operations as [$method, $path]) {
        session()->forget('auth.password_confirmed_at');
        $this->json($method, '/api/auth'.$path)->assertStatus(423)->assertHeader('Cache-Control', 'no-store, private');
        $this->withSession(['auth.password_confirmed_at' => time() - config()->integer('auth.password_timeout') - 1])->json($method, '/api/auth'.$path)->assertStatus(423);
    }
    $user->forceFill(['email_verified_at' => null])->save();
    $this->withSession(['auth.password_confirmed_at' => time()]);
    foreach ($operations as [$method, $path]) {
        $this->json($method, '/api/auth'.$path)->assertForbidden();
    }
    Auth::guard('web')->logoutCurrentDevice();
    foreach ($operations as [$method, $path]) {
        $this->json($method, '/api/auth'.$path)->assertUnauthorized();
    }
});
