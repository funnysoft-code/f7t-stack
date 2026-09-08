<?php

declare(strict_types=1);

return [
    'guard' => 'web',
    'passwords' => 'users',
    'username' => 'email',
    'email' => 'email',
    'lowercase_usernames' => true,
    'home' => '/',
    'prefix' => '',
    'domain' => null,
    'middleware' => ['web', 'throttle:web'],
    'views' => false,
    'features' => [],
];
