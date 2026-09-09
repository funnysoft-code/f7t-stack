<?php

declare(strict_types=1);

namespace App\Repositories\Users;

use App\Data\Users\PasskeyData;
use App\Models\Users\User;

final readonly class PasskeyRepository
{
    /** @return list<PasskeyData> */
    public function list(User $user): array
    {
        return array_values($user->passkeys()->orderBy('created_at')->get()->map(PasskeyData::fromModel(...))->all());
    }
}
