<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Data\Users\AuthCapabilitiesData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\ConfirmPasswordViewResponse;
use Laravel\Fortify\Contracts\LoginViewResponse;
use Laravel\Fortify\Contracts\RegisterViewResponse;
use Laravel\Fortify\Contracts\RequestPasswordResetLinkViewResponse;
use Laravel\Fortify\Contracts\ResetPasswordViewResponse;
use Laravel\Fortify\Contracts\VerifyEmailViewResponse;
use Symfony\Component\HttpFoundation\Response;

final readonly class AccountPageResponse implements ConfirmPasswordViewResponse, LoginViewResponse, RegisterViewResponse, RequestPasswordResetLinkViewResponse, ResetPasswordViewResponse, VerifyEmailViewResponse
{
    public function __construct(private string $component) {}

    /** @param Request $request */
    public function toResponse($request): Response
    {
        $props = [
            'capabilities' => AuthCapabilitiesData::current()->toArray(),
            'status' => $request->session()->get('status'),
        ];
        if ($this->component === 'auth/reset-password') {
            $props['token'] = $request->route('token');
            $props['email'] = $request->string('email')->toString();
        }

        return $request->wantsJson() && ! $request->header('X-Inertia')
            ? response()->json(['component' => $this->component, 'props' => $props])
            : Inertia::render($this->component, $props)->toResponse($request);
    }
}
