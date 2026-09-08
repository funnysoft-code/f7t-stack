<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Controllers;

use Modules\Identity\Http\Requests\VerifyEmailRequest;
use Modules\Identity\Http\Resources\UserResource;

final class VerifyEmailController
{
    public function __invoke(VerifyEmailRequest $request): UserResource
    {
        $request->fulfill();

        return new UserResource($request->user());
    }
}
