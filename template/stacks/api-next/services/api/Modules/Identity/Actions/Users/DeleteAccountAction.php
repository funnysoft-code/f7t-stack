<?php

declare(strict_types=1);

namespace Modules\Identity\Actions\Users;

use Illuminate\Support\Facades\DB;
use Modules\Identity\Models\Users\User;
use Modules\Identity\Repositories\Users\AccountRepository;

final readonly class DeleteAccountAction
{
    public function __construct(private AccountRepository $accounts) {}

    public function execute(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $this->accounts->removeAccount(user: $user);
        });
    }
}
