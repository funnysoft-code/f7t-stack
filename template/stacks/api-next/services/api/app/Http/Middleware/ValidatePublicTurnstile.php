<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Rules\TurnstileToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class ValidatePublicTurnstile
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('POST') && $request->routeIs('register.store', 'password.email') && config()->boolean('services.turnstile.enabled')) {
            $request->validate(['turnstile_token' => ['required', 'string', 'max:2048', new TurnstileToken]]);
        }

        return $next($request);
    }
}
