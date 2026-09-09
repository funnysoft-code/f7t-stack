<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Modules\Identity\Models\Users\User;

it('keeps cached settings and factor management gated with no superseded bypass', function (): void {
    expect(Artisan::call('route:cache'))->toBe(0);
    try {
        require app()->getCachedRoutesPath();
        $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password', 'email_verified_at' => now()]);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
        $this->patchJson('/api/auth/settings/profile', ['email' => 'changed@example.test'])->assertStatus(423);
        $this->putJson('/api/auth/settings/password')->assertStatus(423);
        $this->deleteJson('/api/auth/settings/account')->assertStatus(423);
        foreach (['user-profile-information.update', 'user-password.update'] as $name) {
            expect(Route::has($name))->toBeFalse();
        }
        foreach (['/user/profile-information', '/user/password', '/api/auth/user/profile-information', '/api/auth/user/password'] as $path) {
            $this->putJson($path)->assertNotFound();
        }
        foreach (['/user/two-factor-qr-code', '/user/two-factor-secret-key', '/user/two-factor-recovery-codes', '/user/passkeys/options'] as $path) {
            $this->getJson($path)->assertNotFound();
            $this->getJson('/api/auth'.$path)->assertStatus(423);
        }
        foreach (['two-factor.enable', 'two-factor.confirm', 'two-factor.disable', 'two-factor.qr-code', 'two-factor.secret-key', 'two-factor.recovery-codes', 'two-factor.regenerate-recovery-codes', 'passkey.registration-options', 'passkey.store', 'passkey.destroy'] as $name) {
            $route = Route::getRoutes()->getByName($name);
            assert($route instanceof Illuminate\Routing\Route);
            expect($route->gatherMiddleware())->toContain('auth:web', 'verified', 'password.confirm');
            if ($name !== 'passkey.destroy') {
                $method = $route->methods()[0];
                assert(is_string($method));
                $this->json($method, '/'.$route->uri())->assertStatus(423);
                $this->withSession(['auth.password_confirmed_at' => time() - config()->integer('auth.password_timeout') - 1])->json($method, '/'.$route->uri())->assertStatus(423);
            }
        }
        $this->postJson('/api/auth/confirm-password', ['password' => 'test-password'])->assertCreated();
        $this->putJson('/api/auth/settings/password', ['password' => 'new-test-password', 'password_confirmation' => 'new-test-password'])->assertNoContent();
    } finally {
        Artisan::call('route:clear');
    }
});
