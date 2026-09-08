<?php

declare(strict_types=1);

namespace Modules\Identity\Repositories\Users;

use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Modules\Identity\Data\Users\UpdateProfileData;
use Modules\Identity\Models\Users\User;
use SensitiveParameter;

final readonly class AccountRepository
{
    public function persistProfile(User $user, UpdateProfileData $data, bool $emailChanged): void
    {
        if (is_string($data->name)) {
            $user->name = $data->name;
        }
        if ($emailChanged) {
            Password::deleteToken($user);
            $user->email_verified_at = null;
        }
        if (is_string($data->email)) {
            $user->email = $data->email;
        }
        $user->save();
    }

    public function replacePassword(User $user, #[SensitiveParameter] string $password): void
    {
        $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
        Password::deleteToken($user);
    }

    public function removeAccount(User $user): void
    {
        Password::deleteToken($user);
        // Spatie detaches grants on deletion. Authenticator credentials live on this row.
        // U8 adds passkey cascade ownership.
        $user->delete();
    }
}
