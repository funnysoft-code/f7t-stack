<?php

declare(strict_types=1);

namespace App\Models\Users;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Laravel\Passkeys\Passkey as BasePasskey;

#[Hidden(['user_id', 'credential_id', 'credential'])]
final class Passkey extends BasePasskey
{
    use HasUuids;
}
