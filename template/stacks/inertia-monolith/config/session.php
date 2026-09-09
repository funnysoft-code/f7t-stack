<?php

declare(strict_types=1);

return [
    'driver' => env('SESSION_DRIVER', 'redis'),
    'lifetime' => 120,
    'expire_on_close' => false,
    'encrypt' => false,
    'files' => storage_path('framework/sessions'),
    'connection' => 'sessions',
    'store' => 'sessions',
    'lottery' => [2, 100],
    'cookie' => env('SESSION_COOKIE', '__F7T_APP_NAME___session'),
    'path' => '/',
    'domain' => null,
    'secure' => env('SESSION_SECURE_COOKIE', true),
    'http_only' => true,
    'same_site' => 'lax',
    'partitioned' => false,
    'serialization' => 'json',
];
