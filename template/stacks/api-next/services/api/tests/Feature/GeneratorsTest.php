<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

it('generates every domain layer in the module namespace without overwriting existing code', function (string $kind, string $directory, string $name): void {
    $path = base_path('Modules/Identity/'.$directory.'/'.$name.'.php');

    try {
        expect(Artisan::call('make:domain', ['kind' => $kind, 'module' => 'Identity', 'name' => $name]))->toBe(0);
        $contents = File::get($path);
        expect($contents)->toContain('declare(strict_types=1);', 'namespace Modules\\Identity\\'.str_replace('/', '\\', $directory).';', 'final ')
            ->and(Artisan::call('make:domain', ['kind' => $kind, 'module' => 'Identity', 'name' => $name]))->toBe(1)
            ->and(File::get($path))->toBe($contents);
    } finally {
        File::delete($path);
    }
})->with([
    ['action', 'Actions', 'FoundationProbeAction'],
    ['request', 'Http/Requests', 'FoundationProbeRequest'],
    ['data', 'Data', 'FoundationProbeData'],
    ['repository', 'Repositories', 'FoundationProbeRepository'],
    ['controller', 'Http/Controllers', 'FoundationProbeController'],
]);

it('rejects unknown modules, kinds, unsafe paths, and missing suffixes', function (string $kind, string $module, string $name): void {
    expect(Artisan::call('make:domain', ['kind' => $kind, 'module' => $module, 'name' => $name]))->toBe(1);
})->with([
    ['action', 'MissingModule', 'CreateUserAction'],
    ['interface', 'Identity', 'UserInterface'],
    ['action', '../Outside', 'CreateUserAction'],
    ['action', 'Identity', '../../OutsideAction'],
    ['action', 'Identity', 'CreateUser'],
]);
