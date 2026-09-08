<?php

declare(strict_types=1);

namespace App\Data\Users;

use Spatie\LaravelData\Data;

final class UpdateProfileData extends Data
{
    public function __construct(public string $name, public string $email) {}
}
