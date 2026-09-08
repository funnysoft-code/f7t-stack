<?php

declare(strict_types=1);

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;

return [
    'default' => env('LOG_CHANNEL', 'single'),
    'deprecations' => ['channel' => 'null', 'trace' => false],
    'channels' => [
        'single' => ['driver' => 'single', 'path' => storage_path('logs/laravel.log'), 'level' => env('LOG_LEVEL', 'debug'), 'replace_placeholders' => true],
        'stderr' => ['driver' => 'monolog', 'handler' => StreamHandler::class, 'with' => ['stream' => 'php://stderr']],
        'null' => ['driver' => 'monolog', 'handler' => NullHandler::class],
        'emergency' => ['path' => storage_path('logs/laravel.log')],
    ],
];
