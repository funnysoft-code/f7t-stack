<?php

declare(strict_types=1);

namespace App\Http\Rules;

use App\Support\Integrations\Turnstile;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class TurnstileToken implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! app(Turnstile::class)->verify($value)) {
            $fail('The security check failed. Please try again.');
        }
    }
}
