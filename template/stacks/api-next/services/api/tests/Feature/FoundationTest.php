<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Model;
use Illuminate\Session\SessionManager;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Modules\Identity\Models\Users\User;
use Spatie\Permission\Models\Permission;

it('boots without production credentials and migrates individual accounts', function (): void {
    $this->getJson('/up')->assertOk();
    expect(Schema::hasTable('users'))->toBeTrue()
        ->and(Schema::hasTable('teams'))->toBeFalse()
        ->and(config('permission.teams'))->toBeFalse();
    $user = User::query()->create(['name' => 'Foundation', 'email' => 'foundation@example.test', 'password' => 'test-password']);
    expect($user->getRawOriginal('id'))->toBeInt()
        ->and($user->uuid)->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/')
        ->and($user->getRouteKey())->toBe($user->uuid)
        ->and($user->toArray())->not->toHaveKeys(['id', 'password', 'remember_token'])
        ->and($user->hasVerifiedEmail())->toBeFalse();
});

it('denies Horizon by default even locally and requires verification plus permission', function (): void {
    app()->detectEnvironment(fn (): string => 'local');
    $this->getJson('/horizon')->assertForbidden();
    $this->get('/horizon')->assertForbidden();
    $user = User::query()->create(['name' => 'Operator', 'email' => 'operator@example.test', 'password' => 'test-password']);
    expect(Gate::forUser($user)->allows('viewHorizon'))->toBeFalse();
    $this->actingAs($user)->getJson('/horizon/api/stats')->assertForbidden();
    Permission::findOrCreate('view-horizon', 'web');
    $user->givePermissionTo('view-horizon');
    expect(Gate::forUser($user)->allows('viewHorizon'))->toBeFalse();
    $user->markEmailAsVerified();
    expect(Gate::forUser($user)->allows('viewHorizon'))->toBeTrue();
    $this->get('/horizon')->assertOk();
    $this->actingAs($user)->getJson('/horizon/api/stats')->assertOk();
    $user->revokePermissionTo('view-horizon');
    $this->getJson('/horizon/api/stats')->assertForbidden();
});

it('keeps Eloquent strict and uses Redis for production queue defaults', function (): void {
    expect(Model::preventsLazyLoading())->toBeTrue()
        ->and(Model::preventsAccessingMissingAttributes())->toBeTrue()
        ->and(Model::preventsSilentlyDiscardingAttributes())->toBeTrue()
        ->and(Model::isAutomaticallyEagerLoadingRelationships())->toBeFalse()
        ->and(config('horizon.defaults.supervisor-1.connection'))->toBe('redis')
        ->and(config('queue.connections.redis.after_commit'))->toBeTrue();
});

it('keeps Redis session state after the application cache is cleared', function (): void {
    expect(config('database.redis.sessions.database'))->not->toBe(config('database.redis.cache.database'));
    /** @var Store $session */
    $session = app(SessionManager::class)->driver('redis');
    $session->start();
    $session->put('foundation-proof', 'retained');
    $session->save();
    Cache::store('redis')->put('foundation-proof', 'cached', 60);
    expect(Artisan::call('cache:clear', ['store' => 'redis']))->toBe(0)
        ->and(Cache::store('redis')->get('foundation-proof'))->toBeNull();
    $session->flush();
    $session->start();
    expect($session->get('foundation-proof'))->toBe('retained');
    $session->invalidate();
});
