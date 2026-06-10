<?php

namespace App\Http\Controllers;

use App\Models\ExamenCUP;
use App\Models\Postulante;
use App\Services\ExamenCUPService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class ExamenCUPController extends Controller
{
    public function __construct(private ExamenCUPService $examenService)
    {
    }

    public function resumen(Request $request)
    {
        return response()->json($this->examenService->resumen($request->user()));
    }

    public function postulantesDisponibles(Request $request)
    {
        $search = $request->query('search');
        $grupoId = $request->query('grupo_id') ? (int) $request->query('grupo_id') : null;
        $materiaId = $request->query('materia_id') ? (int) $request->query('materia_id') : null;

        $postulantes = $this->examenService->postulantesDisponibles(
            $request->user(),
            $search,
            $grupoId,
            $materiaId
        );

        return response()->json($postulantes);
    }

    public function index(Request $request)
    {
        $query = $this->examenService->queryVisibleParaUsuario($request->user());

        if ($request->filled('grupo_id')) {
            $query->where('grupo_id', $request->query('grupo_id'));
        }

        if ($request->filled('materia_id')) {
            $query->where('materia_id', $request->query('materia_id'));
        }

        if ($request->filled('postulante_id')) {
            $query->where('postulante_id', $request->query('postulante_id'));
        }

        if ($request->filled('docente_id')) {
            $query->where('docente_id', $request->query('docente_id'));
        }

        if ($request->filled('ci')) {
            $query->whereHas('postulante', fn ($query) => $query->where('ci', $request->query('ci')));
        }

        $examenes = $query->orderBy('postulante_id')
            ->orderBy('materia_id')
            ->paginate(10);

        $examenes->getCollection()->transform(
            fn (ExamenCUP $examen) => $this->examenService->transform($examen)
        );

        return response()->json($examenes);
    }

    public function showByPostulante(Request $request, Postulante $postulante)
    {
        return response()->json($this->examenService->transformPostulante($postulante, $request->user()));
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules(), $this->messages());

        try {
            $examen = $this->examenService->registrar($validated, $request->user());
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Notas CUP registradas correctamente',
            'examen' => $this->examenService->transform($examen),
        ], 201);
    }

    public function importar(Request $request)
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            $resultado = $this->examenService->importar($request->file('archivo'), $request->user());
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        $status = $resultado['errores'] === [] ? 201 : 422;

        return response()->json([
            'message' => $resultado['errores'] === []
                ? 'Importación de notas CUP finalizada correctamente'
                : 'La importación contiene errores. No se registró ninguna nota.',
            'resumen' => [
                'importados' => $resultado['importados'],
                'errores' => count($resultado['errores']),
            ],
            'errores' => $resultado['errores'],
            'notas' => $resultado['notas'],
        ], $status);
    }

    public function update(Request $request, ExamenCUP $examen)
    {
        $validated = $request->validate($this->rules(false), $this->messages());

        try {
            $examen = $this->examenService->actualizar($examen, $validated, $request->user());
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Notas CUP actualizadas correctamente',
            'examen' => $this->examenService->transform($examen),
        ]);
    }

    public function misNotasCup(Request $request)
    {
        $postulante = $request->user()->postulante;

        if (! $postulante) {
            return response()->json([
                'message' => 'Perfil postulante no encontrado',
            ], 404);
        }

        return response()->json($this->examenService->transformPostulante($postulante));
    }

    private function rules(bool $crear = true): array
    {
        return [
            'postulante_id' => [$crear ? 'required_without:ci' : 'sometimes', 'integer', Rule::exists('postulantes', 'id')],
            'ci' => ['sometimes', 'string', Rule::exists('postulantes', 'ci')],
            'materia_id' => [$crear ? 'required_without:materia' : 'sometimes', 'integer', Rule::exists('materias', 'id')],
            'materia' => ['sometimes', 'string'],
            'grupo_id' => ['sometimes', 'integer', Rule::exists('grupos_cup', 'id')],
            'docente_id' => ['sometimes', 'integer', Rule::exists('docentes', 'id')],
            'parcial_1' => ['required', 'numeric', 'between:0,100'],
            'parcial_2' => ['required', 'numeric', 'between:0,100'],
            'parcial_3' => ['required', 'numeric', 'between:0,100'],
        ];
    }

    private function messages(): array
    {
        return [
            'postulante_id.required_without' => 'Debe enviar postulante_id o ci.',
            'materia_id.required_without' => 'Debe enviar materia_id o materia.',
            'parcial_1.required' => 'La primera nota parcial es obligatoria.',
            'parcial_2.required' => 'La segunda nota parcial es obligatoria.',
            'parcial_3.required' => 'La tercera nota parcial es obligatoria.',
            '*.between' => 'Las notas deben estar entre 0 y 100.',
        ];
    }
}
