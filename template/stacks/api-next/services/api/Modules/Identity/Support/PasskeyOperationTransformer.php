<?php

declare(strict_types=1);

namespace Modules\Identity\Support;

use Dedoc\Scramble\Contracts\OperationTransformer;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Parameter;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Types\ObjectType;
use Dedoc\Scramble\Support\Generator\Types\StringType;
use Dedoc\Scramble\Support\RouteInfo;

final readonly class PasskeyOperationTransformer implements OperationTransformer
{
    public function handle(Operation $operation, RouteInfo $routeInfo): void
    {
        if ($routeInfo->route->getName() === 'passkey.store') {
            $metadata = new ObjectType;
            $metadata->addProperty('uuid', new StringType()->format('uuid'));
            $metadata->addProperty('name', new StringType);
            $metadata->addProperty('created_at', new StringType()->format('date-time')->nullable(true));
            $metadata->addProperty('last_used_at', new StringType()->format('date-time')->nullable(true));
            $metadata->setRequired(['uuid', 'name', 'created_at', 'last_used_at']);
            $body = new ObjectType;
            $body->addProperty('data', $metadata);
            $body->addProperty('status', new StringType()->enum(['passkey-registered']));
            $body->setRequired(['data', 'status']);
            $schema = Schema::fromType($body);
            assert($schema instanceof Schema);
            $operation->addResponse(new Response(200)->setContent('application/json', $schema));
        }

        if ($routeInfo->route->getName() === 'passkey.destroy') {
            foreach ($operation->parameters as $parameter) {
                if ($parameter instanceof Parameter && $parameter->name === 'passkey') {
                    $schema = Schema::fromType(new StringType()->format('uuid'));
                    assert($schema instanceof Schema);
                    $parameter->setSchema($schema);
                    $parameter->description = 'The public passkey UUIDv7.';
                }
            }
        }
    }
}
