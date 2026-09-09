<?php

declare(strict_types=1);

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\AuthenticateSession;
use Modules\Identity\Http\Middleware\ValidatePendingLogin;
use Symfony\Component\HttpFoundation\Response;
use Webauthn\Exception\AuthenticatorResponseVerificationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(headers: Request::HEADER_X_FORWARDED_PROTO);
        $middleware->redirectGuestsTo(fn (): string => rtrim(config()->string('funnysoft.frontend_url'), '/').'/login');
        $middleware->web(append: [
            ValidatePendingLogin::class,
            AuthenticateSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontFlash(['credential', 'code', 'recovery_code', 'turnstile_token']);
        $exceptions->dontReport([AuthenticatorResponseVerificationException::class]);
        $exceptions->render(fn (AuthenticatorResponseVerificationException $exception): JsonResponse => response()->json(['message' => 'Unable to verify passkey. Start again.', 'errors' => ['credential' => ['Unable to verify passkey. Start again.']]], 422));
        $exceptions->shouldRenderJsonWhen(fn (Request $request): bool => $request->is('api/*', 'horizon/api', 'horizon/api/*') || $request->expectsJson());
        $exceptions->respond(function (Response $response): Response {
            if (request()->is('api/*', 'horizon', 'horizon/*')) {
                $response->headers->set('Cache-Control', 'private, no-store');
            }

            return $response;
        });
    })->create();
