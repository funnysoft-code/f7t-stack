<?php

declare(strict_types=1);

namespace App\Http\Fortify;

use App\Actions\Users\ResetPasswordAction;
use App\Data\Users\UpdatePasswordData;
use App\Models\Users\User;
use Laravel\Fortify\Contracts\ResetsUserPasswords;
use SensitiveParameter;

final readonly class ResetUserPassword implements ResetsUserPasswords
{
    public function __construct(private ResetPasswordAction $resetPassword) {}

    /** @param array<string, mixed> $input */
    public function reset(User $user, #[SensitiveParameter] array $input): void
    {
        $this->resetPassword->execute(user: $user, data: UpdatePasswordData::validated($input));
    }
}
