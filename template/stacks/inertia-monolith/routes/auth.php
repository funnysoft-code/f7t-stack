<?php

declare(strict_types=1);
use App\Http\Controllers\Users\PasskeyController;
use App\Http\Middleware\PasskeyCeremony;
use Illuminate\Support\Facades\Route;

// Loading the vendor definitions here keeps route caching and named contracts native.
require base_path('vendor/laravel/fortify/routes/routes.php');

Route::get('/user/passkeys', PasskeyController::class)->middleware(['web', 'auth:web', 'verified', 'throttle:web'])->name('passkey.index');

// Keep vendor factor mutations and secret reads inside the same account boundary.
Route::getRoutes()->refreshNameLookups();
foreach ([
    'two-factor.enable', 'two-factor.confirm', 'two-factor.disable',
    'two-factor.qr-code', 'two-factor.secret-key', 'two-factor.recovery-codes',
    'two-factor.regenerate-recovery-codes', 'passkey.registration-options',
    'passkey.store', 'passkey.destroy',
] as $name) {
    Route::getRoutes()->getByName($name)?->middleware(['verified', 'password.confirm']);
}

foreach (['registration' => ['passkey.registration-options', 'passkey.store'], 'login' => ['passkey.login-options', 'passkey.login'], 'confirm' => ['passkey.confirm-options', 'passkey.confirm']] as $purpose => $names) {
    foreach ($names as $name) {
        Route::getRoutes()->getByName($name)?->middleware(PasskeyCeremony::class.':'.$purpose)->block();
    }
}
Route::getRoutes()->getByName('two-factor.login.store')?->block();
