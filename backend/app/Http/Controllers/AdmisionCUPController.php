<?php

namespace App\Http\Controllers;

use App\Models\AdmisionCUP;
use App\Services\AdmisionCUPService;
use Illuminate\Http\Request;
use RuntimeException;

class AdmisionCUPController extends Controller
{
    protected AdmisionCUPService $admisionService;

    public function __construct(AdmisionCUPService $admisionService)
    {
        $this->admisionService = $admisionService;
    }

    /**
     * Retorna el resumen estadístico del proceso de admisión.
     */
    public function resumen(Request $request)
    {
        $resumen = $this->admisionService->resumen();
        return response()->json($resumen);
    }

    /**
     * Retorna el listado paginado y filtrado de postulantes procesados en admisión.
     */
    public function index(Request $request)
    {
        $query = $this->admisionService->queryConFiltros($request);

        $perPage = $request->input('per_page', 10);
        $admisiones = $query->paginate($perPage);

        $admisiones->getCollection()->transform(
            fn (AdmisionCUP $admision) => $this->admisionService->transform($admision)
        );

        return response()->json($admisiones);
    }

    /**
     * Retorna el detalle de una admisión específica.
     */
    public function show(AdmisionCUP $admision)
    {
        return response()->json($this->admisionService->transform($admision));
    }

    /**
     * Ejecuta el procesamiento de admisión por cupos de forma transaccional.
     */
    public function procesar(Request $request)
    {
        try {
            $resultado = $this->admisionService->procesarAdmision();

            return response()->json([
                'message' => 'Procesamiento de admisión por cupos finalizado correctamente',
                'resultado' => $resultado,
            ], 200);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }

    /**
     * Ejecuta el reprocesamiento de admisión por cupos (idempotente).
     */
    public function reprocesar(Request $request)
    {
        try {
            $resultado = $this->admisionService->procesarAdmision();

            return response()->json([
                'message' => 'Reprocesamiento de admisión por cupos finalizado correctamente',
                'resultado' => $resultado,
            ], 200);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }
}
