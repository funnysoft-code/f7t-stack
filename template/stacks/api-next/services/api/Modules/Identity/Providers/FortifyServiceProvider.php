<?php

declare(strict_types=1);

namespace Modules\Identity\Providers;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\FailedPasswordResetResponse;
use Laravel\Fortify\Events\TwoFactorAuthenticationChallenged;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Laravel\Passkeys\Contracts\PasskeyRegistrationResponse;
use Laravel\Passkeys\Passkeys;
use Modules\Identity\Actions\Fortify\CreateUserAction;
use Modules\Identity\Actions\Fortify\ResetPasswordAction;
use Modules\Identity\Models\Users\Passkey;
use Modules\Identity\Models\Users\User;

final class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Identity owns the complete route surface, including UUID verification.
        Fortify::ignoreRoutes();
        Passkeys::ignoreRoutes();
        $this->app->bind(PasskeyRegistrationResponse::class, \Modules\Identity\Http\Responses\PasskeyRegistrationResponse::class);
        $this->app->singleton(FailedPasswordResetResponse::class, \Modules\Identity\Http\Responses\FailedPasswordResetResponse::class);
    }

    public function boot(): void
    {
        Passkeys::useUserModel(User::class);
        Passkeys::usePasskeyModel(Passkey::class);
        Event::listen(Login::class, function (Login $event): void {
            session()->put('password_hash_'.$event->guard, $event->user->getAuthPassword());
            session()->forget(['auth.password_confirmed_at', 'login', 'passkey']);
        });
        Event::listen(TwoFactorAuthenticationChallenged::class, function (TwoFactorAuthenticationChallenged $event): void {
            /** @var User $user Fortify's event PHPDoc hardcodes App\\Models\\User. */
            $user = $event->user;
            session()->put('login.credential_hash', hash('sha256', $user->password));
            session()->put('login.issued_at', now()->timestamp);
        });
        Fortify::createUsersUsing(CreateUserAction::class);
        Fortify::resetUserPasswordsUsing(ResetPasswordAction::class);
        if (config()->boolean('funnysoft.registration_enabled')) {
            config(['fortify.features' => [...config()->array('fortify.features'), Features::registration()]]);
        }
        RateLimiter::for('auth', fn (Request $request): Limit => Limit::perMinute(60)->by($request->ip()));
        RateLimiter::for('login', function (Request $request): Limit {
            $email = $request->input('email');

            return Limit::perMinute(5)->by((is_string($email) ? strtolower($email) : '').'|'.$request->ip());
        });
        RateLimiter::for('verification', fn (Request $request): Limit => Limit::perMinute(6)->by($request->user() instanceof User ? $request->user()->uuid : $request->ip()));
        RateLimiter::for('password-reset', fn (Request $request): Limit => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('passkeys', fn (Request $request): Limit => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('two-factor', fn (Request $request): Limit => Limit::perMinute(5)->by($request->session()->getId().'|'.$request->ip()));
        ResetPassword::createUrlUsing(function (mixed $user, string $token): string {
            assert($user instanceof User);

            return rtrim(config()->string('funnysoft.frontend_url'), '/').'/reset-password?'.http_build_query(['token' => $token, 'email' => $user->email]);
        });
    }
}
