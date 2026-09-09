<?php

declare(strict_types=1);

namespace Modules\Identity\Repositories\Users;

use Illuminate\Database\Eloquent\Collection;
use Laravel\Passkeys\Passkey;
use Modules\Identity\Models\Users\User;

final readonly class PasskeyRepository
{
    /** @return Collection<int, Passkey> */
    public function list(User $user): Collection
    {
        return $user->passkeys()->orderBy('created_at')->get();
    }
}
