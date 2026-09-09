<?php

declare(strict_types=1);

namespace Tests\Support;

use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

final class AccountBrowser
{
    /** @var array<string, string> */
    private array $cookies = [];

    public function __construct(private readonly TestCase $test) {}

    /**
     * @param  array<string, mixed>  $data
     * @return TestResponse<Response>
     */
    public function request(string $method, string $uri, array $data = []): TestResponse
    {
        Auth::forgetGuards();
        app()->forgetInstance(StatefulGuard::class);
        session()->flush();
        foreach (Cookie::getQueuedCookies() as $cookie) {
            Cookie::unqueue($cookie->getName());
        }
        $guard = Auth::guard('web');
        $this->test->withCookies([
            config()->string('session.cookie') => '',
            $guard->getRecallerName() => '',
            ...$this->cookies,
        ])->withCredentials();
        $response = $this->test->json($method, $uri, $data);
        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === 'XSRF-TOKEN') {
                continue;
            }
            $value = $response->getCookie($cookie->getName())?->getValue();
            if (is_string($value)) {
                $this->cookies[$cookie->getName()] = $value;
            }
        }

        return $response;
    }

    public function forgetSession(): void
    {
        unset($this->cookies[config()->string('session.cookie')]);
    }
}
