<?php

declare(strict_types=1);

use App\Http\Controllers\Users\HomeController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';

Route::get('/', HomeController::class)->middleware(['auth', 'verified', 'throttle:web'])->name('home');
