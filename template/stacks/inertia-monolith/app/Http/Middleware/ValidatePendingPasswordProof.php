<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Repositories\Users\UserRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final readonly class ValidatePendingPasswordProof
{
    public function __construct(private UserRepository $users) {}

    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->session()->get('login.id');
        if ($id !== null) {
            $user = is_string($id) ? $this->users->find($id) : null;
            $proof = $request->session()->get('login.credential_hash');
            $issued = $request->session()->get('login.issued_at');
            if ($user === null || ! is_string($proof) || ! hash_equals($user->getAuthPassword(), $proof)
                || ! is_int($issued) || time() - $issued > 300) {
                $request->session()->forget('login');
                if ($request->routeIs('two-factor.login', 'two-factor.login.store')) {
                    abort(401, 'Please sign in again.');
                }
            }
        }

        return $next($request);
    }
}
