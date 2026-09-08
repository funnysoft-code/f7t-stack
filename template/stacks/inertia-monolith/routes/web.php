<?php

declare(strict_types=1);

use App\Http\Controllers\Users\HomeController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';
require __DIR__.'/settings.php';

Route::get('/', HomeController::class)->middleware(['auth', 'verified', 'throttle:web'])->name('home');
