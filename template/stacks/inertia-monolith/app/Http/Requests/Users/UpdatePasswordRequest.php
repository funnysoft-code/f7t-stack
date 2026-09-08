<?php

declare(strict_types=1);

namespace App\Http\Requests\Users;

use App\Data\Users\UpdatePasswordData;
use Illuminate\Foundation\Http\FormRequest;

final class UpdatePasswordRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return UpdatePasswordData::rules();
    }

    public function toData(): UpdatePasswordData
    {
        /** @var array{password: string} $validated */
        $validated = $this->validated();

        return new UpdatePasswordData($validated['password']);
    }
}
