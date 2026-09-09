<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\Identity\Http\Controllers\Users\SettingsController;
use Modules\Identity\Http\Middleware\ConfirmEmailChange;

Route::prefix('settings')->group(function (): void {
    Route::patch('profile', [SettingsController::class, 'profile'])->middleware(ConfirmEmailChange::class)->name('settings.profile');
    Route::middleware(['verified', 'password.confirm'])->group(function (): void {
        Route::put('password', [SettingsController::class, 'password'])->name('settings.password');
        Route::delete('account', [SettingsController::class, 'destroy'])->name('settings.destroy');
    });
});
