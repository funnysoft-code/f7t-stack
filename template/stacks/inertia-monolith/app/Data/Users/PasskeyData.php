<?php

declare(strict_types=1);

namespace App\Data\Users;

use Laravel\Passkeys\Passkey;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
final class PasskeyData extends Data
{
    public function __construct(public string $id, public string $name, public ?string $createdAt, public ?string $lastUsedAt) {}

    public static function fromModel(Passkey $passkey): self
    {
        $id = $passkey->getKey();
        assert(is_string($id));

        return new self(id: $id, name: $passkey->name, createdAt: $passkey->created_at?->toISOString(), lastUsedAt: $passkey->last_used_at?->toISOString());
    }
}
