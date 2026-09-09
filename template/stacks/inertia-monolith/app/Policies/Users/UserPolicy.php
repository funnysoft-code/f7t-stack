<?php

declare(strict_types=1);

namespace App\Policies\Users;

use App\Models\Users\User;

final readonly class UserPolicy
{
    public function view(User $actor, User $user): bool
    {
        return $actor->is($user);
    }

    public function update(User $actor, User $user): bool
    {
        return $actor->is($user);
    }

    public function delete(User $actor, User $user): bool
    {
        return $actor->is($user);
    }
}
