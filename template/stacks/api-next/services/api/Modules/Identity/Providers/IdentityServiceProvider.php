<?php

declare(strict_types=1);

namespace Modules\Identity\Providers;

use Dedoc\Scramble\Scramble;
use Illuminate\Support\ServiceProvider;
use Modules\Identity\Console\CreateFirstUserCommand;
use Modules\Identity\Console\HorizonPermissionCommand;
use Modules\Identity\Support\AccountOperationTransformer;
use Modules\Identity\Support\PasskeyOperationTransformer;

final class IdentityServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->register(FortifyServiceProvider::class);
    }

    public function boot(): void
    {
        Scramble::configure()->withOperationTransformers([AccountOperationTransformer::class, PasskeyOperationTransformer::class]);
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
        $this->loadRoutesFrom(__DIR__.'/../Routes/auth.php');
        $this->commands([CreateFirstUserCommand::class, HorizonPermissionCommand::class]);
    }
}
