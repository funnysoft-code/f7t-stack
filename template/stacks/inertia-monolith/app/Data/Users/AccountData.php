<?php

declare(strict_types=1);

namespace App\Data\Users;

use App\Models\Users\User;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
final class AccountData extends Data
{
    public function __construct(public string $name, public string $email, public bool $verified, public bool $authenticatorPending, public bool $authenticatorConfirmed, public int $passkeyCount) {}

    public static function fromUser(User $user): self
    {
        return new self($user->name, $user->email, $user->hasVerifiedEmail(), $user->two_factor_secret !== null, $user->two_factor_confirmed_at !== null, $user->passkeys()->count());
    }
}
