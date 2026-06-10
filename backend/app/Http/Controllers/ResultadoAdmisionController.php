<?php

namespace App\Http\Controllers;

use App\Services\ResultadoAdmisionService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class ResultadoAdmisionController extends Controller
{
    private ResultadoAdmisionService $resultadoService;

    public function __construct(ResultadoAdmisionService $resultadoService)
    {
        $this->resultadoService = $resultadoService;
    }

    /**
     * Retorna el resultado de admisión del postulante autenticado.
     */
    public function miResultadoAdmision(Request $request)
    {
        try {
            $resultado = $this->resultadoService->obtenerResultadoPostulante($request->user());
            return response()->json($resultado);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 404);
        }
    }
}
