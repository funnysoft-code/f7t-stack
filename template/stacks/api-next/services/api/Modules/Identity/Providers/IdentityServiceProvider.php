<?php

declare(strict_types=1);

namespace Modules\Identity\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Identity\Console\CreateFirstUserCommand;
use Modules\Identity\Console\HorizonPermissionCommand;

final class IdentityServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->register(FortifyServiceProvider::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
        $this->loadRoutesFrom(__DIR__.'/../Routes/auth.php');
        $this->commands([CreateFirstUserCommand::class, HorizonPermissionCommand::class]);
    }
}
