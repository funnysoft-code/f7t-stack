<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Passkeys\Http\Responses\PasskeyRegistrationResponse as BaseResponse;
use Modules\Identity\Http\Resources\PasskeyResource;
use Modules\Identity\Models\Users\Passkey;

final class PasskeyRegistrationResponse extends BaseResponse
{
    public function toResponse($request): JsonResponse
    {
        assert($this->passkey instanceof Passkey);

        return new PasskeyResource($this->passkey)->additional(['status' => 'passkey-registered'])->response()->setStatusCode(200);
    }
}
