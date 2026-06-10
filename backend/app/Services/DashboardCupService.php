<?php

namespace App\Services;

use App\Models\Postulante;
use App\Models\AdmisionCUP;
use App\Models\GrupoCup;
use App\Models\Materia;
use App\Models\Docente;
use App\Models\Carrera;
use Illuminate\Support\Facades\DB;

class DashboardCupService
{
    /**
     * Devuelve el resumen completo del dashboard administrativo.
     * Solo lectura, sin modificar datos.
     */
    public function getResumenCompleto(): array
    {
        try {
            return [
                'metricas_principales'    => $this->getMetricasPrincipales(),
                'estado_proceso'          => $this->getEstadoProceso(),
                'distribucion_academica'  => $this->getDistribucionAcademica(),
                'demanda_carreras'        => $this->getDemandaCarreras(),
                'cupos_por_carrera'       => $this->getCuposPorCarrera(),
                'estadisticas_materia'    => $this->getEstadisticasMateria(),
                'rendimiento_grupos'      => $this->getRendimientoGrupos(),
                'alertas'                 => $this->getAlertas(),
            ];
        } catch (\Throwable $e) {
            // Nunca devolver 500: retornar estructura vacía con error
            return [
                'error'                   => 'Error al obtener datos del dashboard: ' . $e->getMessage(),
                'metricas_principales'    => $this->metricas_vacias(),
                'estado_proceso'          => [],
                'distribucion_academica'  => [],
                'demanda_carreras'        => [],
                'cupos_por_carrera'       => [],
                'estadisticas_materia'    => [],
                'rendimiento_grupos'      => [],
                'alertas'                 => [],
            ];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Métricas principales (indicadores del PDF + adicionales)
    // ─────────────────────────────────────────────────────────────────────────

    private function getMetricasPrincipales(): array
    {
        // Indicadores obligatorios del PDF
        $totalInscritos = Postulante::where(
            DB::raw('upper(trim(estado_preinscripcion))'), 'INSCRITO'
        )->count();

        $totalAprobados = AdmisionCUP::where('estado_academico_cup', 'APROBADO')->count();
        $totalReprobados = AdmisionCUP::where('estado_academico_cup', 'REPROBADO')->count();

        // Fallback to examen_cup if no admissions are processed
        if ($totalAprobados === 0 && $totalReprobados === 0) {
            $totalAprobados = DB::table('examen_cup')
                ->select('postulante_id')
                ->where('estado_materia', 'APROBADO')
                ->groupBy('postulante_id')
                ->havingRaw('COUNT(DISTINCT materia_id) >= 4')
                ->get()
                ->count();

            $totalReprobados = DB::table('examen_cup')
                ->where('estado_materia', 'REPROBADO')
                ->distinct('postulante_id')
                ->count('postulante_id');
        }

        $totalGruposHabilitados = GrupoCup::whereIn('estado', ['ACTIVO', 'HABILITADO', 'DISPONIBLE'])->count();

        // Indicadores adicionales
        $totalPostulantes = Postulante::count();

        $totalPendientes = max(0, $totalInscritos - $totalAprobados - $totalReprobados);

        $totalAdmitidos = AdmisionCUP::whereIn('estado_admision', [
            'ADMITIDO_PRIMERA_OPCION',
            'ADMITIDO_SEGUNDA_OPCION',
        ])->count();

        $totalAprobadosSinCupo = AdmisionCUP::where('estado_admision', 'APROBADO_SIN_CUPO')->count();

        $promedioGeneral = AdmisionCUP::whereNotNull('promedio_final_cup')
            ->avg('promedio_final_cup');

        $totalDocentes = Docente::where('estado_docente', 'HABILITADO')->count();

        $totalMaterias = Materia::where('estado', 'ACTIVA')->count();

        return [
            // Obligatorios PDF
            'total_inscritos'          => $totalInscritos,
            'total_aprobados'          => $totalAprobados,
            'total_reprobados'         => $totalReprobados,
            'total_grupos_habilitados' => $totalGruposHabilitados,
            // Adicionales
            'total_postulantes'        => $totalPostulantes,
            'total_pendientes'         => $totalPendientes,
            'total_admitidos'          => $totalAdmitidos,
            'total_aprobados_sin_cupo' => $totalAprobadosSinCupo,
            'promedio_general'         => $promedioGeneral !== null
                ? round((float) $promedioGeneral, 2)
                : 0,
            'total_docentes'           => $totalDocentes,
            'total_materias'           => $totalMaterias,
        ];
    }

    private function metricas_vacias(): array
    {
        return [
            'total_inscritos'          => 0,
            'total_aprobados'          => 0,
            'total_reprobados'         => 0,
            'total_grupos_habilitados' => 0,
            'total_postulantes'        => 0,
            'total_pendientes'         => 0,
            'total_admitidos'          => 0,
            'total_aprobados_sin_cupo' => 0,
            'promedio_general'         => 0,
            'total_docentes'           => 0,
            'total_materias'           => 0,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Estado del proceso CUP (flujo secuencial)
    // ─────────────────────────────────────────────────────────────────────────

    private function getEstadoProceso(): array
    {
        $preinscripciones = Postulante::count();

        $inscritos = Postulante::where(
            DB::raw('upper(trim(estado_preinscripcion))'), 'INSCRITO'
        )->count();

        // Evaluados: postulantes que tienen al menos 1 nota en examen_cup
        $evaluados = DB::table('examen_cup')->distinct('postulante_id')->count('postulante_id');

        // Con las 4 materias completas
        $conCuatroMaterias = DB::table('examen_cup AS ec')
            ->select('ec.postulante_id')
            ->groupBy('ec.postulante_id')
            ->havingRaw('COUNT(DISTINCT ec.materia_id) >= 4')
            ->get()
            ->count();

        $admitidos = AdmisionCUP::whereIn('estado_admision', [
            'ADMITIDO_PRIMERA_OPCION',
            'ADMITIDO_SEGUNDA_OPCION',
        ])->count();

        return [
            'preinscripciones' => $preinscripciones,
            'inscritos'        => $inscritos,
            'evaluados'        => $evaluados,
            'evaluados_completos' => $conCuatroMaterias,
            'admitidos'        => $admitidos,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Distribución académica (para gráfico donut)
    // ─────────────────────────────────────────────────────────────────────────

    private function getDistribucionAcademica(): array
    {
        $aprobados  = AdmisionCUP::where('estado_academico_cup', 'APROBADO')->count();
        $reprobados = AdmisionCUP::where('estado_academico_cup', 'REPROBADO')->count();

        // Also check fallback to examen_cup if no admissions are processed
        if ($aprobados === 0 && $reprobados === 0) {
            $aprobados = DB::table('examen_cup')
                ->select('postulante_id')
                ->where('estado_materia', 'APROBADO')
                ->groupBy('postulante_id')
                ->havingRaw('COUNT(DISTINCT materia_id) >= 4')
                ->get()
                ->count();

            $reprobados = DB::table('examen_cup')
                ->where('estado_materia', 'REPROBADO')
                ->distinct('postulante_id')
                ->count('postulante_id');
        }

        $inscritos = Postulante::where('estado_preinscripcion', 'INSCRITO')->count();
        $pendientes = max(0, $inscritos - $aprobados - $reprobados);

        return [
            ['estado' => 'Aprobados',  'total' => $aprobados,  'color' => '#10b981'],
            ['estado' => 'Reprobados', 'total' => $reprobados, 'color' => '#ef4444'],
            ['estado' => 'Pendientes', 'total' => $pendientes, 'color' => '#f59e0b'],
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Demanda por carrera (para gráfico de barras)
    // ─────────────────────────────────────────────────────────────────────────

    private function getDemandaCarreras(): array
    {
        try {
            $resultados = Postulante::select(
                'primera_carrera_id',
                DB::raw('COUNT(*) as total')
            )
                ->whereNotNull('primera_carrera_id')
                ->groupBy('primera_carrera_id')
                ->with('primeraCarrera:id,nombre')
                ->get();

            return $resultados->map(function ($row) {
                return [
                    'carrera' => $row->primeraCarrera?->nombre ?? 'Sin nombre',
                    'total'   => (int) $row->total,
                ];
            })->values()->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cupos por carrera
    // ─────────────────────────────────────────────────────────────────────────

    private function getCuposPorCarrera(): array
    {
        try {
            $carreras = Carrera::all();

            return $carreras->map(function ($c) {
                $admitidos = AdmisionCUP::where('carrera_asignada_id', $c->id)
                    ->whereIn('estado_admision', [
                        'ADMITIDO_PRIMERA_OPCION',
                        'ADMITIDO_SEGUNDA_OPCION',
                    ])
                    ->count();

                $cuposTotales   = (int) ($c->cupos_totales ?? 0);
                $cuposOcupados  = (int) ($c->cupos_ocupados ?? $admitidos);
                $disponibles    = max(0, $cuposTotales - $cuposOcupados);
                $ocupacion      = $cuposTotales > 0
                    ? round(($cuposOcupados / $cuposTotales) * 100, 1)
                    : 0;

                return [
                    'carrera'    => $c->nombre,
                    'cupos'      => $cuposTotales,
                    'admitidos'  => $admitidos,
                    'disponibles' => $disponibles,
                    'ocupacion'  => $ocupacion,
                ];
            })->values()->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Estadísticas por materia
    // ─────────────────────────────────────────────────────────────────────────

    private function getEstadisticasMateria(): array
    {
        try {
            $materias = Materia::where('estado', 'ACTIVA')->get();

            return $materias->map(function ($m) {
                $evaluados  = DB::table('examen_cup')->where('materia_id', $m->id)->count();
                $aprobados  = DB::table('examen_cup')
                    ->where('materia_id', $m->id)
                    ->where(DB::raw('upper(trim(estado_materia))'), 'APROBADO')
                    ->count();
                $reprobados = DB::table('examen_cup')
                    ->where('materia_id', $m->id)
                    ->where(DB::raw('upper(trim(estado_materia))'), 'REPROBADO')
                    ->count();
                $promedio   = DB::table('examen_cup')
                    ->where('materia_id', $m->id)
                    ->whereNotNull('nota_final')
                    ->avg('nota_final');

                $pctAprobacion = $evaluados > 0
                    ? round(($aprobados / $evaluados) * 100, 1)
                    : 0;

                return [
                    'materia'              => $m->nombre,
                    'evaluados'            => $evaluados,
                    'aprobados'            => $aprobados,
                    'reprobados'           => $reprobados,
                    'promedio'             => $promedio !== null ? round((float) $promedio, 2) : 0,
                    'porcentaje_aprobacion' => $pctAprobacion,
                ];
            })->values()->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Rendimiento por grupo
    // ─────────────────────────────────────────────────────────────────────────

    private function getRendimientoGrupos(): array
    {
        try {
            $grupos = GrupoCup::withCount('postulantes')
                ->with(['postulantes.admisionCup'])
                ->get();

            return $grupos->map(function ($g) {
                $total     = $g->postulantes_count;
                $aprobados = 0;
                $reprobados = 0;
                $pendientes = 0;

                foreach ($g->postulantes as $p) {
                    $estado = $p->admisionCup?->estado_academico_cup;
                    
                    if (!$estado || $estado === 'PENDIENTE') {
                        $examCount = DB::table('examen_cup')->where('postulante_id', $p->id)->count();
                        if ($examCount >= 4) {
                            $anyFailed = DB::table('examen_cup')
                                ->where('postulante_id', $p->id)
                                ->where('estado_materia', 'REPROBADO')
                                ->exists();
                            $estado = $anyFailed ? 'REPROBADO' : 'APROBADO';
                        } else {
                            $estado = 'PENDIENTE';
                        }
                    }

                    if ($estado === 'APROBADO') {
                        $aprobados++;
                    } elseif ($estado === 'REPROBADO') {
                        $reprobados++;
                    } else {
                        $pendientes++;
                    }
                }

                $pctAprobacion = $total > 0
                    ? round(($aprobados / $total) * 100, 2)
                    : 0;

                return [
                    'grupo'                => $g->nombre,
                    'codigo'               => $g->codigo ?? '',
                    'estado'               => $g->estado,
                    'total_estudiantes'    => $total,
                    'aprobados'            => $aprobados,
                    'reprobados'           => $reprobados,
                    'pendientes'           => $pendientes,
                    'porcentaje_aprobacion' => $pctAprobacion,
                ];
            })->values()->toArray();
        } catch (\Throwable $e) {
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Alertas inteligentes
    // ─────────────────────────────────────────────────────────────────────────

    private function getAlertas(): array
    {
        $alertas = [];

        try {
            // 1. Sin grupos habilitados
            $gruposActivos = GrupoCup::whereIn('estado', ['ACTIVO', 'HABILITADO'])->count();
            if ($gruposActivos === 0) {
                $alertas[] = [
                    'tipo'    => 'danger',
                    'titulo'  => 'Sin grupos habilitados',
                    'mensaje' => 'No existen grupos CUP habilitados en el sistema.',
                ];
            }

            // 2. Postulantes inscritos sin grupo asignado
            $sinGrupo = Postulante::where(
                DB::raw('upper(trim(estado_preinscripcion))'), 'INSCRITO'
            )->whereDoesntHave('gruposCup')->count();

            if ($sinGrupo > 0) {
                $alertas[] = [
                    'tipo'    => 'warning',
                    'titulo'  => 'Postulantes sin grupo',
                    'mensaje' => "Existen {$sinGrupo} postulante(s) inscrito(s) que aún no fueron asignados a un grupo.",
                ];
            }

            // 3. Muchos pendientes académicos
            $totalInscritos = Postulante::where(
                DB::raw('upper(trim(estado_preinscripcion))'), 'INSCRITO'
            )->count();
            
            // Re-calculate approved / reprobados with fallback to align count
            $totalAprobados = AdmisionCUP::where('estado_academico_cup', 'APROBADO')->count();
            $totalReprobados = AdmisionCUP::where('estado_academico_cup', 'REPROBADO')->count();
            if ($totalAprobados === 0 && $totalReprobados === 0) {
                $totalAprobados = DB::table('examen_cup')
                    ->select('postulante_id')
                    ->where('estado_materia', 'APROBADO')
                    ->groupBy('postulante_id')
                    ->havingRaw('COUNT(DISTINCT materia_id) >= 4')
                    ->get()
                    ->count();

                $totalReprobados = DB::table('examen_cup')
                    ->where('estado_materia', 'REPROBADO')
                    ->distinct('postulante_id')
                    ->count('postulante_id');
            }
            $pendientes = max(0, $totalInscritos - $totalAprobados - $totalReprobados);

            if ($totalInscritos > 0 && $pendientes > 0) {
                $pctPendientes = round(($pendientes / $totalInscritos) * 100);
                if ($pctPendientes >= 50) {
                    $alertas[] = [
                        'tipo'    => 'info',
                        'titulo'  => 'Evaluaciones pendientes',
                        'mensaje' => "El {$pctPendientes}% de los postulantes aún no tiene sus 4 materias evaluadas.",
                    ];
                }
            }

            // 4. Aprobados sin cupo
            $sinCupo = AdmisionCUP::where('estado_admision', 'APROBADO_SIN_CUPO')->count();
            if ($sinCupo > 0) {
                $alertas[] = [
                    'tipo'    => 'warning',
                    'titulo'  => 'Aprobados sin cupo',
                    'mensaje' => "Existen {$sinCupo} postulante(s) aprobado(s) que no alcanzaron cupo en ninguna carrera.",
                ];
            }

            // 5. Cupos disponibles
            $cuposDisponibles = Carrera::where('estado', 'ACTIVA')
                ->sum(DB::raw('GREATEST(0, cupos_totales - cupos_ocupados)'));

            if ($cuposDisponibles > 0) {
                $alertas[] = [
                    'tipo'    => 'success',
                    'titulo'  => 'Cupos disponibles',
                    'mensaje' => "Existen {$cuposDisponibles} cupo(s) disponible(s) en carreras activas.",
                ];
            }
        } catch (\Throwable $e) {
            $alertas[] = [
                'tipo'    => 'info',
                'titulo'  => 'Alertas no disponibles',
                'mensaje' => 'No se pudieron calcular las alertas en este momento: ' . $e->getMessage(),
            ];
        }

        return $alertas;
    }
}
