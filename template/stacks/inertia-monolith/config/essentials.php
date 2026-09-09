<?php

declare(strict_types=1);
use NunoMaduro\Essentials\Configurables\AutomaticallyEagerLoadRelationships;
use NunoMaduro\Essentials\Configurables\ForceScheme;
use NunoMaduro\Essentials\Configurables\ShouldBeStrict;
use NunoMaduro\Essentials\Configurables\Unguard;

return [
    AutomaticallyEagerLoadRelationships::class => false,
    Unguard::class => true,
    'environments' => [
        ForceScheme::class => ['production'],
        ShouldBeStrict::class => ['local', 'testing'],
    ],
];
