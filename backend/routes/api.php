<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CarreraController;
use App\Http\Controllers\DocenteController;
use App\Http\Controllers\GrupoCupController;
use App\Http\Controllers\ImportacionPostulantesController;
use App\Http\Controllers\ImportacionUsuariosController;
use App\Http\Controllers\MateriaController;
use App\Http\Controllers\PreinscripcionController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/preinscripcion', [PreinscripcionController::class, 'store']);
Route::post('/preinscripcion/consultar', [PreinscripcionController::class, 'consultar']);
Route::post('/preinscripcion/pago', [PreinscripcionController::class, 'pago']);
Route::get('/preinscripcion/carreras-activas', [PreinscripcionController::class, 'carrerasActivas']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/cambiar-password', [AuthController::class, 'cambiarPassword']);
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
    Route::post('/admin/users/importar', [ImportacionUsuariosController::class, 'importar']);

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

    Route::get('/admin/preinscripciones', [PreinscripcionController::class, 'adminIndex']);
    Route::post('/admin/preinscripciones/importar', [ImportacionPostulantesController::class, 'importar']);
    Route::get('/admin/preinscripciones/{postulante}', [PreinscripcionController::class, 'show']);
    Route::post('/admin/preinscripciones/{postulante}/aprobar-requisitos', [PreinscripcionController::class, 'aprobarRequisitos']);
    Route::post('/admin/preinscripciones/{postulante}/observar-requisitos', [PreinscripcionController::class, 'observarRequisitos']);
    Route::post('/admin/preinscripciones/{postulante}/aprobar-pago', [PreinscripcionController::class, 'aprobarPago']);
    Route::post('/admin/preinscripciones/{postulante}/observar-pago', [PreinscripcionController::class, 'observarPago']);
    Route::post('/admin/preinscripciones/{postulante}/aprobar', [PreinscripcionController::class, 'aprobar']);
    Route::post('/admin/preinscripciones/{postulante}/observar', [PreinscripcionController::class, 'observar']);
    Route::post('/admin/preinscripciones/{postulante}/rechazar', [PreinscripcionController::class, 'rechazar']);
});

Route::middleware(['auth:sanctum', 'role:admin,administrador,coordinador,autoridad'])->group(function () {
    Route::get('/admin/grupos-cup/resumen', [GrupoCupController::class, 'resumen']);
    Route::get('/admin/grupos-cup', [GrupoCupController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'role:admin,administrador,coordinador'])->group(function () {
    Route::post('/admin/grupos-cup/generar', [GrupoCupController::class, 'generar']);
});

Route::middleware(['auth:sanctum', 'role:admin,administrador,coordinador,autoridad'])->group(function () {
    Route::get('/admin/grupos-cup/{grupo}', [GrupoCupController::class, 'show']);

    Route::get('/admin/docentes', [DocenteController::class, 'index']);
    Route::get('/admin/docentes/habilitados', [DocenteController::class, 'habilitados']);
    Route::get('/admin/docentes/usuarios-disponibles', [DocenteController::class, 'usuariosDisponibles']);
    Route::get('/admin/docentes/{docente}', [DocenteController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'role:admin,administrador,coordinador'])->group(function () {
    Route::post('/admin/grupos-cup/{grupo}/inactivar', [GrupoCupController::class, 'inactivar']);

    Route::post('/admin/docentes', [DocenteController::class, 'store']);
    Route::post('/admin/docentes/{docente}/actualizar', [DocenteController::class, 'update']);
    Route::post('/admin/docentes/{docente}/enviar-revision', [DocenteController::class, 'enviarRevision']);
    Route::post('/admin/docentes/{docente}/aprobar', [DocenteController::class, 'aprobar']);
    Route::post('/admin/docentes/{docente}/observar', [DocenteController::class, 'observar']);
    Route::post('/admin/docentes/{docente}/rechazar', [DocenteController::class, 'rechazar']);
    Route::post('/admin/docentes/{docente}/inactivar', [DocenteController::class, 'inactivar']);
});

Route::middleware(['auth:sanctum', 'role:docente'])->group(function () {
    Route::get('/docente/mi-perfil', [DocenteController::class, 'miPerfil']);
    Route::post('/docente/mi-perfil', [DocenteController::class, 'guardarMiPerfil']);
    Route::post('/docente/mi-perfil/enviar-revision', [DocenteController::class, 'enviarMiPerfilRevision']);
});

Route::get('/ping', function () {
    return response()->json([
        'message' => 'Backend Laravel funcionando correctamente',
        'status' => 'ok',
    ]);
});
