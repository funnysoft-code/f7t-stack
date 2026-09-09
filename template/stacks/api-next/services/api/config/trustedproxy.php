<?php

declare(strict_types=1);

$proxies = array_values(array_filter(array_map(trim(...), explode(',', (string) env('TRUSTED_PROXIES', '')))));

foreach ($proxies as $proxy) {
    if (filter_var($proxy, FILTER_VALIDATE_IP) === false) {
        throw new InvalidArgumentException('TRUSTED_PROXIES must contain only explicit IPv4 or IPv6 addresses.');
    }
}

return ['proxies' => $proxies];
