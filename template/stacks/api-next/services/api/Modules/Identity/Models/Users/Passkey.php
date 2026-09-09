<?php

declare(strict_types=1);

namespace Modules\Identity\Models\Users;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Support\Str;
use Laravel\Passkeys\Passkey as BasePasskey;

/** @property string $uuid */
#[Hidden(['id', 'user_id', 'credential_id', 'credential'])]
#[RouteKey('uuid')]
final class Passkey extends BasePasskey
{
    protected static function booted(): void
    {
        self::creating(function (self $passkey): void {
            $passkey->uuid = (string) Str::uuid7();
        });
    }
}
