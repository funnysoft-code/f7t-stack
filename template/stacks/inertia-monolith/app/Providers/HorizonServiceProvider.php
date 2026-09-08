<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Users\User;
use Illuminate\Http\Request;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

final class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    protected function authorization(): void
    {
        // Replace the vendor callback, including its local-environment bypass.
        Horizon::auth(function (Request $request): bool {
            $user = $request->user();

            return $user instanceof User
                && $user->hasVerifiedEmail()
                && $user->can('viewHorizon');
        });
    }
}
