<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Sleep;
use Tests\TestCase;

pest()->extend(TestCase::class)->in('Architecture', 'Feature', 'Http');

beforeEach(function (): void {
    Http::preventStrayRequests();
    Process::preventStrayProcesses();
    Sleep::fake();
});
