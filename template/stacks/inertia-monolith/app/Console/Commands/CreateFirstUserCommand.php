<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Users\CreateUserAction;
use App\Data\Users\CreateUserData;
use App\Models\Users\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

#[Description('Create the first unverified ordinary account; password is prompted securely')]
#[Signature('funnysoft:create-first-user {--name=} {--email=}')]
final class CreateFirstUserCommand extends Command
{
    public function handle(CreateUserAction $createUser): int
    {
        if (User::query()->exists()) {
            $this->error('Provisioning refused: the users table is not empty.');

            return self::FAILURE;
        }

        $email = $this->option('email') ?? $this->ask('Email');
        $input = [
            'name' => $this->option('name') ?? $this->ask('Name'),
            'email' => is_string($email) ? Str::lower($email) : '',
            'password' => $this->secret('Password'),
            'password_confirmation' => $this->secret('Confirm password'),
        ];
        try {
            $user = User::resolveConnection()->transaction(function () use ($createUser, $input): User {
                // Serializes bootstrap with other inserts, including enabled registration.
                User::resolveConnection()->statement('LOCK TABLE users IN EXCLUSIVE MODE');
                if (User::query()->exists()) {
                    throw new RuntimeException('Provisioning refused: the users table is not empty.');
                }

                return $createUser->execute(CreateUserData::validated($input));
            });
        } catch (ValidationException) {
            $this->error('Invalid account details. Use a unique valid email and matching passwords of at least 12 characters.');

            return self::FAILURE;
        } catch (RuntimeException) {
            $this->error('Provisioning refused: another account was created.');

            return self::FAILURE;
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (Throwable) {
            $this->error('Account created, but verification mail could not be sent. Sign in and resend from /email/verify.');

            return self::FAILURE;
        }
        $this->info('Unverified account created. Retrieve the verification message, then sign in.');

        return self::SUCCESS;
    }
}
