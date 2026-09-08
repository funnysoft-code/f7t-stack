<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

#[Description('Generate a concrete domain class from the application stubs')]
#[Signature('make:domain {kind : action, request, data, repository, or controller} {module} {name}')]
final class MakeDomainClassCommand extends Command
{
    private const array DIRECTORIES = [
        'action' => 'Actions',
        'request' => 'Http/Requests',
        'data' => 'Data',
        'repository' => 'Repositories',
        'controller' => 'Http/Controllers',
    ];

    public function handle(): int
    {
        $kind = $this->argument('kind');
        $module = $this->argument('module');
        $name = $this->argument('name');
        if (! isset(self::DIRECTORIES[$kind])
            || preg_match('/^[A-Z][A-Za-z0-9]*$/', $module) !== 1
            || preg_match('/^[A-Z][A-Za-z0-9]*(?:\/[A-Z][A-Za-z0-9]*)*$/', $name) !== 1) {
            $this->error('Use a supported kind, a module name, and a PascalCase class path.');

            return self::FAILURE;
        }
        if (! File::isFile(base_path('Modules/'.$module.'/module.json'))) {
            $this->error('Create the module before adding domain classes.');

            return self::FAILURE;
        }
        $suffix = ucfirst($kind);
        if (! str_ends_with($name, $suffix)) {
            $this->error('Class names for this kind must end with '.$suffix.'.');

            return self::FAILURE;
        }
        $relative = 'Modules/'.$module.'/'.self::DIRECTORIES[$kind].'/'.$name;
        $path = base_path($relative.'.php');
        if (File::exists($path)) {
            $this->error('Class already exists.');

            return self::FAILURE;
        }
        $contents = str_replace(
            ['{{ namespace }}', '{{ class }}'],
            [str_replace('/', '\\', dirname($relative)), basename($relative)],
            File::get(base_path('stubs/domain/'.$kind.'.stub')),
        );
        File::ensureDirectoryExists(dirname($path));
        File::put($path, $contents);
        $this->info('Created '.$relative.'.php');

        return self::SUCCESS;
    }
}
