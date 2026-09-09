<?php

declare(strict_types=1);

use App\Models\Users\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

pest()->use(RefreshDatabase::class);

test('bootstrap creates an unverified ordinary first account with signup disabled and refuses repeats', function (): void {
    Notification::fake();
    $this->console('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'FIRST@example.test'])
        ->expectsQuestion('Password', 'secure-password')->expectsQuestion('Confirm password', 'secure-password')->assertSuccessful();
    $user = User::sole();
    expect($user->email)->toBe('first@example.test')->and($user->hasVerifiedEmail())->toBeFalse()->and($user->getAllPermissions())->toBeEmpty();
    Notification::assertSentTo($user, VerifyEmail::class);
    $this->console('funnysoft:create-first-user')->assertFailed();
    expect(User::count())->toBe(1);
});

test('bootstrap rejects an existing ordinary account without prompting or mutation', function (): void {
    User::factory()->create();
    $this->console('funnysoft:create-first-user')->assertFailed();
    expect(User::count())->toBe(1);
});

test('bootstrap rejects invalid input without partial writes', function (): void {
    $this->console('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'invalid'])
        ->expectsQuestion('Password', 'short')->expectsQuestion('Confirm password', 'different')->assertFailed();
    expect(User::count())->toBe(0);
});

test('bootstrap mail failure retains the account and explains sign in and resend recovery', function (): void {
    Notification::shouldReceive('send')->once()->andThrow(new RuntimeException('transport unavailable'));
    $this->console('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'first@example.test'])
        ->expectsQuestion('Password', 'secure-password')->expectsQuestion('Confirm password', 'secure-password')
        ->expectsOutput('Account created, but verification mail could not be sent. Sign in and resend from /email/verify.')->assertFailed();
    expect(User::sole()->hasVerifiedEmail())->toBeFalse();
    Notification::fake();
    $this->postJson('/login', ['email' => 'first@example.test', 'password' => 'secure-password'])->assertOk();
    $this->postJson('/email/verification-notification')->assertAccepted();
    Notification::assertSentTo(User::sole(), VerifyEmail::class);
});

test('bootstrap rechecks under the transaction lock when an account appears after its first check', function (): void {
    Notification::fake();
    $inserted = false;
    DB::listen(function (QueryExecuted $query) use (&$inserted): void {
        if (! $inserted && str_contains($query->sql, 'exists') && str_contains($query->sql, 'users')) {
            $inserted = true;
            User::factory()->create(['email' => 'existing@example.test']);
        }
    });
    $this->console('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'first@example.test'])
        ->expectsQuestion('Password', 'secure-password')->expectsQuestion('Confirm password', 'secure-password')->assertFailed();
    expect(User::sole()->email)->toBe('existing@example.test');
    Notification::assertNothingSent();
});
