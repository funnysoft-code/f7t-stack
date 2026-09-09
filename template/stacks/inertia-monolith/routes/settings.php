<?php

declare(strict_types=1);

use App\Http\Controllers\Users\AccountSettingsController;
use App\Http\Middleware\ConfirmSensitiveAccountOperation;
use App\Http\Responses\AccountPageResponse;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'throttle:web'])->group(function (): void {
    Route::get('/settings/profile', fn (): AccountPageResponse => new AccountPageResponse('settings/profile'))->name('settings.profile.edit');
    Route::get('/settings/security', fn (): AccountPageResponse => new AccountPageResponse('settings/security'))->name('settings.security');
    Route::get('/settings/passkeys', fn (): AccountPageResponse => new AccountPageResponse('settings/passkeys'))->name('settings.passkeys');
    Route::get('/settings/authenticator', fn (): AccountPageResponse => new AccountPageResponse('settings/authenticator'))->name('settings.authenticator');
    Route::get('/settings/recovery', fn (): AccountPageResponse => new AccountPageResponse('settings/recovery'))->name('settings.recovery');
    Route::get('/settings/delete', fn (): AccountPageResponse => new AccountPageResponse('settings/delete-account'))->name('settings.delete');
});

Route::middleware(['auth', 'throttle:web', ConfirmSensitiveAccountOperation::class])->group(function (): void {
    Route::patch('/settings/profile', [AccountSettingsController::class, 'update'])->name('settings.profile.update');
    Route::put('/settings/password', [AccountSettingsController::class, 'password'])->middleware('verified')->name('settings.password.update');
    Route::delete('/settings/account', [AccountSettingsController::class, 'destroy'])->name('settings.account.destroy');
});
