<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Identity\Models\Users\Passkey;

/** @mixin Passkey */
final class PasskeyResource extends JsonResource
{
    /** @return array{uuid: string, name: string, created_at: ?string, last_used_at: ?string} */
    public function toArray(Request $request): array
    {
        return ['uuid' => $this->uuid, 'name' => $this->name, 'created_at' => $this->created_at?->toISOString(), 'last_used_at' => $this->last_used_at?->toISOString()];
    }
}
