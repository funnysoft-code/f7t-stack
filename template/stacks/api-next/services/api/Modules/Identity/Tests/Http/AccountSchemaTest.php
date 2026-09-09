<?php

declare(strict_types=1);

use Dedoc\Scramble\Generator;
use Dedoc\Scramble\Scramble;

it('describes native account statuses and security failures in the fresh schema', function (): void {
    config(['funnysoft.registration_enabled' => true]);
    require base_path('Modules/Identity/Routes/auth.php');
    $schema = app(Generator::class)->generate(Scramble::configure())->spec();
    foreach ([
        '/auth/logout' => ['post', 204],
        '/auth/confirm-password' => ['post', 201],
        '/auth/two-factor-challenge' => ['post', 204],
        '/auth/email/verification-notification' => ['post', 202],
        '/auth/user/passkeys/options' => ['get', 423],
        '/app' => ['get', 403],
        '/auth/login' => ['post', 429],
        '/auth/register' => ['post', 201],
    ] as $path => [$method, $status]) {
        expect(data_get($schema, "paths.$path.$method.responses"))->toHaveKey($status);
    }
    expect(data_get($schema, 'paths./auth/login.post.responses.200.content.application/json.schema.properties.two_factor.type'))->toBe('boolean')
        ->and(data_get($schema, 'paths./auth/user/two-factor-secret-key.get.responses.200.content.application/json.schema.properties.secretKey.type'))->toBe('string')
        ->and(data_get($schema, 'paths./auth/user/two-factor-recovery-codes.get.responses.200.content.application/json.schema.items.type'))->toBe('string')
        ->and(data_get($schema, 'paths./auth/register.post.requestBody.content.application/json.schema.required'))->toBe(['name', 'email', 'password', 'password_confirmation']);
});

it('requires every reset credential in the fresh schema', function (): void {
    $schema = app(Generator::class)->generate(Scramble::configure())->spec();
    $body = data_get($schema, 'paths./auth/reset-password.post.requestBody.content.application/json.schema');
    expect(data_get($body, 'required'))->toBe(['token', 'email', 'password', 'password_confirmation']);
    foreach (['token', 'email', 'password', 'password_confirmation'] as $field) {
        expect(data_get($body, "properties.$field.type"))->toBe('string');
    }
    expect(data_get($body, 'properties.email.format'))->toBe('email');
});
