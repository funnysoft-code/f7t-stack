<?php

declare(strict_types=1);

namespace App\Data\Users;

use Spatie\LaravelData\Data;

final class AuthCapabilitiesData extends Data
{
    public function __construct(public bool $registrationEnabled) {}

    public static function current(): self
    {
        return new self((bool) config('funnysoft.registration_enabled'));
    }
}
