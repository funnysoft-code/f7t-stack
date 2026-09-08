<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Modules\Identity\Models\Users\User;
use Symfony\Component\HttpFoundation\Response;

final class ValidatePendingLogin
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->session()->has('login.id')) {
            $user = User::query()->find($request->session()->get('login.id'));
            $proof = $request->session()->get('login.credential_hash');
            $issued = $request->session()->get('login.issued_at');
            if (! $user instanceof User || ! is_string($proof) || ! hash_equals(hash('sha256', $user->password), $proof)
                || ! is_int($issued) || now()->getTimestamp() - $issued > 300 || $issued > now()->getTimestamp()) {
                $request->session()->forget(['login', 'auth.password_confirmed_at']);

                throw new AuthenticationException('Please sign in again.', ['web']);
            }
        }

        return $next($request);
    }
}
