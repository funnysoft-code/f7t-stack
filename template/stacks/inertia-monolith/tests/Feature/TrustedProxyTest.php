<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

afterEach(function (): void {
    unset($_ENV['TRUSTED_PROXIES']);
});

test('only explicitly trusted proxies can supply the HTTPS scheme', function (string $proxies, string $remote, string $scheme): void {
    $_ENV['TRUSTED_PROXIES'] = $proxies;
    $this->refreshApplication();
    Route::get('/proxy-test', fn (Request $request): array => [
        'secure' => $request->isSecure(),
        'asset' => asset('build/test.js'),
    ]);

    $this->withServerVariables(['REMOTE_ADDR' => $remote])
        ->withHeaders(['Host' => 'app.example.test', 'X-Forwarded-Proto' => 'https', 'X-Forwarded-Host' => 'spoof.example.test'])
        ->getJson('http://app.example.test/proxy-test')->assertOk()
        ->assertJsonPath('secure', $scheme === 'https')
        ->assertJsonPath('asset', $scheme.'://app.example.test/build/test.js');
})->with([
    'trusted loopback' => ['127.0.0.1,::1', '127.0.0.1', 'https'],
    'trusted IPv6' => ['127.0.0.1, ::1', '::1', 'https'],
    'untrusted caller' => ['127.0.0.1', '192.0.2.25', 'http'],
    'no proxy configured' => ['', '127.0.0.1', 'http'],
]);

test('proxy trust rejects catch-all and caller-controlled entries', function (string $proxies): void {
    $_ENV['TRUSTED_PROXIES'] = $proxies;
    expect(fn () => require config_path('trustedproxy.php'))->toThrow(InvalidArgumentException::class);
})->with(['*', '**', 'REMOTE_ADDR', '0.0.0.0/0', '::/0', 'localhost']);
