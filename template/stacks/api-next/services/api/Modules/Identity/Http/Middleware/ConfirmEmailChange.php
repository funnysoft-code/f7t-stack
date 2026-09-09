<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Http\Request;
use Modules\Identity\Models\Users\User;
use Symfony\Component\HttpFoundation\Response;

final class ConfirmEmailChange
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        assert($user instanceof User);
        $changesEmail = $request->exists('email') && $request->input('email') !== $user->email;
        abort_unless($user->hasVerifiedEmail() || ($changesEmail && (! $request->exists('name') || $request->input('name') === $user->name)), 403);

        $response = $changesEmail ? app(RequirePassword::class)->handle($request, $next) : $next($request);
        assert($response instanceof Response);

        return $response;
    }
}
