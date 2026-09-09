<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Controllers\Users;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Modules\Identity\Http\Resources\PasskeyResource;
use Modules\Identity\Models\Users\User;
use Modules\Identity\Repositories\Users\PasskeyRepository;

final readonly class PasskeyController
{
    public function __invoke(Request $request, PasskeyRepository $passkeys): AnonymousResourceCollection
    {
        $user = $request->user();
        assert($user instanceof User);

        return PasskeyResource::collection($passkeys->list(user: $user));
    }
}
