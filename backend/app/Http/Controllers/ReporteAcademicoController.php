<?php

namespace App\Http\Controllers;

use App\Services\ReporteAcademicoService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ReporteAcademicoController extends Controller
{
    protected ReporteAcademicoService $reporteService;

    public function __construct(ReporteAcademicoService $reporteService)
    {
        $this->reporteService = $reporteService;
    }

    /**
     * Resumen general para las tarjetas.
     */
    public function resumen(Request $request)
    {
        $resumen = $this->reporteService->getResumen();
        return response()->json($resumen);
    }

    /**
     * Reporte 1: Lista general de postulantes.
     */
    public function listaGeneralPostulantes(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 100), 500);
        $query = $this->reporteService->queryListaGeneralPostulantes($request->all());
        $paginator = $query->paginate($perPage);
        $paginator->setCollection(collect($this->reporteService->formatListaGeneralPostulantes($paginator->items())));
        
        return response()->json($paginator);
    }

    /**
     * Reporte 2: Postulantes aprobados.
     */
    public function postulantesAprobados(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 100), 500);
        $query = $this->reporteService->queryPostulantesAprobados($request->all());
        $paginator = $query->paginate($perPage);
        $paginator->setCollection(collect($this->reporteService->formatPostulantesAprobados($paginator->items())));

        return response()->json($paginator);
    }

    /**
     * Reporte 3: Postulantes reprobados.
     */
    public function postulantesReprobados(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 100), 500);
        $query = $this->reporteService->queryPostulantesReprobados($request->all());
        $paginator = $query->paginate($perPage);
        $paginator->setCollection(collect($this->reporteService->formatPostulantesReprobados($paginator->items())));

        return response()->json($paginator);
    }

    /**
     * Reporte 4: Promedios generales.
     */
    public function promediosGenerales(Request $request)
    {
        $resumen = $this->reporteService->getPromediosGenerales($request->all());
        return response()->json($resumen);
    }

    /**
     * Reporte 5: Cantidad de grupos habilitados.
     */
    public function gruposHabilitados(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 100), 500);
        $resumen = $this->reporteService->getResumenGruposHabilitados($request->all());
        $query = $this->reporteService->queryGruposHabilitados($request->all());
        $paginator = $query->paginate($perPage);
        $formatted = $this->reporteService->formatGruposHabilitados($paginator->items());

        return response()->json(array_merge(
            $resumen,
            $paginator->setCollection(collect($formatted))->toArray()
        ));
    }

    /**
     * Reporte 6: Estadísticas por materia.
     */
    public function estadisticasMateria(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 100), 500);
        $query = $this->reporteService->queryEstadisticasMateria($request->all());
        $paginator = $query->paginate($perPage);
        $formatted = $this->reporteService->formatEstadisticasMateria($paginator->items(), $request->all());

        return response()->json($paginator->setCollection(collect($formatted)));
    }

    /**
     * Reporte 7: Docentes por grupos.
     */
    public function docentesPorGrupo(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 100), 500);
        $query = $this->reporteService->queryDocentesPorGrupo($request->all());
        $paginator = $query->paginate($perPage);
        $formatted = $this->reporteService->formatDocentesPorGrupo($paginator->items());

        return response()->json([
            'data' => $formatted,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    /**
     * Reporte 8: Grupos con mayor cantidad de aprobados.
     */
    public function gruposMayorAprobados(Request $request)
    {
        $query = $this->reporteService->queryGruposMayorAprobados($request->all());
        $groups = $query->get();
        $formatted = $this->reporteService->formatGruposMayorAprobados($groups, $request->all());

        return response()->json([
            'data' => $formatted,
            'total' => count($formatted),
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => count($formatted) ?: 100,
        ]);
    }

    /**
     * Exportar reporte seleccionado en formato PDF.
     */
    public function exportarPdf(Request $request)
    {
        $tipo = $request->input('tipo_reporte');
        $validTypes = [
            'lista_general_postulantes',
            'postulantes_aprobados',
            'postulantes_reprobados',
            'promedios_generales',
            'grupos_habilitados',
            'estadisticas_materia',
            'docentes_por_grupo',
            'grupos_mayor_aprobados'
        ];

        if (!$tipo || !in_array($tipo, $validTypes)) {
            return response()->json([
                'message' => 'Tipo de reporte no válido.'
            ], 422);
        }

        $title = str_replace('_', ' ', $tipo);
        $title = ucwords($title);
        $data = [];
        $resumenGrupos = null;

        switch ($tipo) {
            case 'lista_general_postulantes':
                $items = $this->reporteService->queryListaGeneralPostulantes($request->all())->get();
                $data = $this->reporteService->formatListaGeneralPostulantes($items);
                break;
            case 'postulantes_aprobados':
                $items = $this->reporteService->queryPostulantesAprobados($request->all())->get();
                $data = $this->reporteService->formatPostulantesAprobados($items);
                break;
            case 'postulantes_reprobados':
                $items = $this->reporteService->queryPostulantesReprobados($request->all())->get();
                $data = $this->reporteService->formatPostulantesReprobados($items);
                break;
            case 'promedios_generales':
                $data = $this->reporteService->getPromediosGenerales($request->all());
                break;
            case 'grupos_habilitados':
                $items = $this->reporteService->queryGruposHabilitados($request->all())->get();
                $data = $this->reporteService->formatGruposHabilitados($items);
                $resumenGrupos = $this->reporteService->getResumenGruposHabilitados($request->all());
                break;
            case 'estadisticas_materia':
                $items = $this->reporteService->queryEstadisticasMateria($request->all())->get();
                $data = $this->reporteService->formatEstadisticasMateria($items, $request->all());
                break;
            case 'docentes_por_grupo':
                $items = $this->reporteService->queryDocentesPorGrupo($request->all())->get();
                $data = $this->reporteService->formatDocentesPorGrupo($items);
                break;
            case 'grupos_mayor_aprobados':
                $items = $this->reporteService->queryGruposMayorAprobados($request->all())->get();
                $data = $this->reporteService->formatGruposMayorAprobados($items, $request->all());
                break;
        }

        $user = $request->user();
        
        $pdf = Pdf::loadView('reportes.academico_pdf', [
            'tipo' => $tipo,
            'title' => $title,
            'data' => $data,
            'resumenGrupos' => $resumenGrupos,
            'fecha' => now()->format('d/m/Y H:i:s'),
            'usuario' => $user ? $user->name : 'Coordinador',
            'filtros' => $request->only(['grupo_id', 'materia_id', 'carrera_id', 'estado_admision', 'search'])
        ]);

        return $pdf->download("reporte_{$tipo}.pdf");
    }
}
