<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\ConfirmablePasswordController;
use Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController;
use Laravel\Fortify\Http\Controllers\EmailVerificationNotificationController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;
use Modules\Identity\Http\Controllers\AccountController;
use Modules\Identity\Http\Controllers\PasswordResetLinkController;
use Modules\Identity\Http\Controllers\RegisterController;
use Modules\Identity\Http\Controllers\VerifyEmailController;
use Modules\Identity\Http\Middleware\JsonAccountResponse;

Route::middleware([JsonAccountResponse::class, 'web', 'throttle:auth'])->prefix('api')->group(function (): void {
    Route::get('app', [AccountController::class, 'me'])->middleware(['auth:web', 'verified']);
    Route::prefix('auth')->group(function (): void {
        Route::get('capabilities', [AccountController::class, 'capabilities']);
        Route::get('csrf-cookie', [AccountController::class, 'csrf']);
        Route::post('login', [AuthenticatedSessionController::class, 'store'])->middleware(['guest:web', 'throttle:login'])->name('login.store');
        Route::post('forgot-password', [PasswordResetLinkController::class, '__invoke'])->middleware(['guest:web', 'throttle:password-reset'])->name('password.email');
        Route::post('reset-password', [NewPasswordController::class, 'store'])->middleware(['guest:web', 'throttle:password-reset'])->name('password.update');
        if (config()->boolean('funnysoft.registration_enabled')) {
            Route::post('register', RegisterController::class)->middleware('guest:web')->name('register.store');
        }
        Route::middleware('auth:web')->group(function (): void {
            require __DIR__.'/settings.php';
            Route::get('me', [AccountController::class, 'me']);
            Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
            Route::get('email/verify', [AccountController::class, 'me'])->name('verification.notice');
            Route::get('email/verify/{id}/{hash}', VerifyEmailController::class)->middleware(['signed:relative', 'throttle:verification'])->name('verification.verify');
            Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])->middleware('throttle:verification')->name('verification.send');
            Route::post('confirm-password', [ConfirmablePasswordController::class, 'store'])->middleware('throttle:login')->name('password.confirm.store');
            Route::get('confirmed-password-status', [ConfirmedPasswordStatusController::class, 'show'])->name('password.confirmation');
        });
    });
});
