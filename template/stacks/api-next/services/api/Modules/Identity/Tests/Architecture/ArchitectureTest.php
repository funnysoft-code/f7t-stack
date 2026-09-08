<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;

arch('module code uses strict types')->expect('Modules\\Identity')->toUseStrictTypes();
arch('module classes are final')->expect('Modules\\Identity')->classes()->toBeFinal();
arch('debug helpers stay out of application code')->expect(['App', 'Modules\\Identity'])->not->toUse(['dd', 'dump', 'ray']);
arch('repositories are concrete')->expect('Modules\\Identity\\Repositories')->not->toBeInterfaces();
arch('actions have the required suffix')->expect('Modules\\Identity\\Actions')->toHaveSuffix('Action');
arch('no abstract action layer')->expect(['App', 'Modules\\Identity'])->not->toHaveSuffix('BaseAction');
arch('no abstract repository layer')->expect(['App', 'Modules\\Identity'])->not->toHaveSuffix('BaseRepository');
arch('public UUIDs do not replace integer primary keys')->expect('Modules\\Identity\\Models')->not->toUse(HasUuids::class);

it('requires a named throttle on every application route', function (): void {
    $unlimited = collect(RouteFacade::getRoutes()->getRoutes())->reject(function (Route $route): bool {
        if ($route->uri() === 'up' || str_starts_with($route->uri(), 'storage/') || str_starts_with($route->uri(), '_boost/')) {
            return true;
        }

        return collect(RouteFacade::gatherRouteMiddleware($route))->contains(fn (string $middleware): bool => preg_match('/(?:^throttle|ThrottleRequests(?:WithRedis)?):[a-z][a-z-]*$/', $middleware) === 1);
    })->map(fn (Route $route): string => $route->uri());

    expect($unlimited->all())->toBeEmpty();
});
