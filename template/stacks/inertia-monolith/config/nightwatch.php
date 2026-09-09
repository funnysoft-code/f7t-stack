<?php

declare(strict_types=1);

return [
    'enabled' => env('APP_ENV') === 'production' && (bool) env('NIGHTWATCH_ENABLED', false) && (bool) env('NIGHTWATCH_TOKEN'),
    'token' => env('NIGHTWATCH_TOKEN'),
];
