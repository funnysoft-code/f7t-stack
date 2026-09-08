<?php

declare(strict_types=1);
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\Mailer\Transport\Smtp\SmtpTransport;

// Invoked from the PHP application root. No credential or exception text is printed.
try {
    require getcwd().'/vendor/autoload.php';
    $app = require getcwd().'/bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();
    if (! $app->environment('local') || $app->configurationIsCached()) {
        throw new RuntimeException('Local uncached configuration required.');
    }
    $expected = $argv[2] ?? '';
    $database = config('database.connections.pgsql.database');
    if (! preg_match('/\Af7t_[a-z0-9_]{1,44}\z/', $expected) || $database !== $expected || config('database.connections.pgsql.url')) {
        throw new RuntimeException('Dedicated database required.');
    }
    $connection = config('database.connections.pgsql');
    $host = $connection['host'];
    $port = (int) $connection['port'];
    if (! is_string($host) || str_contains($host, ';') || $port < 1 || $port > 65535) {
        throw new RuntimeException('Invalid PostgreSQL connection.');
    }
    $pdo = new PDO("pgsql:host={$host};port={$port};dbname=postgres;connect_timeout=5", $connection['username'], $connection['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    if (($argv[1] ?? '') === 'database') {
        $query = $pdo->prepare('SELECT 1 FROM pg_database WHERE datname = ?');
        $query->execute([$database]);
        if (! $query->fetchColumn()) {
            // Identifier validated above and bound to this generated project.
            $pdo->exec('CREATE DATABASE "'.$database.'"');
        }
        exit(0);
    }
    if (($argv[1] ?? '') !== 'services') {
        throw new RuntimeException('Unknown stage.');
    }
    if (config('database.redis.options.prefix') !== $expected.':') {
        throw new RuntimeException('Dedicated Redis namespace required.');
    }
    foreach (['default', 'cache', 'sessions'] as $name) {
        $pong = Redis::connection($name)->ping();
        if (! in_array($pong, [true, 'PONG', '+PONG'], true)) {
            throw new RuntimeException('Redis did not answer PING.');
        }
    }
    if (config('mail.default') !== 'smtp') {
        throw new RuntimeException('Local setup requires SMTP.');
    }
    $smtp = Mail::mailer('smtp')->getSymfonyTransport();
    if (! $smtp instanceof SmtpTransport) {
        throw new RuntimeException('SMTP transport required.');
    }
    $smtp->start();
    $smtp->stop();
} catch (Throwable) {
    fwrite(STDERR, "Local service check failed. Check the selected stage and .env locally.\n");
    exit(1);
}
