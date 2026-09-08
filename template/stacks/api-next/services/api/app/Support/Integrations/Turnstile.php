<?php

declare(strict_types=1);

namespace App\Support\Integrations;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use LogicException;

final class Turnstile
{
    public static function assertProductionCredentials(string $siteKey, string $secretKey): void
    {
        foreach ([$siteKey, $secretKey] as $key) {
            if (trim($key) === '' || preg_match('/\A[123]x0{10,}/', $key)) {
                throw new LogicException('Production requires real Turnstile site and secret keys.');
            }
        }
    }

    public function verify(string $token): bool
    {
        $secret = config('services.turnstile.secret_key', '');
        if (! is_string($secret) || $token === '' || strlen($token) > 2048 || $secret === '') {
            return false;
        }
        try {
            $response = Http::asForm()->timeout(10)->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $secret,
                'response' => $token,
            ]);

            return $response->successful() && $response->json('success') === true;
        } catch (ConnectionException) {
            return false;
        }
    }
}
