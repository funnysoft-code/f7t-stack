<?php

declare(strict_types=1);

namespace Modules\Identity\Console;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Modules\Identity\Models\Users\User;
use Throwable;

#[Description('Create the first unverified individual account')]
#[Signature('funnysoft:create-first-user {--name=} {--email=}')]
final class CreateFirstUserCommand extends Command
{
    public function handle(): int
    {
        if (User::query()->exists()) {
            $this->error('An account already exists. No user was created.');

            return self::FAILURE;
        }
        $data = [
            'name' => $this->option('name') ?? $this->ask('Name'),
            'email' => $this->option('email') ?? $this->ask('Email'),
            'password' => $this->secret('Password'),
            'password_confirmation' => $this->secret('Confirm password'),
        ];
        if (is_string($data['email'])) {
            $data['email'] = strtolower($data['email']);
        }
        $validator = Validator::make($data, ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'max:255'], 'password' => ['required', 'string', 'min:12', 'confirmed']]);
        if ($validator->fails()) {
            $this->error('Supply a valid name, email, and password of at least 12 characters with matching confirmation.');

            return self::FAILURE;
        }
        /** @var array<string, mixed> $attributes */
        $attributes = $validator->safe()->only(['name', 'email', 'password']);
        $user = DB::transaction(function () use ($attributes): ?User {
            DB::statement('LOCK TABLE users IN EXCLUSIVE MODE');

            return User::query()->exists() ? null : User::query()->create($attributes);
        });
        if (! $user instanceof User) {
            $this->error('An account already exists. No user was created.');

            return self::FAILURE;
        }
        try {
            $user->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            report($exception);
            $this->error('Account created, but mail failed. Sign in and resend verification from the verification notice.');

            return self::FAILURE;
        }
        $this->info('Unverified account created. Retrieve the verification message, then sign in.');

        return self::SUCCESS;
    }
}
