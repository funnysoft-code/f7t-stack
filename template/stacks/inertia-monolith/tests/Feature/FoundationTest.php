<?php

declare(strict_types=1);

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Laravel\Horizon\Horizon;
use Spatie\Permission\Models\Permission;

pest()->use(RefreshDatabase::class);

test('PostgreSQL boots a team-free UUID v7 account schema', function (): void {
    expect(config('database.default'))->toBe('pgsql')
        ->and(Schema::hasTable('teams'))->toBeFalse()
        ->and(config('permission.teams'))->toBeFalse()
        ->and(config('permission.enable_wildcard_permission'))->toBeFalse()
        ->and(Model::preventsLazyLoading())->toBeTrue();
    $user = User::factory()->create();
    expect($user->id)->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/')
        ->and($user->getRouteKey())->toBe($user->id)
        ->and($user->hasVerifiedEmail())->toBeFalse()
        ->and($user->toArray())->not->toHaveKeys(['password', 'remember_token']);
    $this->get('/up')->assertOk();
});

test('user policies allow only the account owner', function (): void {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    foreach (['view', 'update', 'delete'] as $ability) {
        expect($owner->can($ability, $owner))->toBeTrue()
            ->and($other->can($ability, $owner))->toBeFalse();
    }
});

test('Horizon denies guests and requires verification and an explicit revocable permission even locally', function (): void {
    app()->instance('env', 'local');
    $request = Request::create('/horizon');
    expect(Horizon::check($request))->toBeFalse();
    $user = User::factory()->create();
    $request->setUserResolver(fn (): User => $user);
    expect(Horizon::check($request))->toBeFalse();
    Permission::findOrCreate('view-horizon', 'web');
    $user->givePermissionTo('view-horizon');
    expect(Horizon::check($request))->toBeFalse();
    $user->markEmailAsVerified();
    expect(Horizon::check($request))->toBeTrue();
    $user->revokePermissionTo('view-horizon');
    expect(Horizon::check($request))->toBeFalse();
    $this->getJson('/horizon/api/stats')->assertForbidden();
    $this->get('/horizon')->assertForbidden();
});

test('cache and sessions use distinct Redis databases and Horizon uses the queue connection', function (): void {
    expect(config('database.redis.cache.database'))->not->toBe(config('database.redis.sessions.database'))
        ->and(config('session.connection'))->toBe('sessions')
        ->and(config('cache.stores.sessions.connection'))->toBe('sessions')
        ->and(config('horizon.use'))->toBe('default')
        ->and(config('horizon.defaults.supervisor-1.connection'))->toBe('redis');
});
