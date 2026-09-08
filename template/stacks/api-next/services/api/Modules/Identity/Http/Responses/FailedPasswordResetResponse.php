<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Responses;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\FailedPasswordResetResponse as ResponseContract;

final class FailedPasswordResetResponse implements ResponseContract
{
    /** @param Request $request */
    public function toResponse($request): never
    {
        throw ValidationException::withMessages(['email' => ['This password reset link is invalid or has expired.']]);
    }
}
