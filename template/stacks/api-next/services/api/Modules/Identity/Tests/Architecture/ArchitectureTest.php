<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route as RouteFacade;
use PhpParser\Node;
use PhpParser\Node\Expr\MethodCall;
use PhpParser\Node\Expr\StaticCall;
use PhpParser\Node\Identifier;
use PhpParser\NodeFinder;
use PhpParser\ParserFactory;

arch('module code uses strict types')->expect('Modules\\Identity')->toUseStrictTypes();
arch('module classes are final')->expect('Modules\\Identity')->classes()->toBeFinal();
arch('debug helpers stay out of application code')->expect(['App', 'Modules\\Identity'])->not->toUse(['dd', 'dump', 'ray']);
arch('repositories are concrete')->expect('Modules\\Identity\\Repositories')->not->toBeInterfaces();
arch('actions have the required suffix')->expect('Modules\\Identity\\Actions')->toHaveSuffix('Action');
arch('no abstract action layer')->expect(['App', 'Modules\\Identity'])->not->toHaveSuffix('BaseAction');
arch('no abstract repository layer')->expect(['App', 'Modules\\Identity'])->not->toHaveSuffix('BaseRepository');
arch('public UUIDs do not replace integer primary keys')->expect('Modules\\Identity\\Models')->not->toUse(HasUuids::class);

it('exposes execute as the only operation on stateless settings actions', function (): void {
    foreach (File::files(base_path('Modules/Identity/Actions/Users')) as $file) {
        $class = 'Modules\\Identity\\Actions\\Users\\'.$file->getBasename('.php');
        assert(class_exists($class));
        $reflection = new ReflectionClass($class);
        $operations = array_values(array_map(fn (ReflectionMethod $method): string => $method->getName(), array_filter($reflection->getMethods(ReflectionMethod::IS_PUBLIC), fn (ReflectionMethod $method): bool => ! $method->isConstructor())));
        expect($operations)->toBe(['execute'])
            ->and($reflection->isFinal())->toBeTrue()
            ->and($reflection->isReadOnly())->toBeTrue();
    }
});

it('keeps direct persistence out of settings actions', function (): void {
    $parser = (new ParserFactory)->createForHostVersion();
    foreach (File::files(base_path('Modules/Identity/Actions/Users')) as $file) {
        $nodes = $parser->parse(File::get($file->getPathname()));
        assert(is_array($nodes));
        $calls = (new NodeFinder)->find($nodes, fn (Node $node): bool => $node instanceof MethodCall || $node instanceof StaticCall);
        foreach ($calls as $call) {
            assert($call instanceof MethodCall || $call instanceof StaticCall);
            if ($call->name instanceof Identifier) {
                expect($call->name->toString())->not->toBeIn(['forceFill', 'save', 'delete', 'update', 'create', 'insert', 'upsert', 'deleteToken']);
            }
        }
    }
});

it('requires a named throttle on every application route', function (): void {
    $unlimited = collect(RouteFacade::getRoutes()->getRoutes())->reject(function (Route $route): bool {
        if ($route->uri() === 'up' || str_starts_with($route->uri(), 'storage/') || str_starts_with($route->uri(), '_boost/')) {
            return true;
        }

        return collect(RouteFacade::gatherRouteMiddleware($route))->contains(fn (string $middleware): bool => preg_match('/(?:^throttle|ThrottleRequests(?:WithRedis)?):[a-z][a-z-]*$/', $middleware) === 1);
    })->map(fn (Route $route): string => $route->uri());

    expect($unlimited->all())->toBeEmpty();
});
