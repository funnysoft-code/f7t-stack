<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Testing\PendingCommand;

abstract class TestCase extends \Illuminate\Foundation\Testing\TestCase
{
    /** @param array<string, string> $parameters */
    protected function pendingCommand(string $command, array $parameters): PendingCommand
    {
        $pending = $this->artisan($command, $parameters);
        assert($pending instanceof PendingCommand);

        return $pending;
    }
}
