<?php

declare(strict_types=1);

namespace App\Http\Controllers\Users;

use App\Http\Responses\PasswordResetLinkResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Requests\SendPasswordResetLinkRequest;
use Throwable;

final class PasswordResetLinkController
{
    public function __invoke(SendPasswordResetLinkRequest $request): PasswordResetLinkResponse
    {
        if (config('fortify.lowercase_usernames') && $request->has(Fortify::email())) {
            $request->merge([Fortify::email() => Str::lower($request->string(Fortify::email())->toString())]);
        }

        try {
            Password::broker(config()->string('fortify.passwords'))->sendResetLink($request->only(Fortify::email()));
        } catch (Throwable $exception) {
            report($exception);
        }

        return new PasswordResetLinkResponse;
    }
}
