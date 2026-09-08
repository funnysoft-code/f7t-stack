<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Controllers;

use Illuminate\Http\Request;
use Modules\Identity\Http\Resources\AuthCapabilitiesResource;
use Modules\Identity\Http\Resources\UserResource;
use Symfony\Component\HttpFoundation\Response;

final class AccountController
{
    public function capabilities(): AuthCapabilitiesResource
    {
        return new AuthCapabilitiesResource(null);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function csrf(): Response
    {
        return response()->noContent();
    }
}
