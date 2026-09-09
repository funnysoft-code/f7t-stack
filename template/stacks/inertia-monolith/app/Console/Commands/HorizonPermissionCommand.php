<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Users\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;

#[Description('Grant or revoke only the view-horizon permission for one existing account')]
#[Signature('funnysoft:horizon-permission {action : grant or revoke} {email}')]
final class HorizonPermissionCommand extends Command
{
    public function handle(): int
    {
        $action = $this->argument('action');
        if (! in_array($action, ['grant', 'revoke'], true)) {
            $this->error('Action must be grant or revoke.');

            return self::FAILURE;
        }
        $user = User::query()->where('email', Str::lower((string) $this->argument('email')))->first();
        if (! $user instanceof User) {
            $this->error('Account not found.');

            return self::FAILURE;
        }
        $permission = Permission::findOrCreate('view-horizon', 'web');
        if ($action === 'grant') {
            $user->givePermissionTo($permission);
        } else {
            $user->revokePermissionTo($permission);
        }
        $this->info('Horizon permission updated. Email verification is still required.');

        return self::SUCCESS;
    }
}
