<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Modules\Identity\Models\Users\User;
use Modules\Identity\Notifications\VerifyEmail;

it('verifies an authenticated public UUID and exposes no integer identifier in mail', function (): void {
    Notification::fake();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $user->sendEmailVerificationNotification();
    Notification::assertSentTo($user, VerifyEmail::class);
    $url = (new VerifyEmail)->toMail($user)->actionUrl;
    expect($url)->toContain('/verify-email?verification_url=')->toContain($user->uuid);
    $path = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->uuid, 'hash' => sha1($user->email)], absolute: false);
    $this->getJson($path)->assertUnauthorized();
    $this->actingAs($user)->getJson($path)->assertOk()->assertJsonPath('data.email_verified', true);
    $this->getJson('/api/app')->assertOk();
    $this->getJson($path)->assertOk();
});

it('rejects expired tampered wrong-user wrong-hash and old-email verification links', function (): void {
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $other = User::query()->create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'test-password']);
    $valid = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->uuid, 'hash' => sha1($user->email)], absolute: false);
    $expired = URL::temporarySignedRoute('verification.verify', now()->subMinute(), ['id' => $user->uuid, 'hash' => sha1($user->email)], absolute: false);
    $wrongHash = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->uuid, 'hash' => sha1('wrong@example.test')], absolute: false);
    $this->actingAs($other)->getJson($valid)->assertForbidden();
    $this->actingAs($user)->getJson($expired)->assertForbidden();
    $this->getJson($valid.'&tampered=1')->assertForbidden();
    $this->getJson($wrongHash)->assertForbidden();
    $user->update(['email' => 'corrected@example.test']);
    $this->getJson($valid)->assertForbidden();
    expect($user->fresh()?->hasVerifiedEmail())->toBeFalse();
});

it('throttles verification resend', function (): void {
    Notification::fake();
    $user = User::query()->create(['name' => 'User', 'email' => 'user@example.test', 'password' => 'test-password']);
    $this->actingAs($user);
    for ($attempt = 0; $attempt < 6; $attempt++) {
        $this->postJson('/api/auth/email/verification-notification')->assertSuccessful();
    }
    $this->postJson('/api/auth/email/verification-notification')->assertTooManyRequests();
});
