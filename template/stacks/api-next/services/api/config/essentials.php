<?php

declare(strict_types=1);

use NunoMaduro\Essentials\Configurables\AutomaticallyEagerLoadRelationships;

return [
    // Missing eager loads must fail under nonproduction Eloquent strictness.
    AutomaticallyEagerLoadRelationships::class => false,
];
