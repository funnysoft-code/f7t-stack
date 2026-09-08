<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Requests;

use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Http\FormRequest;
use Modules\Identity\Models\Users\User;

final class VerifyEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            && hash_equals($user->uuid, (string) $this->route('id'))
            && hash_equals(sha1($user->getEmailForVerification()), (string) $this->route('hash'));
    }

    public function fulfill(): void
    {
        $user = $this->user();
        assert($user instanceof User);
        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }
    }
}
