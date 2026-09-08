<?php

declare(strict_types=1);

namespace Modules\Identity\Actions\Fortify;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\ResetsUserPasswords;
use Modules\Identity\Models\Users\User;

final class ResetPasswordAction implements ResetsUserPasswords
{
    /** @param User $user
     * @param  array<string, mixed>  $input
     */
    public function reset($user, array $input): void
    {
        /** @var array<string, mixed> $data */
        $data = Validator::make($input, ['password' => ['required', 'string', Password::min(12), 'confirmed']])->validate();
        $user->forceFill($data)->save();
    }
}
