<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CarreraController extends Controller
{
    /**
     * Listar todas las carreras con filtros opcionales
     */
    public function index(Request $request)
    {
        $query = Carrera::query();

        // Filtro por búsqueda
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('nombre', 'ilike', '%' . $search . '%')
                  ->orWhere('descripcion', 'ilike', '%' . $search . '%');
        }

        // Filtro por estado
        if ($request->has('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        $carreras = $query->get();

        return response()->json($carreras);
    }

    /**
     * Crear una nueva carrera
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:150|unique:carreras',
            'descripcion' => 'nullable|string',
            'cupos_totales' => 'required|integer|min:0',
            'cupos_ocupados' => 'required|integer|min:0|lte:cupos_totales',
            'estado' => 'required|in:ACTIVA,INACTIVA',
        ]);

        $carrera = Carrera::create($validated);

        return response()->json([
            'message' => 'Carrera creada correctamente',
            'carrera' => $carrera,
        ], 201);
    }

    /**
     * Mostrar una carrera específica
     */
    public function show(Carrera $carrera)
    {
        return response()->json($carrera);
    }

    /**
     * Actualizar una carrera
     */
    public function update(Request $request, Carrera $carrera)
    {
        $validated = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:150',
                Rule::unique('carreras')->ignore($carrera->id),
            ],
            'descripcion' => 'nullable|string',
            'cupos_totales' => 'required|integer|min:0',
            'cupos_ocupados' => 'required|integer|min:0|lte:cupos_totales',
            'estado' => 'required|in:ACTIVA,INACTIVA',
        ]);

        $carrera->update($validated);

        return response()->json([
            'message' => 'Carrera actualizada correctamente',
            'carrera' => $carrera,
        ]);
    }

    /**
     * Actualizar solo el estado de una carrera
     */
    public function updateEstado(Request $request, Carrera $carrera)
    {
        $validated = $request->validate([
            'estado' => 'required|in:ACTIVA,INACTIVA',
        ]);

        $carrera->update($validated);

        return response()->json([
            'message' => 'Estado de la carrera actualizado correctamente',
            'carrera' => $carrera,
        ]);
    }

    /**
     * Desactivar una carrera (soft delete)
     */
    public function destroy(Carrera $carrera)
    {
        $carrera->update(['estado' => 'INACTIVA']);

        return response()->json([
            'message' => 'Carrera desactivada correctamente',
        ]);
    }

    /**
     * Listar solo carreras activas
     */
    public function activas()
    {
        $carreras = Carrera::where('estado', 'ACTIVA')->get();

        return response()->json([
            'data' => $carreras,
        ]);
    }

    /**
     * Resumen de carreras y cupos
     */
    public function resumen()
    {
        $totalCarreras = Carrera::count();
        $carrirasActivas = Carrera::where('estado', 'ACTIVA')->count();
        $carrirasInactivas = Carrera::where('estado', 'INACTIVA')->count();

        // Solo sumar cupos de carreras ACTIVAS
        $cuposTotales = Carrera::where('estado', 'ACTIVA')
            ->sum('cupos_totales');
        $cuposOcupados = Carrera::where('estado', 'ACTIVA')
            ->sum('cupos_ocupados');
        $cuposDisponibles = $cuposTotales - $cuposOcupados;

        return response()->json([
            'total_carreras' => $totalCarreras,
            'carreras_activas' => $carrirasActivas,
            'carreras_inactivas' => $carrirasInactivas,
            'cupos_totales' => $cuposTotales,
            'cupos_ocupados' => $cuposOcupados,
            'cupos_disponibles' => $cuposDisponibles,
        ]);
    }
}
