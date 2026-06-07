<?php

namespace App\Http\Controllers;

use App\Models\AsignacionDocenteGrupo;
use App\Models\AsistenciaDocente;
use App\Models\CargaHoraria;
use App\Services\CargaHorariaService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class CargaHorariaController extends Controller
{
    public function __construct(private CargaHorariaService $cargaHorariaService)
    {
    }

    public function resumen()
    {
        return response()->json($this->cargaHorariaService->resumen());
    }

    public function index(Request $request)
    {
        $query = CargaHoraria::with(['asignacion.grupo', 'asignacion.materia', 'asignacion.docente.user', 'aula']);

        if ($request->filled('grupo_id')) {
            $query->whereHas('asignacion', fn ($query) => $query->where('grupo_id', $request->query('grupo_id')));
        }

        if ($request->filled('materia_id')) {
            $query->whereHas('asignacion', fn ($query) => $query->where('materia_id', $request->query('materia_id')));
        }

        if ($request->filled('docente_id')) {
            $query->whereHas('asignacion', fn ($query) => $query->where('docente_id', $request->query('docente_id')));
        }

        foreach (['aula_id', 'turno', 'dia_semana', 'estado'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->query($filter));
            }
        }

        $cargas = $query->orderBy('id')->paginate(10);
        $cargas->getCollection()->transform(
            fn (CargaHoraria $carga) => $this->cargaHorariaService->transform($carga)
        );

        return response()->json($cargas);
    }

    public function show(CargaHoraria $carga)
    {
        return response()->json($this->cargaHorariaService->transform($carga));
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules(), $this->messages());

        try {
            $carga = $this->cargaHorariaService->crear($validated);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Carga horaria registrada correctamente',
            'carga_horaria' => $this->cargaHorariaService->transform($carga),
        ], 201);
    }

    public function update(Request $request, CargaHoraria $carga)
    {
        $validated = $request->validate($this->rules(true), $this->messages());

        try {
            $carga = $this->cargaHorariaService->actualizar($carga, $validated);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Carga horaria actualizada correctamente',
            'carga_horaria' => $this->cargaHorariaService->transform($carga),
        ]);
    }

    public function inactivar(CargaHoraria $carga)
    {
        $carga = $this->cargaHorariaService->inactivar($carga);

        return response()->json([
            'message' => 'Carga horaria inactivada correctamente',
            'carga_horaria' => $this->cargaHorariaService->transform($carga),
        ]);
    }

    public function activar(CargaHoraria $carga)
    {
        try {
            $carga = $this->cargaHorariaService->activar($carga);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Carga horaria activada correctamente',
            'carga_horaria' => $this->cargaHorariaService->transform($carga),
        ]);
    }

    public function asignacionesDisponibles(Request $request)
    {
        $query = AsignacionDocenteGrupo::with(['grupo', 'materia', 'docente.user'])
            ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA);

        foreach (['grupo_id', 'materia_id', 'docente_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->query($filter));
            }
        }

        return response()->json([
            'data' => $query->orderBy('id')
                ->get()
                ->map(fn (AsignacionDocenteGrupo $asignacion) => $this->cargaHorariaService->transformAsignacionDisponible($asignacion))
                ->values(),
        ]);
    }

    public function aulasDisponibles(Request $request)
    {
        $validated = $request->validate([
            'dia_semana' => ['required', Rule::in(CargaHoraria::DIAS)],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fin' => ['required', 'date_format:H:i'],
        ], $this->messages());

        try {
            $aulas = $this->cargaHorariaService->aulasDisponibles(
                $validated['dia_semana'],
                $validated['hora_inicio'],
                $validated['hora_fin']
            );
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'data' => $aulas->map(fn ($aula) => $this->cargaHorariaService->transformAula($aula))->values(),
        ]);
    }

    public function miCargaHoraria(Request $request)
    {
        $docente = $request->user()->docente;

        if (! $docente) {
            return response()->json(['message' => 'Perfil docente no encontrado'], 404);
        }

        $hoy = now()->toDateString();

        $cargas = CargaHoraria::with([
            'asignacion.grupo',
            'asignacion.materia',
            'aula',
            'asistencias' => fn ($query) => $query->whereDate('fecha', $hoy),
        ])
            ->where('estado', CargaHoraria::ESTADO_ACTIVA)
            ->whereHas('asignacion', function ($query) use ($docente) {
                $query->where('docente_id', $docente->id)
                    ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA);
            })
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->map(function (CargaHoraria $carga) {
                return $this->cargaHorariaService->transformMiCarga($carga, $carga->asistencias->first());
            })
            ->values();

        return response()->json(['data' => $cargas]);
    }

    private function rules(bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';

        return [
            'asignacion_docente_grupo_id' => [$required, Rule::exists('asignaciones_docente_grupo', 'id')],
            'aula_id' => [$required, Rule::exists('aulas', 'id')],
            'turno' => [$required, Rule::in(CargaHoraria::TURNOS)],
            'dia_semana' => [$required, Rule::in(CargaHoraria::DIAS)],
            'hora_inicio' => [$required, 'date_format:H:i'],
            'hora_fin' => [$required, 'date_format:H:i'],
        ];
    }

    private function messages(): array
    {
        return [
            'asignacion_docente_grupo_id.required' => 'La asignación docente-grupo es obligatoria.',
            'asignacion_docente_grupo_id.exists' => 'La asignación docente-grupo no existe.',
            'aula_id.required' => 'El aula es obligatoria.',
            'aula_id.exists' => 'El aula no existe.',
            'turno.required' => 'El turno es obligatorio.',
            'turno.in' => 'El turno no es válido.',
            'dia_semana.required' => 'El día de la semana es obligatorio.',
            'dia_semana.in' => 'El día de la semana no es válido.',
            'hora_inicio.required' => 'La hora de inicio es obligatoria.',
            'hora_inicio.date_format' => 'La hora de inicio no es válida.',
            'hora_fin.required' => 'La hora de fin es obligatoria.',
            'hora_fin.date_format' => 'La hora de fin no es válida.',
        ];
    }
}
