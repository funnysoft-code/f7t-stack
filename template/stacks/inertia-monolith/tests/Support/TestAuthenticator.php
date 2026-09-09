<?php

declare(strict_types=1);

namespace Tests\Support;

use CBOR\ByteStringObject as Bytes;
use CBOR\MapObject;
use CBOR\NegativeIntegerObject as Negative;
use CBOR\TextStringObject as Text;
use CBOR\UnsignedIntegerObject as Unsigned;
use OpenSSLAsymmetricKey;
use ParagonIE\ConstantTime\Base64UrlSafe as Base64;

/** Ephemeral test authenticator. All server verification runs through the unmodified package. */
final class TestAuthenticator
{
    private readonly OpenSSLAsymmetricKey $key;

    private readonly string $id;

    private int $counter = 0;

    private string $handle = '';

    public function __construct()
    {
        $key = openssl_pkey_new(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);
        assert($key instanceof OpenSSLAsymmetricKey);
        $this->key = $key;
        $this->id = random_bytes(32);
    }

    /** @return array<string, mixed> */
    public function register(mixed $options, string $origin = 'https://account.test', string $rp = 'account.test'): array
    {
        assert(is_array($options) && is_array($options['user']) && is_string($options['user']['id']) && is_string($options['challenge']));
        $this->handle = $options['user']['id'];
        $details = openssl_pkey_get_details($this->key);
        assert(is_array($details) && is_array($details['ec']) && is_string($details['ec']['x']) && is_string($details['ec']['y']));
        $cose = MapObject::create()
            ->add(Unsigned::create(1), Unsigned::create(2))
            ->add(Unsigned::create(3), Negative::create(-7))
            ->add(Negative::create(-1), Unsigned::create(1))
            ->add(Negative::create(-2), Bytes::create($details['ec']['x']))
            ->add(Negative::create(-3), Bytes::create($details['ec']['y']));
        $data = hash('sha256', $rp, true).chr(0x45).pack('N', 0).str_repeat("\0", 16).pack('n', strlen($this->id)).$this->id.(string) $cose;
        $attestation = MapObject::create()->add(Text::create('fmt'), Text::create('none'))->add(Text::create('attStmt'), MapObject::create())->add(Text::create('authData'), Bytes::create($data));

        return $this->credential(['clientDataJSON' => $this->clientData('webauthn.create', $options['challenge'], $origin), 'attestationObject' => Base64::encodeUnpadded((string) $attestation), 'transports' => ['internal']]);
    }

    /** @return array<string, mixed> */
    public function assert(mixed $options, string $origin = 'https://account.test', string $rp = 'account.test', bool $verified = true): array
    {
        assert(is_array($options) && is_string($options['challenge']));
        $client = $this->clientData('webauthn.get', $options['challenge'], $origin);
        $data = hash('sha256', $rp, true).chr($verified ? 0x05 : 0x01).pack('N', ++$this->counter);
        openssl_sign($data.hash('sha256', Base64::decodeNoPadding($client), true), $signature, $this->key, OPENSSL_ALGO_SHA256);
        assert(is_string($signature));

        return $this->credential(['clientDataJSON' => $client, 'authenticatorData' => Base64::encodeUnpadded($data), 'signature' => Base64::encodeUnpadded($signature), 'userHandle' => $this->handle]);
    }

    /** @param array<string, mixed> $response
     * @return array<string, mixed>
     */
    private function credential(array $response): array
    {
        return ['id' => Base64::encodeUnpadded($this->id), 'rawId' => Base64::encodeUnpadded($this->id), 'type' => 'public-key', 'response' => $response];
    }

    private function clientData(string $type, string $challenge, string $origin): string
    {
        return Base64::encodeUnpadded(json_encode(['type' => $type, 'challenge' => $challenge, 'origin' => $origin, 'crossOrigin' => false], JSON_THROW_ON_ERROR));
    }
}
