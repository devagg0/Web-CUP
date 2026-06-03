<?php

namespace App\Http\Controllers;

use App\Models\Materia;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MateriaController extends Controller
{
    /**
     * Listar todas las materias con filtros opcionales.
     */
    public function index(Request $request)
    {
        $query = Materia::query();

        // Filtro por búsqueda
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'ilike', "%{$search}%")
                  ->orWhere('codigo', 'ilike', "%{$search}%")
                  ->orWhere('descripcion', 'ilike', "%{$search}%");
            });
        }

        // Filtro por estado
        if ($request->has('estado') && $request->estado) {
            $query->where('estado', $request->estado);
        }

        $materias = $query->orderBy('nombre')->get();

        return response()->json([
            'data' => $materias,
        ]);
    }

    /**
     * Crear una nueva materia.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100', 'unique:materias,nombre'],
            'codigo' => ['required', 'string', 'max:20', 'unique:materias,codigo'],
            'descripcion' => ['nullable', 'string'],
            'estado' => ['required', Rule::in(['ACTIVA', 'INACTIVA'])],
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre no debe exceder 100 caracteres',
            'nombre.unique' => 'El nombre ya existe',
            'codigo.required' => 'El código es obligatorio',
            'codigo.max' => 'El código no debe exceder 20 caracteres',
            'codigo.unique' => 'El código ya existe',
            'estado.required' => 'El estado es obligatorio',
            'estado.in' => 'El estado solo puede ser ACTIVA o INACTIVA',
        ]);

        $materia = Materia::create($validated);

        return response()->json([
            'message' => 'Materia creada correctamente',
            'materia' => $materia,
        ], 201);
    }

    /**
     * Obtener una materia específica.
     */
    public function show(Materia $materia)
    {
        return response()->json($materia);
    }

    /**
     * Actualizar una materia.
     */
    public function update(Request $request, Materia $materia)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:100', Rule::unique('materias', 'nombre')->ignore($materia->id)],
            'codigo' => ['required', 'string', 'max:20', Rule::unique('materias', 'codigo')->ignore($materia->id)],
            'descripcion' => ['nullable', 'string'],
            'estado' => ['required', Rule::in(['ACTIVA', 'INACTIVA'])],
        ], [
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.max' => 'El nombre no debe exceder 100 caracteres',
            'nombre.unique' => 'El nombre ya existe',
            'codigo.required' => 'El código es obligatorio',
            'codigo.max' => 'El código no debe exceder 20 caracteres',
            'codigo.unique' => 'El código ya existe',
            'estado.required' => 'El estado es obligatorio',
            'estado.in' => 'El estado solo puede ser ACTIVA o INACTIVA',
        ]);

        $materia->update($validated);

        return response()->json([
            'message' => 'Materia actualizada correctamente',
            'materia' => $materia,
        ]);
    }

    /**
     * Actualizar solo el estado de una materia.
     */
    public function updateEstado(Request $request, Materia $materia)
    {
        $validated = $request->validate([
            'estado' => ['required', Rule::in(['ACTIVA', 'INACTIVA'])],
        ], [
            'estado.required' => 'El estado es obligatorio',
            'estado.in' => 'El estado solo puede ser ACTIVA o INACTIVA',
        ]);

        $materia->update(['estado' => $validated['estado']]);

        return response()->json([
            'message' => 'Estado de la materia actualizado correctamente',
            'materia' => $materia,
        ]);
    }

    /**
     * Desactivar una materia (cambiar estado a INACTIVA).
     */
    public function destroy(Materia $materia)
    {
        $materia->update(['estado' => 'INACTIVA']);

        return response()->json([
            'message' => 'Materia desactivada correctamente',
        ]);
    }

    /**
     * Obtener solo materias activas.
     */
    public function activas()
    {
        $materias = Materia::where('estado', 'ACTIVA')->orderBy('nombre')->get();

        return response()->json([
            'data' => $materias,
        ]);
    }

    /**
     * Obtener resumen de estadísticas de materias.
     */
    public function resumen()
    {
        return response()->json([
            'total_materias' => Materia::count(),
            'materias_activas' => Materia::where('estado', 'ACTIVA')->count(),
            'materias_inactivas' => Materia::where('estado', 'INACTIVA')->count(),
        ]);
    }
}
