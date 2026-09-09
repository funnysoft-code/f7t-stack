<?php

declare(strict_types=1);

use Illuminate\Support\Env;
use Illuminate\Support\Facades\Route;

test('cached enabled registration routes fail closed with newly cached disabled configuration', function (): void {
    $key = 'FUNNYSOFT_REGISTRATION_ENABLED';
    $previousEnvironment = array_intersect_key($_ENV, [$key => true]);
    $previousServer = array_intersect_key($_SERVER, [$key => true]);
    $previousProcess = getenv($key);
    // Clear dotenv's loaded-key marker before setting the higher-priority adapters.
    Env::getRepository()->clear($key);
    try {
        $_ENV[$key] = $_SERVER[$key] = 'true';
        putenv($key.'=true');
        $this->console('config:clear')->assertSuccessful();
        $this->console('route:cache')->assertSuccessful();
        $this->refreshApplication();
        expect(Route::has('register'))->toBeTrue();
        $this->getJson('/register')->assertOk()->assertJsonPath('props.capabilities.registrationEnabled', true);

        $_ENV[$key] = $_SERVER[$key] = 'false';
        putenv($key.'=false');
        $this->console('config:cache')->assertSuccessful();
        $this->refreshApplication();
        expect(app()->routesAreCached())->toBeTrue()->and(app()->configurationIsCached())->toBeTrue()->and(Route::has('register'))->toBeTrue();
        $this->getJson('/register')->assertNotFound();
        $this->postJson('/register', [])->assertNotFound();
        $this->getJson('/login')->assertOk()->assertJsonPath('props.capabilities.registrationEnabled', false);
    } finally {
        try {
            $this->console('config:clear')->assertSuccessful();
            $this->console('route:clear')->assertSuccessful();
        } finally {
            unset($_ENV[$key], $_SERVER[$key]);
            $_ENV += $previousEnvironment;
            $_SERVER += $previousServer;
            putenv($previousProcess === false ? $key : $key.'='.$previousProcess);
        }
    }
    expect(array_intersect_key($_ENV, [$key => true]))->toBe($previousEnvironment)
        ->and(array_intersect_key($_SERVER, [$key => true]))->toBe($previousServer)
        ->and(getenv($key))->toBe($previousProcess);
});
