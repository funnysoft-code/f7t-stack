<?php

declare(strict_types=1);

namespace App\Http\Controllers\Users;

use App\Http\Responses\AccountPageResponse;

final class HomeController
{
    public function __invoke(): AccountPageResponse
    {
        return new AccountPageResponse('home');
    }
}
