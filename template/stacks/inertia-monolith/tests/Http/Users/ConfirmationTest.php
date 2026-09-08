<?php

declare(strict_types=1);

use App\Models\Users\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\RouteCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Events\TwoFactorAuthenticationChallenged;
use Laravel\Fortify\Features;

pest()->use(RefreshDatabase::class);

test('compiled sensitive routes use native confirmation and return 423 again after expiry', function (): void {
    $routes = Route::getRoutes();
    assert($routes instanceof RouteCollection);
    Route::setCompiledRoutes($routes->compile());
    $this->deleteJson('/settings/account')->assertUnauthorized();
    Notification::fake();
    $user = User::factory()->verified()->create();
    $this->actingAs($user);
    $this->patchJson('/settings/profile', ['name' => $user->name, 'email' => 'new@example.test'])->assertStatus(423);
    $this->putJson('/settings/password')->assertStatus(423);
    $this->deleteJson('/settings/account')->assertStatus(423);
    $this->withSession(['auth.password_confirmed_at' => time() - config()->integer('auth.password_timeout') - 1]);
    $this->delete('/settings/account')->assertRedirect('/user/confirm-password');
    $this->postJson('/user/confirm-password', ['password' => 'wrong'])->assertUnprocessable();
    $this->postJson('/user/confirm-password', ['password' => 'test-password-only'])->assertCreated();
    $this->getJson('/user/confirmed-password-status')->assertJson(['confirmed' => true]);
    $this->putJson('/settings/password', ['password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password'])->assertNoContent();
    $this->travel(config()->integer('auth.password_timeout') + 1)->seconds();
    $this->deleteJson('/settings/account')->assertStatus(423);
});

test('superseded vendor profile and password writes are not registered', function (): void {
    expect(Route::has('user-profile-information.update'))->toBeFalse()->and(Route::has('user-password.update'))->toBeFalse();
    $this->actingAs(User::factory()->create())->putJson('/user/password')->assertNotFound();
    $this->putJson('/user/profile-information')->assertNotFound();
});

test('pending password proof binds the accepted credential and reset invalidates it', function (): void {
    $user = User::factory()->create();
    $this->withSession(['login.id' => $user->id]);
    event(new TwoFactorAuthenticationChallenged($user));
    expect(session('login.credential_hash'))->toBe($user->password);
    $this->getJson('/login')->assertOk();
    expect(session('login.id'))->toBe($user->id);
    $token = Password::createToken($user);
    $this->postJson('/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'new-secure-password', 'password_confirmation' => 'new-secure-password'])->assertOk();
    $this->getJson('/login')->assertOk();
    expect(session()->has('login'))->toBeFalse();
});

test('missing expired and deleted pending proof fails closed', function (): void {
    $user = User::factory()->create();
    $this->withSession(['login.id' => $user->id])->getJson('/login')->assertOk();
    expect(session()->has('login'))->toBeFalse();
    $this->withSession(['login.id' => $user->id, 'login.credential_hash' => $user->password, 'login.issued_at' => time() - 301])->getJson('/login')->assertOk();
    expect(session()->has('login'))->toBeFalse();
    $user->delete();
    $this->withSession(['login.id' => $user->id, 'login.credential_hash' => $user->password, 'login.issued_at' => time()])->getJson('/login')->assertOk();
    expect(session()->has('login'))->toBeFalse();
});

test('future factor routes enforce confirmation even when vendor feature options omit it', function (): void {
    config(['fortify.features' => [Features::twoFactorAuthentication()]]);
    require base_path('routes/auth.php');
    Route::getRoutes()->refreshNameLookups();
    $routes = Route::getRoutes();
    assert($routes instanceof RouteCollection);
    Route::setCompiledRoutes($routes->compile());
    $this->actingAs(User::factory()->verified()->create());
    foreach ([
        ['POST', '/user/two-factor-authentication'],
        ['POST', '/user/confirmed-two-factor-authentication'],
        ['DELETE', '/user/two-factor-authentication'],
        ['GET', '/user/two-factor-qr-code'],
        ['GET', '/user/two-factor-secret-key'],
        ['GET', '/user/two-factor-recovery-codes'],
        ['POST', '/user/two-factor-recovery-codes'],
    ] as [$method, $uri]) {
        $this->json($method, $uri)->assertStatus(423);
    }
    $this->withSession(['login.id' => 'deleted-user', 'login.credential_hash' => 'stale', 'login.issued_at' => time()]);
    Auth::guard('web')->logoutCurrentDevice();
    $this->postJson('/two-factor-challenge', ['code' => '123456'])->assertUnauthorized();
    expect(session()->has('login'))->toBeFalse();
});
