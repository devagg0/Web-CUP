<?php

namespace App\Http\Controllers;

use App\Models\GrupoCup;
use App\Services\GrupoCupService;
use RuntimeException;

class GrupoCupController extends Controller
{
    public function __construct(private GrupoCupService $grupoCupService)
    {
    }

    public function resumen()
    {
        return response()->json($this->grupoCupService->resumen());
    }

    public function index()
    {
        $grupos = GrupoCup::query()
            ->orderBy('id')
            ->get([
                'id',
                'codigo',
                'nombre',
                'capacidad_maxima',
                'cantidad_estudiantes',
                'estado',
                'created_at',
            ]);

        return response()->json($grupos);
    }

    public function show(GrupoCup $grupo)
    {
        $grupo->load([
            'postulantes' => fn ($query) => $query
                ->with(['primeraCarrera:id,nombre', 'segundaCarrera:id,nombre'])
                ->orderBy('apellidos')
                ->orderBy('nombres'),
        ]);

        return response()->json([
            'id' => $grupo->id,
            'codigo' => $grupo->codigo,
            'nombre' => $grupo->nombre,
            'capacidad_maxima' => $grupo->capacidad_maxima,
            'cantidad_estudiantes' => $grupo->cantidad_estudiantes,
            'estado' => $grupo->estado,
            'created_at' => $grupo->created_at,
            'estudiantes' => $grupo->postulantes->map(fn ($postulante) => [
                'ci' => $postulante->ci,
                'nombre_completo' => trim($postulante->nombres.' '.$postulante->apellidos),
                'correo' => $postulante->correo,
                'primera_carrera' => $postulante->primeraCarrera?->nombre,
                'segunda_carrera' => $postulante->segundaCarrera?->nombre,
                'estado_preinscripcion' => $postulante->estado_preinscripcion,
            ])->values(),
        ]);
    }

    public function generar()
    {
        try {
            $resultado = $this->grupoCupService->generar();
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => $resultado['message'] ?? 'Grupos generados correctamente',
            'total_inscritos' => $resultado['resumen']['total_inscritos'] ?? 0,
            'estudiantes_asignados' => $resultado['resumen']['estudiantes_asignados'] ?? 0,
            'estudiantes_pendientes' => $resultado['resumen']['estudiantes_pendientes'] ?? 0,
            'grupos_generados' => $resultado['resumen']['grupos_generados'] ?? 0,
            'grupos_nuevos_creados' => $resultado['resumen']['grupos_nuevos_creados'] ?? 0,
            'nuevos_asignados' => $resultado['resumen']['nuevos_asignados'] ?? 0,
            'resumen' => $resultado['resumen'],
            'grupos' => $resultado['grupos']->map(fn (GrupoCup $grupo) => [
                'id' => $grupo->id,
                'codigo' => $grupo->codigo,
                'nombre' => $grupo->nombre,
                'capacidad_maxima' => $grupo->capacidad_maxima,
                'cantidad_estudiantes' => $grupo->cantidad_estudiantes,
                'estado' => $grupo->estado,
            ])->values(),
        ], 201);
    }

    public function inactivar(GrupoCup $grupo)
    {
        $grupo->update(['estado' => 'INACTIVO']);

        return response()->json([
            'message' => 'Grupo inactivado correctamente',
            'grupo' => [
                'id' => $grupo->id,
                'codigo' => $grupo->codigo,
                'nombre' => $grupo->nombre,
                'capacidad_maxima' => $grupo->capacidad_maxima,
                'cantidad_estudiantes' => $grupo->cantidad_estudiantes,
                'estado' => $grupo->estado,
            ],
        ]);
    }
}
