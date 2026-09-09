<?php

declare(strict_types=1);

use App\Models\Users\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('account pages preserve only same-origin intended destinations', function (): void {
    $this->withSession(['url.intended' => url('/settings/security')])->getJson('/login')->assertJsonPath('props.returnTo', '/settings/security');
    $this->withSession(['url.intended' => 'https://outside.example/'])->getJson('/login')->assertJsonPath('props.returnTo', '/');
});

test('session-bearing HTML cannot be stored by browsers or shared caches', function (): void {
    $this->get('/login')->assertOk()->assertHeader('Cache-Control', 'no-store, private');
    $user = User::factory()->verified()->create();
    $this->actingAs($user)->get('/settings/profile')->assertOk()->assertHeader('Cache-Control', 'no-store, private');
    $this->get('/up')->assertOk()->assertHeaderMissing('Set-Cookie');
    expect($this->get('/up')->headers->get('Cache-Control'))->not->toContain('no-store');
});

test('settings pages deny guests and unverified accounts', function (string $path): void {
    $this->get($path)->assertRedirect('/login');
    $this->actingAs(User::factory()->create())->get($path)->assertRedirect('/email/verify');
})->with(['/settings/profile', '/settings/security', '/settings/passkeys', '/settings/authenticator', '/settings/recovery', '/settings/delete']);

test('settings pages expose only safe typed account summaries', function (string $path, string $component): void {
    $user = User::factory()->verified()->create();
    $this->actingAs($user)->getJson($path)->assertOk()->assertJsonPath('component', $component)
        ->assertJsonPath('props.account.email', $user->email)
        ->assertJsonPath('props.account.verified', true)
        ->assertJsonPath('props.account.passkeyCount', 0)
        ->assertJsonMissingPath('props.account.password')
        ->assertJsonMissingPath('props.account.two_factor_secret');
})->with([
    ['/settings/profile', 'settings/profile'], ['/settings/security', 'settings/security'],
    ['/settings/passkeys', 'settings/passkeys'], ['/settings/authenticator', 'settings/authenticator'],
    ['/settings/recovery', 'settings/recovery'], ['/settings/delete', 'settings/delete-account'],
]);
