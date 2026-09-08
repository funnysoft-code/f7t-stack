<?php

declare(strict_types=1);

namespace Modules\Identity\Models\Users;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Override;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string $email
 * @property string $password
 * @property CarbonImmutable|null $email_verified_at
 */
#[Hidden(['id', 'password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'])]
#[RouteKey('uuid')]
final class User extends Authenticatable implements MustVerifyEmail
{
    use HasRoles;
    use Notifiable;
    use TwoFactorAuthenticatable;

    /** @var array<string, null> */
    #[Override]
    protected $attributes = [
        'email_verified_at' => null,
        'remember_token' => null,
        'two_factor_secret' => null,
        'two_factor_recovery_codes' => null,
        'two_factor_confirmed_at' => null,
    ];

    protected static function booted(): void
    {
        self::creating(function (self $user): void {
            $user->uuid = (string) Str::uuid7();
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
