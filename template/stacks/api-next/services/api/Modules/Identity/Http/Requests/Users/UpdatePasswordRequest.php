<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class UpdatePasswordRequest extends FormRequest
{
    /** @return array<string, list<string|Password>> */
    public function rules(): array
    {
        return ['password' => ['required', 'string', Password::min(12), 'confirmed']];
    }
}
