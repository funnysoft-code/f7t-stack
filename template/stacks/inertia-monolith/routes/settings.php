<?php

declare(strict_types=1);

use App\Http\Controllers\Users\AccountSettingsController;
use App\Http\Middleware\ConfirmSensitiveAccountOperation;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'throttle:web', ConfirmSensitiveAccountOperation::class])->group(function (): void {
    Route::patch('/settings/profile', [AccountSettingsController::class, 'update'])->name('settings.profile.update');
    Route::put('/settings/password', [AccountSettingsController::class, 'password'])->middleware('verified')->name('settings.password.update');
    Route::delete('/settings/account', [AccountSettingsController::class, 'destroy'])->name('settings.account.destroy');
});
