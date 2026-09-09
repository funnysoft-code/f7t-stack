<?php

declare(strict_types=1);

namespace App\Actions\Users;

use App\Data\Users\CreateUserData;
use App\Models\Users\User;
use App\Repositories\Users\UserRepository;

final readonly class CreateUserAction
{
    public function __construct(private UserRepository $users) {}

    public function execute(CreateUserData $data): User
    {
        return $this->users->create($data);
    }
}
