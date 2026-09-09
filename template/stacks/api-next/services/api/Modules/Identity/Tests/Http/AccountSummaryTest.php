<?php

declare(strict_types=1);

use Modules\Identity\Models\Users\User;

it('keeps the frontend WebAuthn origin after Fortify boots', function (): void {
    expect(config('passkeys.relying_party_id'))->toBe(parse_url(config()->string('funnysoft.frontend_url'), PHP_URL_HOST))
        ->and(config('passkeys.allowed_origins'))->toBe([config('funnysoft.frontend_url')]);
});

it('reports safe authenticator lifecycle state without exposing secrets', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'summary@example.test', 'password' => 'test-password']);
    $this->actingAs($user)->getJson('/api/auth/me')->assertOk()
        ->assertJsonPath('data.two_factor_enabled', false)
        ->assertJsonPath('data.two_factor_confirmed', false);
    $user->forceFill(['two_factor_secret' => encrypt('test-only-secret')])->save();
    $this->getJson('/api/auth/me')->assertJsonPath('data.two_factor_enabled', true)
        ->assertJsonPath('data.two_factor_confirmed', false)
        ->assertJsonMissingPath('data.two_factor_secret');
    $user->forceFill(['two_factor_confirmed_at' => now()])->save();
    $this->getJson('/api/auth/me')->assertJsonPath('data.two_factor_confirmed', true);
    $user->forceFill(['two_factor_secret' => null, 'two_factor_confirmed_at' => null])->save();
    $this->getJson('/api/auth/me')->assertJsonPath('data.two_factor_enabled', false)
        ->assertJsonPath('data.two_factor_confirmed', false);
});
