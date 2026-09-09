<?php

declare(strict_types=1);

namespace Modules\Identity\Actions\Users;

use Illuminate\Support\Facades\DB;
use Modules\Identity\Data\Users\UpdateProfileData;
use Modules\Identity\Models\Users\User;
use Modules\Identity\Repositories\Users\AccountRepository;

final readonly class UpdateProfileAction
{
    public function __construct(private AccountRepository $accounts) {}

    public function execute(User $user, UpdateProfileData $data): void
    {
        $emailChanged = is_string($data->email) && $data->email !== $user->email;
        DB::transaction(function () use ($user, $data, $emailChanged): void {
            $this->accounts->persistProfile(user: $user, data: $data, emailChanged: $emailChanged);
        });
        if ($emailChanged) {
            rescue(fn () => $user->sendEmailVerificationNotification());
        }
    }
}
