<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\ConfirmedTwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\RecoveryCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController;
use Laravel\Passkeys\Http\Controllers\PasskeyConfirmationController;
use Laravel\Passkeys\Http\Controllers\PasskeyLoginController;
use Laravel\Passkeys\Http\Controllers\PasskeyRegistrationController;
use Modules\Identity\Http\Controllers\Users\PasskeyController;
use Modules\Identity\Http\Middleware\PasskeyCeremony;

Route::get('user/passkeys', PasskeyController::class)->middleware(['auth:web', 'verified'])->name('passkey.index');

Route::post('two-factor-challenge', [TwoFactorAuthenticatedSessionController::class, 'store'])->middleware(['guest:web', 'throttle:two-factor'])->block()->name('two-factor.login.store');
Route::middleware(['guest:web', 'throttle:passkeys'])->group(function (): void {
    Route::get('passkeys/login/options', [PasskeyLoginController::class, 'index'])->name('passkey.login-options');
    Route::post('passkeys/login', [PasskeyLoginController::class, 'store'])->name('passkey.login');
});
Route::middleware(['auth:web', 'throttle:passkeys'])->group(function (): void {
    Route::get('passkeys/confirm/options', [PasskeyConfirmationController::class, 'index'])->name('passkey.confirm-options');
    Route::post('passkeys/confirm', [PasskeyConfirmationController::class, 'store'])->name('passkey.confirm');
});
Route::middleware(['auth:web', 'verified', 'password.confirm'])->group(function (): void {
    Route::post('user/two-factor-authentication', [TwoFactorAuthenticationController::class, 'store'])->name('two-factor.enable');
    Route::post('user/confirmed-two-factor-authentication', [ConfirmedTwoFactorAuthenticationController::class, 'store'])->name('two-factor.confirm');
    Route::delete('user/two-factor-authentication', [TwoFactorAuthenticationController::class, 'destroy'])->name('two-factor.disable');
    Route::get('user/two-factor-qr-code', [TwoFactorQrCodeController::class, 'show'])->name('two-factor.qr-code');
    Route::get('user/two-factor-secret-key', [TwoFactorSecretKeyController::class, 'show'])->name('two-factor.secret-key');
    Route::get('user/two-factor-recovery-codes', [RecoveryCodeController::class, 'index'])->name('two-factor.recovery-codes');
    Route::post('user/two-factor-recovery-codes', [RecoveryCodeController::class, 'store'])->name('two-factor.regenerate-recovery-codes');
    Route::get('user/passkeys/options', [PasskeyRegistrationController::class, 'index'])->name('passkey.registration-options');
    Route::post('user/passkeys', [PasskeyRegistrationController::class, 'store'])->name('passkey.store');
    Route::delete('user/passkeys/{passkey}', [PasskeyRegistrationController::class, 'destroy'])->whereUuid('passkey')->name('passkey.destroy');
});

Route::getRoutes()->refreshNameLookups();
foreach (['registration' => ['passkey.registration-options', 'passkey.store'], 'login' => ['passkey.login-options', 'passkey.login'], 'confirm' => ['passkey.confirm-options', 'passkey.confirm']] as $purpose => $names) {
    foreach ($names as $name) {
        Route::getRoutes()->getByName($name)?->middleware(PasskeyCeremony::class.':'.$purpose)->block();
    }
}
