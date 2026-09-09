<?php

declare(strict_types=1);

use Illuminate\Support\Str;

return [
    'default' => env('CACHE_STORE', 'redis'),
    'stores' => [
        'array' => ['driver' => 'array', 'serialize' => false],
        'redis' => ['driver' => 'redis', 'connection' => 'cache', 'lock_connection' => 'default'],
        'sessions' => ['driver' => 'redis', 'connection' => 'sessions'],
    ],
    'prefix' => env('CACHE_PREFIX', Str::slug((string) env('APP_NAME', '__F7T_APP_NAME__')).'-cache-'),
    'serializable_classes' => false,
];
