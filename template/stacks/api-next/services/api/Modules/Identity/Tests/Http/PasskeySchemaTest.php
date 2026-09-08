<?php

declare(strict_types=1);

use Dedoc\Scramble\Generator;
use Dedoc\Scramble\Scramble;

it('generates public UUID enrollment and removal contracts from current backend routes', function (): void {
    $schema = app(Generator::class)->generate(Scramble::configure())->spec();
    expect(data_get($schema, 'paths./auth/user/passkeys/{passkey}.delete.parameters.0.schema.type'))->toBe('string')
        ->and(data_get($schema, 'paths./auth/user/passkeys/{passkey}.delete.parameters.0.schema.format'))->toBe('uuid')
        ->and(data_get($schema, 'paths./auth/user/passkeys.post.responses.200.content.application/json.schema.properties.data.properties.uuid.type'))->toBe('string')
        ->and(data_get($schema, 'paths./auth/user/passkeys.post.responses.200.content.application/json.schema.properties.data.required'))->toBe(['uuid', 'name', 'created_at', 'last_used_at'])
        ->and(data_get($schema, 'paths./auth/user/passkeys.post.responses.200.content.application/json.schema.properties.data.properties.id'))->toBeNull();
});
