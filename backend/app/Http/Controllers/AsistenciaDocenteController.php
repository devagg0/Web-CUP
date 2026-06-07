<?php

namespace App\Http\Controllers;

use App\Models\AsistenciaDocente;
use App\Models\CargaHoraria;
use App\Services\CargaHorariaService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class AsistenciaDocenteController extends Controller
{
    public function __construct(private CargaHorariaService $cargaHorariaService)
    {
    }

    public function adminIndex(Request $request)
    {
        $query = AsistenciaDocente::with([
            'cargaHoraria.asignacion.grupo',
            'cargaHoraria.asignacion.materia',
            'cargaHoraria.asignacion.docente.user',
            'cargaHoraria.aula',
            'docente.user',
            'registradoPor',
        ]);

        if ($request->filled('docente_id')) {
            $query->where('docente_id', $request->query('docente_id'));
        }

        if ($request->filled('carga_horaria_id')) {
            $query->where('carga_horaria_id', $request->query('carga_horaria_id'));
        }

        $this->aplicarFiltrosFechaEstado($query, $request);

        $asistencias = $query->orderByDesc('fecha')->orderByDesc('id')->paginate(10);
        $asistencias->getCollection()->transform(
            fn (AsistenciaDocente $asistencia) => $this->cargaHorariaService->transformAsistencia($asistencia)
        );

        return response()->json($asistencias);
    }

    public function show(AsistenciaDocente $asistencia)
    {
        return response()->json($this->cargaHorariaService->transformAsistencia($asistencia));
    }

    public function registrar(Request $request, CargaHoraria $carga)
    {
        $docente = $request->user()->docente;

        if (! $docente) {
            return response()->json(['message' => 'Perfil docente no encontrado'], 404);
        }

        $validated = $request->validate($this->rules(), $this->messages());

        try {
            $asistencia = $this->cargaHorariaService->registrarAsistencia($carga, $docente, $validated, $request->user()->id);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Asistencia docente registrada correctamente',
            'asistencia' => $this->cargaHorariaService->transformAsistencia($asistencia),
        ], 201);
    }

    public function misAsistencias(Request $request)
    {
        $docente = $request->user()->docente;

        if (! $docente) {
            return response()->json(['message' => 'Perfil docente no encontrado'], 404);
        }

        $query = AsistenciaDocente::with([
            'cargaHoraria.asignacion.grupo',
            'cargaHoraria.asignacion.materia',
            'cargaHoraria.asignacion.docente.user',
            'cargaHoraria.aula',
            'docente.user',
            'registradoPor',
        ])->where('docente_id', $docente->id);

        $this->aplicarFiltrosFechaEstado($query, $request);

        $asistencias = $query->orderByDesc('fecha')->orderByDesc('id')->paginate(10);
        $asistencias->getCollection()->transform(
            fn (AsistenciaDocente $asistencia) => $this->cargaHorariaService->transformAsistencia($asistencia)
        );

        return response()->json($asistencias);
    }

    private function aplicarFiltrosFechaEstado($query, Request $request): void
    {
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->query('fecha_desde'));
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->query('fecha_hasta'));
        }

        if ($request->filled('estado_asistencia')) {
            $query->where('estado_asistencia', $request->query('estado_asistencia'));
        }
    }

    private function rules(): array
    {
        return [
            'fecha' => ['required', 'date'],
            'estado_asistencia' => ['required', Rule::in(AsistenciaDocente::ESTADOS)],
            'observacion' => ['nullable', 'string'],
        ];
    }

    private function messages(): array
    {
        return [
            'fecha.required' => 'La fecha es obligatoria.',
            'fecha.date' => 'La fecha no es válida.',
            'estado_asistencia.required' => 'El estado de asistencia es obligatorio.',
            'estado_asistencia.in' => 'El estado de asistencia no es válido.',
        ];
    }
}
