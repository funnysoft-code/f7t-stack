<?php

declare(strict_types=1);

namespace Modules\Identity\Support;

use Dedoc\Scramble\Contracts\OperationTransformer;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Reference;
use Dedoc\Scramble\Support\Generator\RequestBodyObject;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Types\ArrayType;
use Dedoc\Scramble\Support\Generator\Types\BooleanType;
use Dedoc\Scramble\Support\Generator\Types\ObjectType;
use Dedoc\Scramble\Support\Generator\Types\StringType;
use Dedoc\Scramble\Support\Generator\Types\Type;
use Dedoc\Scramble\Support\RouteInfo;

/** Contracts for vendor response bindings that route inference cannot resolve. */
final readonly class AccountOperationTransformer implements OperationTransformer
{
    public function handle(Operation $operation, RouteInfo $routeInfo): void
    {
        $name = $routeInfo->route->getName();
        $resetEmail = new StringType()->format('email');
        $resetEmail->setMax(255);
        $body = match ($name) {
            'register.store' => $this->object(['name' => new StringType, 'email' => new StringType()->format('email'), 'password' => new StringType, 'password_confirmation' => new StringType]),
            'password.email' => $this->object(['email' => $resetEmail]),
            'login.store' => $this->object(['email' => new StringType()->format('email'), 'password' => new StringType, 'remember' => new BooleanType]),
            'password.confirm.store' => $this->object(['password' => new StringType]),
            'two-factor.confirm' => $this->object(['code' => new StringType]),
            default => null,
        };
        if ($body !== null) {
            if (in_array($name, ['register.store', 'password.email'], true)) {
                $body->addProperty('turnstile_token', new StringType()->setDescription('Required when Turnstile is enabled. Single-use token from the public form widget.'));
            }
            if ($name === 'login.store') {
                $body->setRequired(['email', 'password']);
            }
            $schema = Schema::fromType($body);
            assert($schema instanceof Schema);
            $requestBody = new RequestBodyObject;
            $requestBody->required();
            $requestBody->setContent('application/json', $schema);
            $operation->addRequestBodyObject($requestBody);
        }
        $success = match ($name) {
            'login.store' => $this->object(['two_factor' => new BooleanType]),
            'password.confirmation' => $this->object(['confirmed' => new BooleanType]),
            'password.update' => $this->object(['message' => new StringType]),
            'passkey.login', 'passkey.confirm' => $this->object(['redirect' => new StringType]),
            'passkey.destroy' => $this->object(['status' => new StringType()->enum(['passkey-deleted'])]),
            'two-factor.qr-code' => $this->object(['svg' => new StringType, 'url' => new StringType]),
            'two-factor.secret-key' => $this->object(['secretKey' => new StringType]),
            'two-factor.recovery-codes' => $this->strings(),
            'two-factor.enable', 'two-factor.disable', 'two-factor.confirm', 'two-factor.regenerate-recovery-codes',
            'password.confirm.store', 'register.store', 'verification.send' => new StringType()->enum(['']),
            default => null,
        };
        $status = match ($name) {
            'logout', 'two-factor.login.store' => 204,
            'password.confirm.store', 'register.store' => 201,
            'verification.send' => 202,
            default => 200,
        };
        if ($success !== null || $status === 204) {
            $operation->responses = array_values(array_filter($operation->responses ?? [], static fn (Response|Reference $response): bool => ! $response instanceof Response || (int) $response->code >= 400));
            $operation->addResponse($this->response($status, $success));
            if ($name === 'verification.send') {
                $operation->addResponse(new Response(204));
            }
        }

        $middleware = $routeInfo->route->gatherMiddleware();
        $errors = [429 => 'Too many requests'];
        if (in_array('auth:web', $middleware, true) || $name === 'two-factor.login.store') {
            $errors[401] = 'Unauthenticated';
        }
        if (in_array('verified', $middleware, true) || $routeInfo->route->uri() === 'api/auth/settings/profile') {
            $errors[403] = 'Email verification required or operation denied';
        }
        if (in_array('password.confirm', $middleware, true) || $routeInfo->route->uri() === 'api/auth/settings/profile') {
            $errors[423] = 'Recent password or passkey confirmation required';
        }
        if (! in_array($operation->method, ['get', 'head', 'options'], true)) {
            $errors[419] = 'CSRF token mismatch';
            $fields = new ObjectType;
            $fields->additionalProperties($this->strings());
            $validation = $this->object(['message' => new StringType, 'errors' => $fields]);
            $operation->addResponse($this->response(422, $validation));
        }
        foreach ($errors as $code => $description) {
            $response = $this->response($code, $this->object(['message' => new StringType]));
            $response->description($description);
            $operation->addResponse($response);
        }
    }

    private function strings(): ArrayType
    {
        $type = new ArrayType;
        $type->setItems(new StringType);

        return $type;
    }

    /** @param array<string, Type> $properties */
    private function object(array $properties): ObjectType
    {
        $type = new ObjectType;
        foreach ($properties as $name => $property) {
            $type->addProperty($name, $property);
        }
        $type->setRequired(array_keys($properties));

        return $type;
    }

    private function response(int $status, ?Type $type): Response
    {
        $response = new Response($status);
        if ($type !== null) {
            $schema = Schema::fromType($type);
            assert($schema instanceof Schema);
            $response->setContent('application/json', $schema);
        }

        return $response;
    }
}
