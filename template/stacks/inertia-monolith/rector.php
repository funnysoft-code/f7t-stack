<?php

declare(strict_types=1);

use Pest\Rector\Set\PestSetList;
use Rector\Config\RectorConfig;
use RectorLaravel\Set\LaravelSetList;

return RectorConfig::configure()
    ->withPaths([__DIR__.'/app', __DIR__.'/tests'])
    ->withPhpSets()
    ->withSets([
        LaravelSetList::COMPOSER_BASED,
        PestSetList::CODING_STYLE,
    ]);
