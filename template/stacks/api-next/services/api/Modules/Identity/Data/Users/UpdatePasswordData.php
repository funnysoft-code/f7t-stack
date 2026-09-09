<?php

declare(strict_types=1);

namespace Modules\Identity\Data\Users;

use SensitiveParameter;
use Spatie\LaravelData\Data;

final class UpdatePasswordData extends Data
{
    public function __construct(
        #[SensitiveParameter] public readonly string $password,
    ) {}
}
