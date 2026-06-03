<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarreraController;
use App\Http\Controllers\MateriaController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/carreras-activas', [CarreraController::class, 'activas']);
    Route::get('/materias-activas', [MateriaController::class, 'activas']);
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::patch('/users/{user}/estado', [UserController::class, 'updateEstado']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::get('/roles', [UserController::class, 'roles']);

    // Rutas de Carreras
    Route::get('/carreras', [CarreraController::class, 'index']);
    Route::post('/carreras', [CarreraController::class, 'store']);
    Route::get('/carreras/resumen', [CarreraController::class, 'resumen']);
    Route::get('/carreras/{carrera}', [CarreraController::class, 'show']);
    Route::put('/carreras/{carrera}', [CarreraController::class, 'update']);
    Route::patch('/carreras/{carrera}/estado', [CarreraController::class, 'updateEstado']);
    Route::delete('/carreras/{carrera}', [CarreraController::class, 'destroy']);

    // Rutas de Materias
    Route::get('/materias', [MateriaController::class, 'index']);
    Route::post('/materias', [MateriaController::class, 'store']);
    Route::get('/materias/resumen', [MateriaController::class, 'resumen']);
    Route::get('/materias/{materia}', [MateriaController::class, 'show']);
    Route::put('/materias/{materia}', [MateriaController::class, 'update']);
    Route::patch('/materias/{materia}/estado', [MateriaController::class, 'updateEstado']);
    Route::delete('/materias/{materia}', [MateriaController::class, 'destroy']);
});

Route::get('/ping', function () {
    return response()->json([
        'message' => 'Backend Laravel funcionando correctamente',
        'status' => 'ok',
    ]);
});
