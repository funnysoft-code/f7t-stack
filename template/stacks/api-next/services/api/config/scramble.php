<?php

declare(strict_types=1);

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

return [
    'api_path' => 'api',
    'ui' => ['title' => 'Account API'],
    'servers' => ['Same-origin proxy' => '/api'],
    'middleware' => ['web', RestrictedDocsAccess::class, 'throttle:docs'],
];
