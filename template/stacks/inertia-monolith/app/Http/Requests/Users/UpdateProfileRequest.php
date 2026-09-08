<?php

declare(strict_types=1);

namespace App\Http\Requests\Users;

use App\Data\Users\UpdateProfileData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateProfileRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->user())],
        ];
    }

    public function toData(): UpdateProfileData
    {
        /** @var array{name: string, email: string} $validated */
        $validated = $this->validated();

        return new UpdateProfileData($validated['name'], $validated['email']);
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower($this->string('email')->toString())]);
    }
}
