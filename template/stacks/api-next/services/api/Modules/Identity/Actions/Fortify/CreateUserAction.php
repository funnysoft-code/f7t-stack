<?php

declare(strict_types=1);

namespace Modules\Identity\Actions\Fortify;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Modules\Identity\Models\Users\User;

final class CreateUserAction implements CreatesNewUsers
{
    /** @param array<string, mixed> $input */
    public function create(array $input): User
    {
        abort_unless(config()->boolean('funnysoft.registration_enabled'), 404);
        /** @var array<string, mixed> $data */
        $data = Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(12), 'confirmed'],
        ])->validate();

        return User::query()->create($data);
    }
}
