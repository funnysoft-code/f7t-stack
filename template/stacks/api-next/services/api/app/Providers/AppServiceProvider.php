<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // U6 registers the installed Fortify account flows in Identity.
        Fortify::ignoreRoutes();
    }

    public function boot(): void
    {
        Model::unguard();
        Model::shouldBeStrict(! $this->app->isProduction());
        RateLimiter::for('horizon', fn (Request $request): Limit => Limit::perMinute(120)->by($request->ip()));
        RateLimiter::for('docs', fn (Request $request): Limit => Limit::perMinute(60)->by($request->ip()));
    }
}
