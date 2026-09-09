<?php

declare(strict_types=1);

return [
    'relying_party_id' => parse_url(env('FRONTEND_URL', 'http://localhost:3000'), PHP_URL_HOST),
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'user_handle_secret' => env('PASSKEYS_USER_HANDLE_SECRET', env('APP_KEY')),
    'timeout' => 60000,
    'guard' => 'web',
];
