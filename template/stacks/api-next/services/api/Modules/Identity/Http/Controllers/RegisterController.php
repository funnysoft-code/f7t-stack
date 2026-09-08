<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Controllers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\RegisterResponse;
use Modules\Identity\Actions\Fortify\CreateUserAction;
use Throwable;

final readonly class RegisterController
{
    public function __construct(private StatefulGuard $guard) {}

    public function __invoke(Request $request, CreateUserAction $creator): RegisterResponse
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => strtolower($request->string('email')->toString())]);
        }
        /** @var array<string, mixed> $input */
        $input = $request->all();
        $user = $creator->create($input);
        try {
            event(new Registered($user));
        } catch (Throwable $exception) {
            // Creation is durable. The unverified session can retry via resend.
            report($exception);
        }
        $this->guard->login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return app(RegisterResponse::class);
    }
}
