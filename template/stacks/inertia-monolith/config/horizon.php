<?php

declare(strict_types=1);

return [
    'name' => env('APP_NAME', '__F7T_APP_NAME__'),
    'domain' => null,
    'path' => 'horizon',
    'use' => 'default',
    'prefix' => env('HORIZON_PREFIX', '__F7T_APP_NAME__:horizon:'),
    'middleware' => ['web', 'throttle:horizon'],
    'waits' => ['redis:'.env('REDIS_QUEUE', '__F7T_APP_NAME__') => 60],
    'trim' => ['recent' => 60, 'pending' => 60, 'completed' => 60, 'recent_failed' => 10080, 'failed' => 10080, 'monitored' => 10080],
    'silenced' => [],
    'metrics' => ['trim_snapshots' => ['job' => 24, 'queue' => 24]],
    'fast_termination' => false,
    'memory_limit' => 64,
    'defaults' => ['supervisor-1' => [
        'connection' => 'redis',
        'queue' => [env('REDIS_QUEUE', '__F7T_APP_NAME__')],
        'balance' => 'auto',
        'autoScalingStrategy' => 'time',
        'maxProcesses' => 1,
        'maxTime' => 0,
        'maxJobs' => 0,
        'memory' => 128,
        'tries' => 3,
        'timeout' => 60,
        'nice' => 0,
    ]],
    'environments' => [
        'production' => ['supervisor-1' => ['maxProcesses' => 10, 'balanceMaxShift' => 1, 'balanceCooldown' => 3]],
        '*' => ['supervisor-1' => ['maxProcesses' => 1]],
    ],
];
