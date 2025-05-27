<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TypingResultController;
use App\Http\Controllers\LeaderboardController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/leaderboard', [LeaderboardController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::middleware('auth:sanctum')->post('/save-result', [TypingResultController::class, 'store']);
    Route::get('/results', [TypingResultController::class, 'index']);
    Route::middleware('auth:sanctum')->get('/results', [TypingResultController::class, 'index']);
    Route::middleware('auth:sanctum')->get('/text/adaptive', [TypingResultController::class, 'getAdaptiveText']);
    Route::middleware('auth:sanctum')->get('/user/common-errors', [TypingResultController::class, 'getCommonErrors']);
    Route::middleware('auth:sanctum')->get('/frequent-errors', [TypingResultController::class, 'frequentErrors']);

Route::middleware('auth:sanctum')->get('/user/stats', [TypingResultController::class, 'stats']);


});

Route::get('/text', [TypingResultController::class, 'getText']);
