<?php

declare(strict_types=1);

use App\Models\Users\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->use(RefreshDatabase::class);

test('Horizon grants and revokes only the named verified account', function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $this->console('funnysoft:horizon-permission', ['action' => 'grant', 'email' => $user->email])->assertSuccessful();
    expect($user->fresh()?->can('viewHorizon'))->toBeFalse()->and($other->can('viewHorizon'))->toBeFalse();
    $user->markEmailAsVerified();
    expect($user->fresh()?->can('viewHorizon'))->toBeTrue();
    $this->console('funnysoft:horizon-permission', ['action' => 'revoke', 'email' => $user->email])->assertSuccessful();
    expect($user->fresh()?->can('viewHorizon'))->toBeFalse();
});

test('Horizon rejects unknown accounts and arbitrary actions', function (): void {
    $this->console('funnysoft:horizon-permission', ['action' => 'grant', 'email' => 'missing@example.test'])->assertFailed();
    $this->console('funnysoft:horizon-permission', ['action' => 'admin', 'email' => 'missing@example.test'])->assertFailed();
});
