<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Users\User;
use App\Policies\Users\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;

final class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Own the route group while retaining Fortify's supported controllers.
        Fortify::ignoreRoutes();
    }

    public function boot(): void
    {
        Model::unguard();
        Model::shouldBeStrict(! $this->app->isProduction());
        Gate::policy(User::class, UserPolicy::class);
        Gate::define('viewHorizon', fn (User $user): bool => $user->hasVerifiedEmail() && $user->checkPermissionTo('view-horizon'));
        RateLimiter::for('web', fn (Request $request): Limit => Limit::perMinute(120)->by($request->ip()));
        RateLimiter::for('horizon', fn (Request $request): Limit => Limit::perMinute(120)->by($request->user()?->getAuthIdentifier() ?? $request->ip()));
    }
}
