<?php

declare(strict_types=1);

namespace Modules\Identity\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;
use Modules\Identity\Models\Users\User;

final class UpdateProfileRequest extends FormRequest
{
    /** @return array<string, list<string|Unique>> */
    public function rules(): array
    {
        $user = $this->user();

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'lowercase', 'max:255', Rule::unique(User::class)->ignore($user)],
        ];
    }
}
