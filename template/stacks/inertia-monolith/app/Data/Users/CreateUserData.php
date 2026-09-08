<?php

declare(strict_types=1);

namespace App\Data\Users;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Spatie\LaravelData\Data;

final class CreateUserData extends Data
{
    public function __construct(public string $name, public string $email, public string $password) {}

    /** @param array<string, mixed> $input */
    public static function validated(array $input): self
    {
        /** @var array{name: string, email: string, password: string} $validated */
        $validated = Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(12), 'confirmed'],
        ])->validate();

        return new self($validated['name'], $validated['email'], $validated['password']);
    }
}
