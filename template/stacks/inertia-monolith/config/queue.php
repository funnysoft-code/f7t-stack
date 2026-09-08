<?php

declare(strict_types=1);

return [
    'default' => env('QUEUE_CONNECTION', 'redis'),
    'connections' => [
        'sync' => ['driver' => 'sync'],
        'redis' => [
            'driver' => 'redis', 'connection' => 'default',
            'queue' => env('REDIS_QUEUE', '__F7T_APP_NAME__'),
            'retry_after' => 90, 'block_for' => 5, 'after_commit' => true,
        ],
    ],
    'batching' => ['database' => 'pgsql', 'table' => 'job_batches'],
    'failed' => ['driver' => 'database-uuids', 'database' => 'pgsql', 'table' => 'failed_jobs'],
];
