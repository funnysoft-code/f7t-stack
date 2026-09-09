<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureRegistrationEnabled;
use Laravel\Fortify\Features;

return [
    'guard' => 'web',
    'passwords' => 'users',
    'username' => 'email',
    'email' => 'email',
    'lowercase_usernames' => true,
    'home' => '/',
    'prefix' => '',
    'domain' => null,
    'middleware' => ['web', 'throttle:web', EnsureRegistrationEnabled::class],
    'views' => true,
    'limiters' => ['login' => 'login', 'verification' => 'verification', 'two-factor' => 'two-factor', 'passkeys' => 'passkeys'],
    'features' => [Features::resetPasswords(), Features::emailVerification(), Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true]), Features::passkeys(['confirmPassword' => true])],
    'redirects' => ['logout' => '/login', 'register' => '/email/verify'],
];
