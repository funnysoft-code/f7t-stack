<?php

declare(strict_types=1);

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    config(['services.turnstile.enabled' => true, 'services.turnstile.secret_key' => 'test-secret', 'funnysoft.registration_enabled' => true]);
    require base_path('Modules/Identity/Routes/auth.php');
    Route::getRoutes()->refreshNameLookups();
});

test('public routes reject missing invalid and unavailable security checks before account work', function (string $path): void {
    Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => false])]);
    $this->postJson($path, [])->assertUnprocessable()->assertJsonValidationErrors('turnstile_token');
    Http::assertNothingSent();
    $this->postJson($path, ['turnstile_token' => 'rejected'])->assertUnprocessable()->assertJsonValidationErrors('turnstile_token');
    Http::assertSentCount(1);
    Http::fake(fn () => throw new ConnectionException);
    $this->postJson($path, ['turnstile_token' => 'offline'])->assertUnprocessable()->assertJsonValidationErrors('turnstile_token');
})->with(['/api/auth/register', '/api/auth/forgot-password']);

test('verified public tokens reach ordinary field validation exactly once', function (string $path): void {
    Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => true])]);
    $this->postJson($path, ['turnstile_token' => 'verified'])->assertUnprocessable()->assertJsonValidationErrors('email')->assertJsonMissingValidationErrors('turnstile_token');
    Http::assertSentCount(1);
})->with(['/api/auth/register', '/api/auth/forgot-password']);

test('disabled public checks and login send no verification traffic', function (): void {
    Http::fake();
    config(['services.turnstile.enabled' => false]);
    foreach (['/api/auth/register', '/api/auth/forgot-password'] as $path) {
        $this->postJson($path, [])->assertUnprocessable()->assertJsonValidationErrors('email')->assertJsonMissingValidationErrors('turnstile_token');
    }
    config(['services.turnstile.enabled' => true]);
    $this->postJson('/api/auth/login', [])->assertUnprocessable()->assertJsonMissingValidationErrors('turnstile_token');
    Http::assertNothingSent();
});
