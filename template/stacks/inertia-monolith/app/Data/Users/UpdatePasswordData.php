<?php

declare(strict_types=1);

namespace App\Data\Users;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use SensitiveParameter;
use Spatie\LaravelData\Data;

final class UpdatePasswordData extends Data
{
    public function __construct(#[SensitiveParameter] public string $password) {}

    /** @return array<string, mixed> */
    public static function rules(): array
    {
        return ['password' => ['required', 'string', Password::min(12), 'confirmed']];
    }

    /** @param array<string, mixed> $input */
    public static function validated(#[SensitiveParameter] array $input): self
    {
        /** @var array{password: string} $validated */
        $validated = Validator::make($input, self::rules())->validate();

        return new self($validated['password']);
    }
}
