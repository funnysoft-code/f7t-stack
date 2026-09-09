<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Users\User;
use Closure;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final readonly class ConfirmSensitiveAccountOperation
{
    public function __construct(private RequirePassword $confirmation) {}

    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        assert($user instanceof User);
        if ($request->routeIs('settings.profile.update') && mb_strtolower($request->string('email')->toString()) === $user->email) {
            abort_unless($user->hasVerifiedEmail(), 403);

            return $next($request);
        }
        if ($request->routeIs('settings.profile.update') && ! $user->hasVerifiedEmail()) {
            abort_unless($request->string('name')->toString() === $user->name, 403);
        }

        $response = $this->confirmation->handle($request, $next);
        assert($response instanceof Response);

        return $response;
    }
}
