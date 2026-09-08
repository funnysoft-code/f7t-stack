<?php

declare(strict_types=1);

use Illuminate\Support\Env;
use Illuminate\Support\Facades\Route;

test('cached enabled registration routes fail closed with newly cached disabled configuration', function (): void {
    $environment = Env::getRepository();
    $original = $environment->get('FUNNYSOFT_REGISTRATION_ENABLED');
    try {
        $environment->set('FUNNYSOFT_REGISTRATION_ENABLED', 'true');
        $this->console('config:clear')->assertSuccessful();
        $this->console('route:cache')->assertSuccessful();
        $this->refreshApplication();
        expect(Route::has('register'))->toBeTrue();
        $this->getJson('/register')->assertOk()->assertJsonPath('props.capabilities.registrationEnabled', true);

        $environment->set('FUNNYSOFT_REGISTRATION_ENABLED', 'false');
        $this->console('config:cache')->assertSuccessful();
        $this->refreshApplication();
        expect(app()->routesAreCached())->toBeTrue()->and(app()->configurationIsCached())->toBeTrue()->and(Route::has('register'))->toBeTrue();
        $this->getJson('/register')->assertNotFound();
        $this->postJson('/register', [])->assertNotFound();
        $this->getJson('/login')->assertOk()->assertJsonPath('props.capabilities.registrationEnabled', false);
    } finally {
        $this->console('config:clear')->assertSuccessful();
        $this->console('route:clear')->assertSuccessful();
        if ($original === null) {
            $environment->clear('FUNNYSOFT_REGISTRATION_ENABLED');
        } else {
            $environment->set('FUNNYSOFT_REGISTRATION_ENABLED', $original);
        }
    }
});
