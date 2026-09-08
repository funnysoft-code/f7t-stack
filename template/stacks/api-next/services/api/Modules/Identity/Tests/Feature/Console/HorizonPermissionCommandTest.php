<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;
use Modules\Identity\Models\Users\User;

it('bounds operational grants to the named account and requires verification', function (): void {
    $user = User::query()->create(['name' => 'Operator', 'email' => 'operator@example.test', 'password' => 'test-password']);
    $other = User::query()->create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'test-password']);
    $this->pendingCommand('funnysoft:horizon-permission', ['operation' => 'grant', 'email' => $user->email])->assertSuccessful();
    expect(Gate::forUser($user->fresh())->allows('viewHorizon'))->toBeFalse();
    $user->markEmailAsVerified();
    expect(Gate::forUser($user->fresh())->allows('viewHorizon'))->toBeTrue()->and(Gate::forUser($other)->allows('viewHorizon'))->toBeFalse();
    $this->pendingCommand('funnysoft:horizon-permission', ['operation' => 'revoke', 'email' => $user->email])->assertSuccessful();
    expect(Gate::forUser($user->fresh())->allows('viewHorizon'))->toBeFalse();
    $this->pendingCommand('funnysoft:horizon-permission', ['operation' => 'grant', 'email' => 'missing@example.test'])->assertFailed();
    $this->pendingCommand('funnysoft:horizon-permission', ['operation' => 'admin', 'email' => $user->email])->assertFailed();
});
