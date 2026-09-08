<?php

declare(strict_types=1);

namespace App\Repositories\Users;

use App\Data\Users\CreateUserData;
use App\Models\Users\User;

final class UserRepository
{
    public function create(CreateUserData $data): User
    {
        return User::query()->create(['name' => $data->name, 'email' => $data->email, 'password' => $data->password]);
    }

    public function updatePassword(User $user, string $password): void
    {
        $user->forceFill(['password' => $password])->save();
    }
}
