<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Data\Users\UpdatePasswordData;
use App\Models\Users\User;
use App\Repositories\Users\UserRepository;
use SensitiveParameter;

final readonly class ResetPasswordAction
{
    public function __construct(private UserRepository $users) {}

    public function execute(User $user, #[SensitiveParameter] UpdatePasswordData $data): void
    {
        $this->users->updatePassword($user, $data);
    }
}
