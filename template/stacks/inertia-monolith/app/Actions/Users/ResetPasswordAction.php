<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Models\Users\User;
use App\Repositories\Users\UserRepository;

final readonly class ResetPasswordAction
{
    public function __construct(private UserRepository $users) {}

    public function execute(User $user, string $password): void
    {
        $this->users->updatePassword($user, $password);
    }
}
