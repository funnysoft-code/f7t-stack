<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Sleep;
use Tests\TestCase;

pest()->extend(TestCase::class)->use(RefreshDatabase::class)->in('Feature', '../Modules/Identity/Tests/Http', '../Modules/Identity/Tests/Architecture');
pest()->extend(TestCase::class)->use(DatabaseMigrations::class)->in('../Modules/Identity/Tests/Feature');

beforeEach(function (): void {
    Http::preventStrayRequests();
    Process::preventStrayProcesses();
    Sleep::fake();
});
