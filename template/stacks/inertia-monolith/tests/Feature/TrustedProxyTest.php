<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Env;
use Illuminate\Support\Facades\Route;

/** @param Closure(): void $test */
function withTrustedProxyEnvironment(string $proxies, Closure $test): void
{
    $key = 'TRUSTED_PROXIES';
    $previousEnvironment = array_intersect_key($_ENV, [$key => true]);
    $previousServer = array_intersect_key($_SERVER, [$key => true]);
    $previousProcess = getenv($key);
    // Clear dotenv's loaded-key marker before setting every environment adapter.
    Env::getRepository()->clear($key);
    try {
        $_ENV[$key] = $_SERVER[$key] = $proxies;
        putenv($key.'='.$proxies);
        $test();
    } finally {
        unset($_ENV[$key], $_SERVER[$key]);
        $_ENV += $previousEnvironment;
        $_SERVER += $previousServer;
        putenv($previousProcess === false ? $key : $key.'='.$previousProcess);
    }
    expect(array_intersect_key($_ENV, [$key => true]))->toBe($previousEnvironment)
        ->and(array_intersect_key($_SERVER, [$key => true]))->toBe($previousServer)
        ->and(getenv($key))->toBe($previousProcess);
}

test('only explicitly trusted proxies can supply the HTTPS scheme', function (string $proxies, string $remote, string $scheme): void {
    withTrustedProxyEnvironment($proxies, function () use ($remote, $scheme): void {
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
    });
})->with([
    'trusted loopback' => ['127.0.0.1,::1', '127.0.0.1', 'https'],
    'trusted IPv6' => ['127.0.0.1, ::1', '::1', 'https'],
    'untrusted caller' => ['127.0.0.1', '192.0.2.25', 'http'],
    'no proxy configured' => ['', '127.0.0.1', 'http'],
]);

test('proxy trust rejects catch-all and caller-controlled entries', function (string $proxies): void {
    withTrustedProxyEnvironment($proxies, function (): void {
        expect(fn () => require config_path('trustedproxy.php'))->toThrow(InvalidArgumentException::class);
    });
})->with(['*', '**', 'REMOTE_ADDR', '0.0.0.0/0', '::/0', 'localhost']);
