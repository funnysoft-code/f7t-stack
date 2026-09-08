<?php

declare(strict_types=1);

return [
    'default' => env('MAIL_MAILER', 'smtp'),
    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME'),
            'host' => env('MAIL_HOST', '127.0.0.1'),
            'port' => env('MAIL_PORT', 2525),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => 10,
        ],
        'resend' => ['transport' => 'resend'],
        'array' => ['transport' => 'array'],
        'log' => ['transport' => 'log'],
    ],
    'from' => ['address' => env('MAIL_FROM_ADDRESS', 'hello@example.test'), 'name' => env('APP_NAME', '__F7T_APP_NAME__')],
];
