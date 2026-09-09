<?php

declare(strict_types=1);

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Modules\Identity\Models\Users\User;
use Modules\Identity\Notifications\VerifyEmail;

it('provisions only the first unverified ordinary account while registration is off', function (): void {
    Notification::fake();
    $this->pendingCommand('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'First@Example.test'])->expectsQuestion('Password', 'test-password')->expectsQuestion('Confirm password', 'test-password')->assertSuccessful();
    $user = User::query()->sole();
    expect($user->email)->toBe('first@example.test')->and($user->hasVerifiedEmail())->toBeFalse()->and($user->permissions()->count())->toBe(0)->and($user->roles()->count())->toBe(0);
    Notification::assertSentTo($user, VerifyEmail::class);
    $this->pendingCommand('funnysoft:create-first-user', ['--name' => 'Another', '--email' => 'another@example.test'])->assertFailed();
    expect(User::query()->count())->toBe(1);
});

it('retains the account when mail fails and allows sign-in and resend recovery', function (): void {
    Notification::shouldReceive('send')->once()->andThrow(new RuntimeException('Test mail unavailable'));
    $this->pendingCommand('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'first@example.test'])->expectsQuestion('Password', 'test-password')->expectsQuestion('Confirm password', 'test-password')->expectsOutput('Account created, but mail failed. Sign in and resend verification from the verification notice.')->assertFailed();
    $user = User::query()->sole();
    expect($user->hasVerifiedEmail())->toBeFalse();
    Notification::fake();
    $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'test-password'])->assertOk();
    $this->postJson('/api/auth/email/verification-notification')->assertSuccessful();
    Notification::assertSentTo($user, VerifyEmail::class);
});

it('commits the first account before attempting delivery', function (): void {
    Notification::shouldReceive('send')->once()->withArgs(function (mixed $notifiables, mixed $notification): bool {
        expect(DB::transactionLevel())->toBe(0)
            ->and(User::query()->count())->toBe(1);

        return $notification instanceof VerifyEmail;
    });
    $this->pendingCommand('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'first@example.test'])->expectsQuestion('Password', 'test-password')->expectsQuestion('Confirm password', 'test-password')->assertSuccessful();
});

it('refuses an independently populated user table without changing the account', function (): void {
    Notification::fake();
    $existing = User::query()->create(['name' => 'Existing', 'email' => 'existing@example.test', 'password' => 'test-password']);
    $this->pendingCommand('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'first@example.test'])->assertFailed();
    expect(User::query()->sole()->uuid)->toBe($existing->uuid);
    Notification::assertNothingSent();
});

it('rejects invalid provisioning input without creating an account or sending mail', function (string $email, string $password, string $confirmation): void {
    Notification::fake();
    $this->pendingCommand('funnysoft:create-first-user', ['--name' => 'First', '--email' => $email])
        ->expectsQuestion('Password', $password)
        ->expectsQuestion('Confirm password', $confirmation)
        ->assertFailed();
    expect(User::query()->count())->toBe(0);
    Notification::assertNothingSent();
})->with([
    'invalid email' => ['invalid', 'test-password', 'test-password'],
    'short password' => ['first@example.test', 'short', 'short'],
    'mismatched confirmation' => ['first@example.test', 'test-password', 'different-password'],
]);

it('refuses provisioning when another connection creates an account before the lock', function (): void {
    Notification::fake();
    config(['database.connections.provisioning-racer' => config('database.connections.'.config()->string('database.default'))]);
    $inserted = false;
    DB::connection()->beforeExecuting(function (string $query) use (&$inserted): void {
        if ($query === 'LOCK TABLE users IN EXCLUSIVE MODE' && ! $inserted) {
            $inserted = true;
            User::on('provisioning-racer')->create(['name' => 'Concurrent', 'email' => 'concurrent@example.test', 'password' => 'test-password']);
        }
    });
    try {
        $this->pendingCommand('funnysoft:create-first-user', ['--name' => 'First', '--email' => 'first@example.test'])
            ->expectsQuestion('Password', 'test-password')
            ->expectsQuestion('Confirm password', 'test-password')
            ->expectsOutput('An account already exists. No user was created.')
            ->assertFailed();
        expect($inserted)->toBeTrue()->and(User::query()->sole()->email)->toBe('concurrent@example.test');
        Notification::assertNothingSent();
    } finally {
        DB::purge('provisioning-racer');
    }
});
