<?php

declare(strict_types=1);

namespace App\Http\Controllers\Users;

use App\Models\Users\User;
use App\Repositories\Users\PasskeyRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final readonly class PasskeyController
{
    public function __invoke(Request $request, PasskeyRepository $passkeys): JsonResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        return response()->json(['data' => $passkeys->list(user: $user)]);
    }
}
