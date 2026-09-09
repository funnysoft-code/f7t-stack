<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\FailedPasswordResetResponse;

final class InvalidPasswordResetResponse implements FailedPasswordResetResponse
{
    /** @param Request $request */
    public function toResponse($request): never
    {
        throw ValidationException::withMessages(['email' => ['This password reset link is invalid or expired.']]);
    }
}
