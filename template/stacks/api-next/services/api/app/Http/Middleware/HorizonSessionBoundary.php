<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class HorizonSessionBoundary
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $navigation = $request->isMethod('GET') && ! $request->is('horizon/api', 'horizon/api/*') && $request->acceptsHtml() && ! $request->expectsJson();

        if ($user === null) {
            $response = $navigation
                ? redirect('/login?next='.rawurlencode($request->getRequestUri()))
                : response()->json(['error' => 'unauthenticated'], 401);
        } elseif (! $user->hasVerifiedEmail()) {
            $response = $navigation
                ? redirect('/verify-email?next='.rawurlencode($request->getRequestUri()))
                : response()->json(['error' => 'email_unverified'], 403);
        } else {
            $response = $next($request);
        }

        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }
}
