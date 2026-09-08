<?php

declare(strict_types=1);

namespace App\Providers;

use App\Http\Fortify\CreateNewUser;
use App\Http\Fortify\ResetUserPassword;
use App\Http\Responses\AccountPageResponse;
use App\Http\Responses\InvalidPasswordResetResponse;
use App\Http\Responses\PasswordResetLinkResponse;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

final class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(Contracts\FailedPasswordResetResponse::class, InvalidPasswordResetResponse::class);
        $this->app->bind(Contracts\SuccessfulPasswordResetLinkRequestResponse::class, PasswordResetLinkResponse::class);
        $this->app->bind(Contracts\FailedPasswordResetLinkRequestResponse::class, PasswordResetLinkResponse::class);
        foreach ([
            Contracts\LoginViewResponse::class => 'auth/login',
            Contracts\RegisterViewResponse::class => 'auth/register',
            Contracts\RequestPasswordResetLinkViewResponse::class => 'auth/forgot-password',
            Contracts\ResetPasswordViewResponse::class => 'auth/reset-password',
            Contracts\VerifyEmailViewResponse::class => 'auth/verify-email',
            Contracts\ConfirmPasswordViewResponse::class => 'auth/confirm-password',
        ] as $contract => $component) {
            $this->app->bind($contract, fn (): AccountPageResponse => new AccountPageResponse($component));
        }
    }

    public function boot(): void
    {
        if (config('funnysoft.registration_enabled')) {
            config(['fortify.features' => [...config()->array('fortify.features'), Features::registration()]]);
        }
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        RateLimiter::for('login', fn (Request $request): Limit => Limit::perMinute(5)->by(Str::lower($request->string('email')->toString()).'|'.$request->ip()));
        RateLimiter::for('verification', fn (Request $request): Limit => Limit::perMinute(6)->by($request->user()?->getAuthIdentifier() ?? $request->ip()));
    }
}
