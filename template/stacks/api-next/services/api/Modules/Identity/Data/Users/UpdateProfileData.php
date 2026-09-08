<?php

declare(strict_types=1);

namespace Modules\Identity\Data\Users;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class UpdateProfileData extends Data
{
    public function __construct(
        public readonly string|Optional $name = new Optional,
        public readonly string|Optional $email = new Optional,
    ) {}
}
