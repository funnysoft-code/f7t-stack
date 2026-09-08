<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Controllers\Users;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Identity\Actions\Users\DeleteAccountAction;
use Modules\Identity\Actions\Users\UpdatePasswordAction;
use Modules\Identity\Actions\Users\UpdateProfileAction;
use Modules\Identity\Data\Users\UpdatePasswordData;
use Modules\Identity\Data\Users\UpdateProfileData;
use Modules\Identity\Http\Requests\Users\UpdatePasswordRequest;
use Modules\Identity\Http\Requests\Users\UpdateProfileRequest;
use Modules\Identity\Http\Resources\UserResource;
use Modules\Identity\Models\Users\User;
use Symfony\Component\HttpFoundation\Response;

final readonly class SettingsController
{
    public function profile(UpdateProfileRequest $request, UpdateProfileAction $action): UserResource
    {
        $user = $request->user();
        assert($user instanceof User);
        $action->execute(user: $user, data: UpdateProfileData::from($request->validated()));

        return new UserResource($user);
    }

    public function password(UpdatePasswordRequest $request, UpdatePasswordAction $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);
        $action->execute(user: $user, data: UpdatePasswordData::from($request->validated()));

        return response()->noContent();
    }

    public function destroy(Request $request, DeleteAccountAction $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);
        $action->execute(user: $user);
        Auth::guard('web')->logoutCurrentDevice();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
