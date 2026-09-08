<?php

declare(strict_types=1);

return [
    'default' => env('CACHE_STORE', 'redis'),
    'stores' => [
        'array' => ['driver' => 'array', 'serialize' => false],
        'redis' => ['driver' => 'redis', 'connection' => 'cache', 'lock_connection' => 'cache'],
        'sessions' => ['driver' => 'redis', 'connection' => 'sessions', 'lock_connection' => 'sessions'],
    ],
    'prefix' => env('CACHE_PREFIX', '__F7T_APP_NAME__:cache:'),
];
