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
    'limiters' => ['login' => 'login', 'verification' => 'verification'],
    'features' => [
        Features::resetPasswords(),
        Features::emailVerification(),
    ],
];
