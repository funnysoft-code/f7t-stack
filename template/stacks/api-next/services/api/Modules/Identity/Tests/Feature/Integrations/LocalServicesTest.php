<?php

declare(strict_types=1);

use App\Http\Rules\TurnstileToken;
use App\Providers\AppServiceProvider;
use App\Support\Integrations\Turnstile;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Mail\Transport\ResendTransport;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Laravel\Nightwatch\NightwatchServiceProvider;

test('local mail uses SMTP and telemetry is disabled without production credentials', function (): void {
    expect(config('mail.mailers.smtp.port'))->toBeIn([2525, '2525'])
        ->and(config('services.resend.key'))->toBeIn([null, ''])
        ->and(config('nightwatch.enabled'))->toBeFalse()
        ->and(app()->getProvider(NightwatchServiceProvider::class))->toBeNull();
    Http::assertNothingSent();
});

test('turnstile uses siteverify for dummy local tokens and rejects deterministic CI failures', function (): void {
    config(['services.turnstile.secret_key' => '1x0000000000000000000000000000000AA']);
    Http::fake(['challenges.cloudflare.com/*' => Http::sequence()->push(['success' => true])->push(['success' => false])->pushStatus(503)]);
    $turnstile = new Turnstile;
    expect($turnstile->verify('XXXX.DUMMY.TOKEN.XXXX'))->toBeTrue()
        ->and($turnstile->verify('rejected-token'))->toBeFalse()
        ->and($turnstile->verify('network-failure'))->toBeFalse()
        ->and($turnstile->verify(''))->toBeFalse();
    Http::assertSentCount(3);
});

test('Resend transport is prewired and can be constructed without sending mail', function (): void {
    config(['services.resend.key' => 're_test_configuration_only']);
    expect(Mail::mailer('resend')->getSymfonyTransport())->toBeInstanceOf(ResendTransport::class);
    Http::assertNothingSent();
});

test('turnstile rejects missing and all documented dummy credential families in production', function (): void {
    foreach (['', '1x00000000000000000000AA', '2x00000000000000000000AB', '3x00000000000000000000FF'] as $key) {
        expect(fn () => Turnstile::assertProductionCredentials($key, $key))->toThrow(LogicException::class);
    }
    Turnstile::assertProductionCredentials('production-site', 'production-secret');
});

test('production application boot enforces Turnstile credentials', function (): void {
    app()->detectEnvironment(fn (): string => 'production');
    foreach (['', '1x00000000000000000000AA'] as $key) {
        config(['services.turnstile.site_key' => $key, 'services.turnstile.secret_key' => $key]);
        expect(fn () => new AppServiceProvider(app())->boot())->toThrow(LogicException::class);
    }
    config(['services.turnstile.site_key' => 'production-site', 'services.turnstile.secret_key' => 'production-secret']);
    new AppServiceProvider(app())->boot();
    app()->detectEnvironment(fn (): string => 'testing');
});

test('turnstile rejects missing configuration oversized tokens and connection failures', function (): void {
    $turnstile = new Turnstile;
    config(['services.turnstile.secret_key' => null]);
    expect($turnstile->verify('token'))->toBeFalse();
    config(['services.turnstile.secret_key' => 'dummy-secret']);
    expect($turnstile->verify(str_repeat('x', 2049)))->toBeFalse();
    Http::fake(fn () => throw new ConnectionException);
    expect($turnstile->verify('token'))->toBeFalse();
});

test('Turnstile validation rule accepts verified tokens and rejects malformed or failed values', function (): void {
    config(['services.turnstile.secret_key' => 'dummy-secret']);
    Http::fake(['challenges.cloudflare.com/*' => Http::sequence()->push(['success' => true])->push(['success' => false])]);
    $rules = ['token' => [new TurnstileToken]];
    expect(Validator::make(['token' => 'pass'], $rules)->passes())->toBeTrue()
        ->and(Validator::make(['token' => 'fail'], $rules)->passes())->toBeFalse()
        ->and(Validator::make(['token' => ['invalid']], $rules)->passes())->toBeFalse();
});
