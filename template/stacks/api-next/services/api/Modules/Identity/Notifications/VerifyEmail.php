<?php

declare(strict_types=1);

namespace Modules\Identity\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as FrameworkVerifyEmail;
use Illuminate\Support\Facades\URL;
use Modules\Identity\Models\Users\User;

final class VerifyEmail extends FrameworkVerifyEmail
{
    /** @param User $notifiable */
    protected function verificationUrl($notifiable): string
    {
        $path = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $notifiable->uuid,
            'hash' => sha1($notifiable->getEmailForVerification()),
        ], absolute: false);

        return rtrim(config()->string('funnysoft.frontend_url'), '/').'/verify-email?verification_url='.rawurlencode($path);
    }
}
