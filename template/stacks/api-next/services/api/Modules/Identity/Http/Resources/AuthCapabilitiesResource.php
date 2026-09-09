<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Resources;

use Illuminate\Config\Repository;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property Repository $resource */
final class AuthCapabilitiesResource extends JsonResource
{
    /** @return array{registration: bool} */
    public function toArray(Request $request): array
    {
        return ['registration' => $this->resource->boolean('funnysoft.registration_enabled')];
    }
}
