<?php

declare(strict_types=1);

namespace App\Http\Fortify;

use App\Actions\Users\ResetPasswordAction;
use App\Models\Users\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

final readonly class ResetUserPassword implements ResetsUserPasswords
{
    public function __construct(private ResetPasswordAction $resetPassword) {}

    /** @param array<string, mixed> $input */
    public function reset(User $user, array $input): void
    {
        /** @var array{password: string} $validated */
        $validated = Validator::make($input, ['password' => ['required', 'string', Password::min(12), 'confirmed']])->validate();
        $this->resetPassword->execute($user, $validated['password']);
    }
}
