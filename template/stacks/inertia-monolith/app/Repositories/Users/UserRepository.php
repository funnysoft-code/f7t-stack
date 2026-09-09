<?php

declare(strict_types=1);

namespace App\Repositories\Users;

use App\Data\Users\CreateUserData;
use App\Data\Users\UpdatePasswordData;
use App\Data\Users\UpdateProfileData;
use App\Models\Users\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use SensitiveParameter;

final readonly class UserRepository
{
    public function create(CreateUserData $data): User
    {
        return User::query()->create(['name' => $data->name, 'email' => $data->email, 'password' => $data->password]);
    }

    public function updatePassword(User $user, #[SensitiveParameter] UpdatePasswordData $data): void
    {
        DB::transaction(function () use ($user, $data): void {
            $user->forceFill(['password' => $data->password, 'remember_token' => Str::random(60)])->save();
            Password::deleteToken($user);
        });
    }

    public function find(string $id): ?User
    {
        return Str::isUuid($id) ? User::query()->find($id) : null;
    }

    public function updateProfile(User $user, UpdateProfileData $data): bool
    {
        return DB::transaction(function () use ($user, $data): bool {
            $changed = $user->email !== $data->email;
            if ($changed) {
                Password::deleteToken($user);
                $user->email_verified_at = null;
            }
            $user->forceFill(['name' => $data->name, 'email' => $data->email])->save();

            return $changed;
        });
    }

    public function delete(User $user): void
    {
        DB::transaction(function () use ($user): void {
            Password::deleteToken($user);
            $user->passkeys()->delete();
            $user->delete();
        });
    }
}
