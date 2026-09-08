<?php

declare(strict_types=1);

use App\Models\Users\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

pest()->use(RefreshDatabase::class);

test('unverified accounts have safe notice resend and logout but no application access', function (): void {
    Notification::fake();
    $user = User::factory()->create();
    $this->actingAs($user)->getJson('/email/verify')->assertOk()->assertJsonPath('component', 'auth/verify-email');
    $this->get('/')->assertRedirect('/email/verify');
    $this->getJson('/')->assertForbidden();
    for ($i = 0; $i < 6; $i++) {
        $this->postJson('/email/verification-notification')->assertAccepted();
    }
    Notification::assertSentTo($user, VerifyEmail::class);
    $this->postJson('/email/verification-notification')->assertTooManyRequests();
    $this->postJson('/logout')->assertNoContent();
    $this->getJson('/email/verify')->assertUnauthorized();
});

test('only authenticated intended user and current email can redeem a signed link', function (string $case): void {
    $user = User::factory()->create();
    $link = URL::temporarySignedRoute('verification.verify', $case === 'expired' ? now()->subMinute() : now()->addHour(), ['id' => $user->id, 'hash' => $case === 'wrong-hash' ? sha1('wrong@example.test') : sha1($user->email)]);
    if ($case === 'tampered') {
        $link .= '&extra=tampered';
    }
    if ($case === 'email-changed') {
        $user->update(['email' => 'changed@example.test']);
    }
    if ($case !== 'guest') {
        $this->actingAs($case === 'wrong-user' ? User::factory()->create() : $user);
    }
    $this->getJson($link)->assertStatus($case === 'guest' ? 401 : 403);
    expect($user->refresh()->hasVerifiedEmail())->toBeFalse();
})->with(['expired', 'wrong-hash', 'tampered', 'email-changed', 'wrong-user', 'guest']);

test('a valid verification link unlocks the app and safe replay is idempotent', function (): void {
    $user = User::factory()->create();
    $link = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->email)]);
    $this->actingAs($user)->getJson($link)->assertNoContent();
    expect($user->refresh()->hasVerifiedEmail())->toBeTrue();
    $this->getJson('/')->assertOk()->assertJsonPath('component', 'home');
    $this->getJson($link)->assertNoContent();
});
