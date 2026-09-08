<?php

declare(strict_types=1);

return [
    'resend' => ['key' => env('RESEND_API_KEY')],
    'turnstile' => [
        'enabled' => env('TURNSTILE_ENABLED', false),
        'site_key' => env('TURNSTILE_SITE_KEY', ''),
        'secret_key' => env('TURNSTILE_SECRET_KEY', ''),
    ],
];
