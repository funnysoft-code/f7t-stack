<?php

declare(strict_types=1);

namespace App\Data\Users;

use Illuminate\Support\Facades\Route;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
final class AuthCapabilitiesData extends Data
{
    public function __construct(public bool $registrationEnabled, public ?string $registrationUrl) {}

    public static function current(): self
    {
        $enabled = (bool) config('funnysoft.registration_enabled');

        return new self($enabled, $enabled && Route::has('register.store') ? route('register.store', absolute: false) : null);
    }
}
