<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Throwable;

final class PasswordResetLinkController
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email', 'max:255']]);
        $request->merge(['email' => strtolower($request->string('email')->toString())]);
        try {
            Password::broker(config()->string('fortify.passwords'))->sendResetLink($request->only('email'));
        } catch (Throwable $exception) {
            report($exception);
        }

        return response()->json(['message' => 'If the account exists, a password reset link will be sent.']);
    }
}
