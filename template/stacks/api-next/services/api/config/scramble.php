<?php

declare(strict_types=1);

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

return [
    'api_path' => 'api',
    'middleware' => ['web', RestrictedDocsAccess::class, 'throttle:docs'],
];
