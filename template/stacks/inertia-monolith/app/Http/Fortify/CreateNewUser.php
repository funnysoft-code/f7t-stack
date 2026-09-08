<?php

declare(strict_types=1);

namespace App\Http\Fortify;

use App\Actions\Users\CreateUserAction;
use App\Data\Users\CreateUserData;
use App\Models\Users\User;
use Laravel\Fortify\Contracts\CreatesNewUsers;

final readonly class CreateNewUser implements CreatesNewUsers
{
    public function __construct(private CreateUserAction $createUser) {}

    /** @param array<string, mixed> $input */
    public function create(array $input): User
    {
        abort_unless(config()->boolean('funnysoft.registration_enabled'), 404);

        return $this->createUser->execute(CreateUserData::validated($input));
    }
}
