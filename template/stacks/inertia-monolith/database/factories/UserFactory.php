<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<User> */
final class UserFactory extends Factory
{
    protected $model = User::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => null,
            'password' => 'test-password-only',
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (): array => ['email_verified_at' => now()]);
    }
}
