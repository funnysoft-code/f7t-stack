<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Models\Users\User;
use App\Repositories\Users\UserRepository;

final readonly class DeleteAccountAction
{
    public function __construct(private UserRepository $users) {}

    public function execute(User $user): void
    {
        $this->users->delete($user);
    }
}
