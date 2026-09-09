<?php

declare(strict_types=1);

use Laravel\Fortify\Features;

return [
    'guard' => 'web',
    'passwords' => 'users',
    'username' => 'email',
    'email' => 'email',
    'lowercase_usernames' => true,
    'home' => '/',
    'views' => false,
    // Fortify forwards these values to the passkeys package during boot.
    'passkeys' => [
        'relying_party_id' => parse_url(env('FRONTEND_URL', 'http://localhost:3000'), PHP_URL_HOST),
        'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
        'user_handle_secret' => env('PASSKEYS_USER_HANDLE_SECRET', env('APP_KEY')),
        'timeout' => 60000,
    ],
    'limiters' => ['login' => 'login', 'verification' => 'verification', 'two-factor' => 'two-factor', 'passkeys' => 'passkeys'],
    'features' => [
        Features::resetPasswords(),
        Features::emailVerification(),
        Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true]),
        Features::passkeys(['confirmPassword' => true]),
    ],
];
