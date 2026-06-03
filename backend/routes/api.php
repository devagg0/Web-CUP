<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::patch('/users/{user}/estado', [UserController::class, 'updateEstado']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::get('/roles', [UserController::class, 'roles']);
});

Route::get('/ping', function () {
    return response()->json([
        'message' => 'Backend Laravel funcionando correctamente',
        'status' => 'ok',
    ]);
});
