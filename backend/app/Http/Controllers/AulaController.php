<?php

namespace App\Http\Controllers;

use App\Models\Aula;
use App\Services\CargaHorariaService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AulaController extends Controller
{
    public function __construct(private CargaHorariaService $cargaHorariaService)
    {
    }

    public function index(Request $request)
    {
        $query = Aula::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($query) use ($search) {
                $query->where('codigo', 'like', "%{$search}%")
                    ->orWhere('nombre', 'like', "%{$search}%")
                    ->orWhere('ubicacion', 'like', "%{$search}%");
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->query('estado'));
        }

        $aulas = $query->orderBy('codigo')->paginate(10);
        $aulas->getCollection()->transform(
            fn (Aula $aula) => $this->cargaHorariaService->transformAula($aula)
        );

        return response()->json($aulas);
    }

    public function show(Aula $aula)
    {
        return response()->json($this->cargaHorariaService->transformAula($aula));
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules(), $this->messages());

        $aula = Aula::create([
            'codigo' => $validated['codigo'],
            'nombre' => $validated['nombre'],
            'capacidad' => $validated['capacidad'],
            'ubicacion' => $validated['ubicacion'] ?? null,
            'estado' => $validated['estado'] ?? Aula::ESTADO_ACTIVA,
        ]);

        return response()->json([
            'message' => 'Aula registrada correctamente',
            'aula' => $this->cargaHorariaService->transformAula($aula),
        ], 201);
    }

    public function update(Request $request, Aula $aula)
    {
        $validated = $request->validate($this->rules($aula), $this->messages());

        $aula->update([
            'codigo' => $validated['codigo'],
            'nombre' => $validated['nombre'],
            'capacidad' => $validated['capacidad'],
            'ubicacion' => $validated['ubicacion'] ?? null,
            'estado' => $validated['estado'] ?? $aula->estado,
        ]);

        return response()->json([
            'message' => 'Aula actualizada correctamente',
            'aula' => $this->cargaHorariaService->transformAula($aula->fresh()),
        ]);
    }

    public function inactivar(Aula $aula)
    {
        $aula->update(['estado' => Aula::ESTADO_INACTIVA]);

        return response()->json([
            'message' => 'Aula inactivada correctamente',
            'aula' => $this->cargaHorariaService->transformAula($aula->fresh()),
        ]);
    }

    public function activar(Aula $aula)
    {
        $aula->update(['estado' => Aula::ESTADO_ACTIVA]);

        return response()->json([
            'message' => 'Aula activada correctamente',
            'aula' => $this->cargaHorariaService->transformAula($aula->fresh()),
        ]);
    }

    private function rules(?Aula $aula = null): array
    {
        return [
            'codigo' => ['required', 'string', 'max:50', Rule::unique('aulas', 'codigo')->ignore($aula?->id)],
            'nombre' => ['required', 'string', 'max:255'],
            'capacidad' => ['required', 'integer', 'min:1'],
            'ubicacion' => ['nullable', 'string', 'max:255'],
            'estado' => ['sometimes', Rule::in(Aula::ESTADOS)],
        ];
    }

    private function messages(): array
    {
        return [
            'codigo.required' => 'El código del aula es obligatorio.',
            'codigo.unique' => 'El código del aula ya existe.',
            'nombre.required' => 'El nombre del aula es obligatorio.',
            'capacidad.required' => 'La capacidad del aula es obligatoria.',
            'capacidad.integer' => 'La capacidad debe ser un número entero.',
            'capacidad.min' => 'La capacidad debe ser mayor a 0.',
            'estado.in' => 'El estado del aula no es válido.',
        ];
    }
}
