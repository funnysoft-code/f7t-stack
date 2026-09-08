<?php

declare(strict_types=1);

namespace App\Providers;

use App\Support\Integrations\Turnstile;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Nightwatch\NightwatchServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if (config('nightwatch.enabled')) {
            $this->app->register(NightwatchServiceProvider::class);
        }
    }

    public function boot(): void
    {
        if ($this->app->isProduction()) {
            Turnstile::assertProductionCredentials(config()->string('services.turnstile.site_key', ''), config()->string('services.turnstile.secret_key', ''));
        }
        Model::unguard();
        Model::shouldBeStrict(! $this->app->isProduction());
        RateLimiter::for('horizon', fn (Request $request): Limit => Limit::perMinute(120)->by($request->ip()));
        RateLimiter::for('docs', fn (Request $request): Limit => Limit::perMinute(60)->by($request->ip()));
    }
}
