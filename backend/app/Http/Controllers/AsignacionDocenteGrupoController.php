<?php

namespace App\Http\Controllers;

use App\Models\AsignacionDocenteGrupo;
use App\Services\AsignacionDocenteGrupoService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class AsignacionDocenteGrupoController extends Controller
{
    public function __construct(private AsignacionDocenteGrupoService $asignacionService)
    {
    }

    public function resumen()
    {
        return response()->json($this->asignacionService->resumen());
    }

    public function index(Request $request)
    {
        $query = AsignacionDocenteGrupo::with(['grupo', 'materia', 'docente.user', 'docente.materia']);

        if ($request->filled('grupo_id')) {
            $query->where('grupo_id', $request->query('grupo_id'));
        }

        if ($request->filled('materia_id')) {
            $query->where('materia_id', $request->query('materia_id'));
        }

        if ($request->filled('docente_id')) {
            $query->where('docente_id', $request->query('docente_id'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->query('estado'));
        }

        $asignaciones = $query->orderBy('id')->paginate(10);
        $asignaciones->getCollection()->transform(
            fn (AsignacionDocenteGrupo $asignacion) => $this->asignacionService->transform($asignacion)
        );

        return response()->json($asignaciones);
    }

    public function show(AsignacionDocenteGrupo $asignacion)
    {
        return response()->json($this->asignacionService->transform($asignacion));
    }

    public function docentesDisponibles(Request $request)
    {
        $validated = $request->validate([
            'materia_id' => ['required', Rule::exists('materias', 'id')],
            'grupo_id' => ['sometimes', Rule::exists('grupos_cup', 'id')],
        ], [
            'materia_id.required' => 'La materia no existe.',
            'materia_id.exists' => 'La materia no existe.',
            'grupo_id.exists' => 'El grupo no existe.',
        ]);

        try {
            $docentes = $this->asignacionService->docentesDisponibles(
                (int) $validated['materia_id'],
                isset($validated['grupo_id']) ? (int) $validated['grupo_id'] : null
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'data' => $docentes->map(fn ($docente) => $this->asignacionService->transformDocenteDisponible($docente))->values(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'grupo_id' => ['required', Rule::exists('grupos_cup', 'id')],
            'materia_id' => ['required', Rule::exists('materias', 'id')],
            'docente_id' => ['required', Rule::exists('docentes', 'id')],
        ], [
            'grupo_id.required' => 'El grupo no existe.',
            'grupo_id.exists' => 'El grupo no existe.',
            'materia_id.required' => 'La materia no existe.',
            'materia_id.exists' => 'La materia no existe.',
            'docente_id.required' => 'El docente no existe.',
            'docente_id.exists' => 'El docente no existe.',
        ]);

        try {
            $asignacion = $this->asignacionService->crear($validated);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Docente asignado correctamente',
            'asignacion' => $this->asignacionService->transform($asignacion),
        ], 201);
    }

    public function inactivar(AsignacionDocenteGrupo $asignacion)
    {
        $asignacion = $this->asignacionService->inactivar($asignacion);

        return response()->json([
            'message' => 'Asignación inactivada correctamente',
            'asignacion' => $this->asignacionService->transform($asignacion),
        ]);
    }

    public function reactivar(AsignacionDocenteGrupo $asignacion)
    {
        try {
            $asignacion = $this->asignacionService->reactivar($asignacion);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Asignación reactivada correctamente',
            'asignacion' => $this->asignacionService->transform($asignacion),
        ]);
    }

    public function misGruposAsignados(Request $request)
    {
        $docente = $request->user()->docente;

        if (! $docente) {
            return response()->json([
                'message' => 'Perfil docente no encontrado',
            ], 404);
        }

        $asignaciones = AsignacionDocenteGrupo::with(['grupo', 'materia'])
            ->where('docente_id', $docente->id)
            ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)
            ->orderBy('id')
            ->get()
            ->map(fn (AsignacionDocenteGrupo $asignacion) => [
                'id' => $asignacion->id,
                'grupo' => $asignacion->grupo ? [
                    'id' => $asignacion->grupo->id,
                    'codigo' => $asignacion->grupo->codigo,
                    'nombre' => $asignacion->grupo->nombre,
                    'cantidad_estudiantes' => $asignacion->grupo->cantidad_estudiantes,
                ] : null,
                'materia' => $asignacion->materia ? [
                    'id' => $asignacion->materia->id,
                    'nombre' => $asignacion->materia->nombre,
                ] : null,
                'estado' => $asignacion->estado,
            ])
            ->values();

        return response()->json([
            'data' => $asignaciones,
        ]);
    }
}
