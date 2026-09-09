<?php

declare(strict_types=1);

use App\Http\Middleware\PreventSessionResponseCaching;
use App\Http\Middleware\ValidatePendingPasswordProof;
use App\Http\Middleware\ValidatePublicTurnstile;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\AuthenticateSession;
use Webauthn\Exception\AuthenticatorResponseVerificationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(headers: Request::HEADER_X_FORWARDED_PROTO);
        $middleware->web(prepend: [PreventSessionResponseCaching::class]);
        $middleware->web(append: [AuthenticateSession::class, ValidatePendingPasswordProof::class, Inertia\Middleware::class, ValidatePublicTurnstile::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontFlash(['credential', 'code', 'recovery_code', 'turnstile_token']);
        $exceptions->dontReport([AuthenticatorResponseVerificationException::class]);
        $exceptions->render(fn (AuthenticatorResponseVerificationException $exception): JsonResponse => response()->json(['message' => 'Unable to verify passkey. Start again.', 'errors' => ['credential' => ['Unable to verify passkey. Start again.']]], 422));
    })
    ->create();
