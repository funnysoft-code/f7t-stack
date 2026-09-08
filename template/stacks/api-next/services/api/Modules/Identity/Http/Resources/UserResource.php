<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Resources;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Identity\Models\Users\User;

/** @mixin User */
final class UserResource extends JsonResource
{
    public function withResponse(Request $request, JsonResponse $response): void
    {
        $response->setStatusCode(200);
    }

    /** @return array{uuid: string, name: string, email: string, email_verified: bool} */
    public function toArray(Request $request): array
    {
        return ['uuid' => $this->uuid, 'name' => $this->name, 'email' => $this->email, 'email_verified' => $this->hasVerifiedEmail()];
    }
}
