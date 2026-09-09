<?php

declare(strict_types=1);

namespace Modules\Identity\Console;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Modules\Identity\Models\Users\User;
use Spatie\Permission\Models\Permission;

#[Description('Grant or revoke only the Horizon permission for one account')]
#[Signature('funnysoft:horizon-permission {operation : grant or revoke} {email}')]
final class HorizonPermissionCommand extends Command
{
    public function handle(): int
    {
        $operation = $this->argument('operation');
        $user = User::query()->where('email', $this->argument('email'))->first();
        if (! in_array($operation, ['grant', 'revoke'], true) || ! $user instanceof User) {
            $this->error('Supply grant or revoke and an existing account email.');

            return self::FAILURE;
        }
        $permission = Permission::findOrCreate('view-horizon', 'web');
        if ($operation === 'grant') {
            $user->givePermissionTo($permission);
        } else {
            $user->revokePermissionTo($permission);
        }
        $this->info('Horizon permission updated. Access also requires a verified email.');

        return self::SUCCESS;
    }
}
