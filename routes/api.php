<?php

use Illuminate\Support\Facades\Route;

// API khusus user yang sudah terautentikasi
Route::middleware('auth:sanctum')->group(function () {});
