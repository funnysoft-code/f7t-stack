<?php

declare(strict_types=1);

use Illuminate\Support\Str;

return [
    'driver' => env('SESSION_DRIVER', 'redis'),
    'lifetime' => 120,
    'expire_on_close' => false,
    'encrypt' => false,
    'files' => storage_path('framework/sessions'),
    'connection' => 'sessions',
    'table' => 'sessions',
    'store' => 'sessions',
    'lottery' => [2, 100],
    'cookie' => env('SESSION_COOKIE', Str::slug((string) env('APP_NAME', '__F7T_APP_NAME__')).'-session'),
    'path' => '/',
    'domain' => env('SESSION_DOMAIN'),
    'secure' => env('SESSION_SECURE_COOKIE', true),
    'http_only' => true,
    'same_site' => 'lax',
    'partitioned' => false,
    'serialization' => 'json',
];
