<?php

declare(strict_types=1);

namespace Modules\Identity\Actions\Users;

use Illuminate\Support\Facades\DB;
use Modules\Identity\Data\Users\UpdatePasswordData;
use Modules\Identity\Models\Users\User;
use Modules\Identity\Repositories\Users\AccountRepository;
use SensitiveParameter;

final readonly class UpdatePasswordAction
{
    public function __construct(private AccountRepository $accounts) {}

    public function execute(User $user, #[SensitiveParameter] UpdatePasswordData $data): void
    {
        DB::transaction(function () use ($user, $data): void {
            $this->accounts->replacePassword(user: $user, password: $data->password);
        });
    }
}
