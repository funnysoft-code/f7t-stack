<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AuthCapabilitiesResource extends JsonResource
{
    /** @return array{registration: bool} */
    public function toArray(Request $request): array
    {
        return ['registration' => config()->boolean('funnysoft.registration_enabled')];
    }
}
