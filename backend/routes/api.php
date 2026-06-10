<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AsignacionDocenteGrupoController;
use App\Http\Controllers\AsistenciaDocenteController;
use App\Http\Controllers\AulaController;
use App\Http\Controllers\CarreraController;
use App\Http\Controllers\CargaHorariaController;
use App\Http\Controllers\DocenteController;
use App\Http\Controllers\ExamenCUPController;
use App\Http\Controllers\GrupoHorarioController;
use App\Http\Controllers\GrupoCupController;
use App\Http\Controllers\ImportacionPostulantesController;
use App\Http\Controllers\ImportacionUsuariosController;
use App\Http\Controllers\MateriaController;
use App\Http\Controllers\PreinscripcionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdmisionCUPController;
use App\Http\Controllers\ResultadoAdmisionController;
use App\Http\Controllers\ReporteAcademicoController;
use App\Http\Controllers\DashboardCupController;
use App\Http\Controllers\StripePaymentController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/preinscripcion', [PreinscripcionController::class, 'store']);
Route::post('/preinscripcion/consultar', [PreinscripcionController::class, 'consultar']);
Route::post('/preinscripcion/pago', [PreinscripcionController::class, 'pago']);
Route::post('/preinscripcion/stripe/checkout', [StripePaymentController::class, 'checkout']);
Route::post('/preinscripcion/stripe/confirmar', [StripePaymentController::class, 'confirmar']);
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
    Route::get('/admin/grupos-cup/{grupo}/horario', [GrupoHorarioController::class, 'horarioGrupo']);

    Route::get('/admin/aulas', [AulaController::class, 'index']);
    Route::get('/admin/aulas/{aula}', [AulaController::class, 'show']);

    Route::get('/admin/cargas-horarias/resumen', [CargaHorariaController::class, 'resumen']);
    Route::get('/admin/cargas-horarias/asignaciones-disponibles', [CargaHorariaController::class, 'asignacionesDisponibles']);
    Route::get('/admin/cargas-horarias/aulas-disponibles', [CargaHorariaController::class, 'aulasDisponibles']);
    Route::get('/admin/cargas-horarias', [CargaHorariaController::class, 'index']);
    Route::get('/admin/cargas-horarias/{carga}', [CargaHorariaController::class, 'show']);

    Route::get('/admin/asistencias-docente', [AsistenciaDocenteController::class, 'adminIndex']);
    Route::get('/admin/asistencias-docente/{asistencia}', [AsistenciaDocenteController::class, 'show']);

    // Rutas de Reportes Académicos
    Route::get('/admin/reportes-academicos/resumen', [ReporteAcademicoController::class, 'resumen']);
    Route::get('/admin/reportes-academicos/lista-general-postulantes', [ReporteAcademicoController::class, 'listaGeneralPostulantes']);
    Route::get('/admin/reportes-academicos/postulantes-aprobados', [ReporteAcademicoController::class, 'postulantesAprobados']);
    Route::get('/admin/reportes-academicos/postulantes-reprobados', [ReporteAcademicoController::class, 'postulantesReprobados']);
    Route::get('/admin/reportes-academicos/promedios-generales', [ReporteAcademicoController::class, 'promediosGenerales']);
    Route::get('/admin/reportes-academicos/grupos-habilitados', [ReporteAcademicoController::class, 'gruposHabilitados']);
    Route::get('/admin/reportes-academicos/estadisticas-materia', [ReporteAcademicoController::class, 'estadisticasMateria']);
    Route::get('/admin/reportes-academicos/docentes-por-grupo', [ReporteAcademicoController::class, 'docentesPorGrupo']);
    Route::get('/admin/reportes-academicos/grupos-mayor-aprobados', [ReporteAcademicoController::class, 'gruposMayorAprobados']);
    Route::get('/admin/reportes-academicos/exportar-pdf', [ReporteAcademicoController::class, 'exportarPdf']);
});

Route::middleware(['auth:sanctum', 'role:admin,administrador,coordinador,autoridad,docente'])->group(function () {
    Route::get('/admin/examenes-cup/resumen', [ExamenCUPController::class, 'resumen']);
    Route::get('/admin/examenes-cup/postulantes-disponibles', [ExamenCUPController::class, 'postulantesDisponibles']);
    Route::get('/admin/examenes-cup', [ExamenCUPController::class, 'index']);
    Route::get('/admin/examenes-cup/{postulante}', [ExamenCUPController::class, 'showByPostulante']);
    Route::post('/admin/examenes-cup', [ExamenCUPController::class, 'store']);
    Route::post('/admin/examenes-cup/importar', [ExamenCUPController::class, 'importar']);
    Route::put('/admin/examenes-cup/{examen}', [ExamenCUPController::class, 'update']);
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

    Route::get('/admin/asignaciones-docentes/resumen', [AsignacionDocenteGrupoController::class, 'resumen']);
    Route::get('/admin/asignaciones-docentes/docentes-disponibles', [AsignacionDocenteGrupoController::class, 'docentesDisponibles']);
    Route::get('/admin/asignaciones-docentes', [AsignacionDocenteGrupoController::class, 'index']);
    Route::get('/admin/asignaciones-docentes/{asignacion}', [AsignacionDocenteGrupoController::class, 'show']);
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

    Route::post('/admin/asignaciones-docentes', [AsignacionDocenteGrupoController::class, 'store']);
    Route::post('/admin/asignaciones-docentes/{asignacion}/inactivar', [AsignacionDocenteGrupoController::class, 'inactivar']);
    Route::post('/admin/asignaciones-docentes/{asignacion}/reactivar', [AsignacionDocenteGrupoController::class, 'reactivar']);

    Route::post('/admin/aulas', [AulaController::class, 'store']);
    Route::post('/admin/aulas/{aula}/actualizar', [AulaController::class, 'update']);
    Route::post('/admin/aulas/{aula}/inactivar', [AulaController::class, 'inactivar']);
    Route::post('/admin/aulas/{aula}/activar', [AulaController::class, 'activar']);

    Route::post('/admin/cargas-horarias', [CargaHorariaController::class, 'store']);
    Route::post('/admin/cargas-horarias/{carga}/actualizar', [CargaHorariaController::class, 'update']);
    Route::post('/admin/cargas-horarias/{carga}/inactivar', [CargaHorariaController::class, 'inactivar']);
    Route::post('/admin/cargas-horarias/{carga}/activar', [CargaHorariaController::class, 'activar']);
});

Route::middleware(['auth:sanctum', 'role:docente'])->group(function () {
    Route::get('/docente/mi-perfil', [DocenteController::class, 'miPerfil']);
    Route::post('/docente/mi-perfil', [DocenteController::class, 'guardarMiPerfil']);
    Route::post('/docente/mi-perfil/enviar-revision', [DocenteController::class, 'enviarMiPerfilRevision']);
    Route::get('/docente/mis-grupos-asignados', [AsignacionDocenteGrupoController::class, 'misGruposAsignados']);
    Route::get('/docente/mi-carga-horaria', [CargaHorariaController::class, 'miCargaHoraria']);
    Route::post('/docente/cargas-horarias/{carga}/registrar-asistencia', [AsistenciaDocenteController::class, 'registrar']);
    Route::get('/docente/asistencias', [AsistenciaDocenteController::class, 'misAsistencias']);
});

Route::middleware(['auth:sanctum', 'role:postulante'])->group(function () {
    Route::get('/postulante/mi-grupo-horario', [GrupoHorarioController::class, 'miGrupoHorario']);
    Route::get('/postulante/mis-notas-cup', [ExamenCUPController::class, 'misNotasCup']);
    Route::get('/postulante/mi-resultado-admision', [ResultadoAdmisionController::class, 'miResultadoAdmision']);
});

Route::middleware(['auth:sanctum', 'role:admin,administrador,coordinador,autoridad'])->group(function () {
    Route::get('/admin/admisiones-cup/resumen', [AdmisionCUPController::class, 'resumen']);
    Route::get('/admin/admisiones-cup', [AdmisionCUPController::class, 'index']);
    Route::get('/admin/admisiones-cup/{admision}', [AdmisionCUPController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'role:admin,administrador,coordinador'])->group(function () {
    Route::post('/admin/admisiones-cup/procesar', [AdmisionCUPController::class, 'procesar']);
    Route::post('/admin/admisiones-cup/reprocesar', [AdmisionCUPController::class, 'reprocesar']);
});

// CU18 — Panel Administrativo CUP (solo lectura)
Route::middleware(['auth:sanctum', 'role:admin,administrador,coordinador,autoridad'])->group(function () {
    Route::get('/admin/dashboard-cup/resumen', [DashboardCupController::class, 'resumen']);
});

Route::get('/ping', function () {
    return response()->json([
        'message' => 'Backend Laravel funcionando correctamente',
        'status' => 'ok',
    ]);
});
