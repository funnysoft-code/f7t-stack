<?php

declare(strict_types=1);

use Illuminate\Support\Str;

$redis = [
    'host' => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port' => env('REDIS_PORT', '6379'),
];

return [
    'default' => 'pgsql',
    'connections' => [
        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', '__F7T_APP_NAME__'),
            'username' => env('DB_USERNAME', 'postgres'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => 'utf8',
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => env('DB_SSLMODE', 'prefer'),
        ],
    ],
    'migrations' => ['table' => 'migrations', 'update_date_on_publish' => true],
    'redis' => [
        'client' => 'phpredis',
        'options' => ['prefix' => env('REDIS_PREFIX', Str::slug((string) env('APP_NAME', '__F7T_APP_NAME__')).'-database-')],
        'default' => [...$redis, 'url' => env('REDIS_URL'), 'database' => env('REDIS_DB', '0')],
        'cache' => [...$redis, 'url' => env('REDIS_CACHE_URL'), 'database' => env('REDIS_CACHE_DB', '1')],
        'sessions' => [...$redis, 'url' => env('REDIS_SESSION_URL'), 'database' => env('REDIS_SESSION_DB', '2')],
    ],
];
