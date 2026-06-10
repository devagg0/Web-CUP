<?php

namespace App\Http\Controllers;

use App\Services\DashboardCupService;
use Illuminate\Http\JsonResponse;

class DashboardCupController extends Controller
{
    public function __construct(
        private readonly DashboardCupService $service
    ) {}

    /**
     * GET /api/admin/dashboard-cup/resumen
     *
     * Devuelve el resumen completo del panel administrativo CUP.
     * Solo lectura. Protegido por auth:sanctum + role:admin,administrador,coordinador,autoridad.
     */
    public function resumen(): JsonResponse
    {
        $data = $this->service->getResumenCompleto();

        return response()->json($data);
    }
}
