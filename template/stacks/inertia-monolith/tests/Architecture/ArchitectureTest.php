<?php

declare(strict_types=1);

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

arch('application classes use strict types')->expect('App')->toUseStrictTypes();
arch('application classes are final')->expect('App')->toBeFinal();
arch('debug helpers are forbidden')->expect(['dd', 'dump', 'ray'])->not->toBeUsed();
arch('actions are concrete write entry points')->expect('App\Actions')->toBeClasses()->toHaveSuffix('Action')->toHaveMethod('execute')->not->toUse([DB::class, Model::class]);
arch('repositories are concrete')->expect('App\Repositories')->toBeClasses()->not->toBeInterfaces();

test('product routes have named throttles', function (): void {
    app(Kernel::class);
    foreach (Route::getRoutes()->getRoutes() as $route) {
        if ($route->uri() === 'up' || str_starts_with($route->uri(), 'storage/') || str_starts_with($route->uri(), '_boost/')) {
            continue;
        }

        $middleware = array_filter(Route::gatherRouteMiddleware($route), is_string(...));
        $throttles = array_filter($middleware, fn (string $middleware): bool => str_starts_with($middleware, ThrottleRequests::class.':'));
        expect($throttles)->not->toBeEmpty($route->uri());
        foreach ($throttles as $throttle) {
            expect(is_numeric(explode(':', $throttle)[1]))->toBeFalse();
        }
    }
});
