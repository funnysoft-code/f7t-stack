<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

final readonly class PasskeyCeremony
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next, string $purpose): Response
    {
        $session = $request->session();
        if ($request->isMethod('GET')) {
            $session->forget('passkey');
            $response = $next($request);
            $session->put('passkey.ceremony', ['purpose' => $purpose, 'issued_at' => now()->getTimestampMs(), 'user' => $request->user()?->getAuthIdentifier()]);

            return $response;
        }

        $state = $session->pull('passkey.ceremony');
        try {
            if (! is_array($state) || ($state['purpose'] ?? null) !== $purpose || ($state['user'] ?? null) !== $request->user()?->getAuthIdentifier()
                || ! is_int($state['issued_at'] ?? null) || now()->getTimestampMs() - $state['issued_at'] > config()->integer('passkeys.timeout') || $state['issued_at'] > now()->getTimestampMs()) {
                throw ValidationException::withMessages(['credential' => 'Passkey session expired. Start again.']);
            }

            return $next($request);
        } finally {
            $session->forget('passkey');
        }
    }
}
