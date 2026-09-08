<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;
use Modules\Identity\Models\Users\User;

final class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    protected function gate(): void
    {
        Gate::define('viewHorizon', fn (User $user): bool => $user->hasVerifiedEmail() && $user->can('view-horizon'));
    }

    protected function authorization(): void
    {
        $this->gate();
        // The package default permits every local request. Apply the gate everywhere.
        Horizon::auth(fn (Request $request): bool => Gate::forUser($request->user())->allows('viewHorizon'));
    }
}
