<?php

declare(strict_types=1);

namespace App\Http\Controllers\Users;

use App\Actions\Users\DeleteAccountAction;
use App\Actions\Users\ResetPasswordAction;
use App\Actions\Users\UpdateProfileAction;
use App\Http\Requests\Users\UpdatePasswordRequest;
use App\Http\Requests\Users\UpdateProfileRequest;
use App\Models\Users\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final readonly class AccountSettingsController
{
    public function update(UpdateProfileRequest $request, UpdateProfileAction $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);
        $action->execute(user: $user, data: $request->toData());

        return response()->noContent();
    }

    public function password(UpdatePasswordRequest $request, ResetPasswordAction $action): Response
    {
        $user = $request->user();
        assert($user instanceof User);
        $action->execute(user: $user, data: $request->toData());
        $request->session()->regenerate();

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
