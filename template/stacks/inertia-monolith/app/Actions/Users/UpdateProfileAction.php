<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Data\Users\UpdateProfileData;
use App\Models\Users\User;
use App\Repositories\Users\UserRepository;

final readonly class UpdateProfileAction
{
    public function __construct(private UserRepository $users) {}

    public function execute(User $user, UpdateProfileData $data): void
    {
        if ($this->users->updateProfile($user, $data)) {
            $user->sendEmailVerificationNotification();
        }
    }
}
