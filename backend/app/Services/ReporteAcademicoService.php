<?php

namespace App\Services;

use App\Models\Postulante;
use App\Models\AdmisionCUP;
use App\Models\GrupoCup;
use App\Models\Materia;
use App\Models\ExamenCUP;
use App\Models\AsignacionDocenteGrupo;
use App\Models\Docente;
use App\Models\Carrera;
use Illuminate\Support\Facades\DB;

class ReporteAcademicoService
{
    /**
     * Devuelve el resumen estadístico general para las tarjetas superiores.
     */
    public function getResumen(): array
    {
        $totalPostulantes = Postulante::count();
        $totalInscritos = Postulante::where('estado_preinscripcion', 'INSCRITO')->count();
        
        $totalAprobados = AdmisionCUP::where('estado_academico_cup', 'APROBADO')->count();
        $totalReprobados = AdmisionCUP::where('estado_academico_cup', 'REPROBADO')->count();
        
        // Pendientes: inscritos que aún no han sido procesados en admisiones_cup o tienen estado PENDIENTE
        $totalPendientes = Postulante::where('estado_preinscripcion', 'INSCRITO')
            ->whereDoesntHave('admisionCup')
            ->count() + AdmisionCUP::where('estado_academico_cup', 'PENDIENTE')->count();
            
        $totalGruposHabilitados = GrupoCup::where('estado', 'ACTIVO')->count();
        $promedioGeneral = AdmisionCUP::whereNotNull('promedio_final_cup')->avg('promedio_final_cup');
        $totalDocentes = Docente::where('estado_docente', 'HABILITADO')->count();
        $totalMaterias = Materia::where('estado', 'ACTIVA')->count();

        return [
            'total_postulantes' => $totalPostulantes,
            'total_inscritos' => $totalInscritos,
            'total_aprobados' => $totalAprobados,
            'total_reprobados' => $totalReprobados,
            'total_pendientes' => $totalPendientes,
            'total_grupos_habilitados' => $totalGruposHabilitados,
            'promedio_general_cup' => $promedioGeneral !== null ? round((float) $promedioGeneral, 2) : 0,
            'total_docentes' => $totalDocentes,
            'total_materias' => $totalMaterias,
        ];
    }

    /**
     * Consulta base para el Reporte 1: Lista general de postulantes.
     */
    public function queryListaGeneralPostulantes(array $filters)
    {
        $query = Postulante::query()->with(['primeraCarrera', 'segundaCarrera', 'gruposCup', 'admisionCup']);

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('ci', 'like', "%{$search}%")
                  ->orWhere('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%")
                  ->orWhere('correo', 'like', "%{$search}%")
                  ->orWhere(DB::raw("lower(nombres || ' ' || apellidos)"), 'like', '%' . strtolower($search) . '%');
            });
        }

        if (!empty($filters['grupo_id'])) {
            $query->whereHas('gruposCup', fn ($q) => $q->where('grupos_cup.id', $filters['grupo_id']));
        }

        if (!empty($filters['materia_id'])) {
            $query->whereHas('examenesCup', fn ($q) => $q->where('materia_id', $filters['materia_id']));
        }

        if (!empty($filters['carrera_id'])) {
            $carreraId = $filters['carrera_id'];
            $query->where(function ($q) use ($carreraId) {
                $q->where('primera_carrera_id', $carreraId)
                  ->orWhere('segunda_carrera_id', $carreraId);
            });
        }

        if (!empty($filters['estado_admision'])) {
            $query->whereHas('admisionCup', fn ($q) => $q->where('estado_admision', $filters['estado_admision']));
        }

        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Formatea datos para el Reporte 1.
     */
    public function formatListaGeneralPostulantes($postulantes): array
    {
        return collect($postulantes)->map(function ($p) {
            return [
                'id' => $p->id,
                'ci' => $p->ci,
                'nombre_completo' => trim($p->nombres . ' ' . $p->apellidos),
                'correo' => $p->correo,
                'primera_carrera' => $p->primeraCarrera?->nombre ?? 'N/A',
                'segunda_carrera' => $p->segundaCarrera?->nombre ?? 'N/A',
                'estado' => $p->estado_preinscripcion,
                'grupo_asignado' => $p->gruposCup->first()?->nombre ?? 'Sin grupo',
                'fecha_inscripcion' => $p->fecha_aprobacion ? $p->fecha_aprobacion->format('Y-m-d') : ($p->created_at ? $p->created_at->format('Y-m-d') : 'N/A'),
            ];
        })->all();
    }

    /**
     * Consulta base para el Reporte 2: Postulantes aprobados.
     */
    public function queryPostulantesAprobados(array $filters)
    {
        $query = AdmisionCUP::query()
            ->where('estado_academico_cup', 'APROBADO')
            ->whereHas('postulante')
            ->with(['postulante.gruposCup', 'primeraCarrera', 'segundaCarrera', 'carreraAsignada']);

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->whereHas('postulante', function ($q) use ($search) {
                $q->where('ci', 'like', "%{$search}%")
                  ->orWhere('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%")
                  ->orWhere('correo', 'like', "%{$search}%")
                  ->orWhere(DB::raw("lower(nombres || ' ' || apellidos)"), 'like', '%' . strtolower($search) . '%');
            });
        }

        if (!empty($filters['grupo_id'])) {
            $query->whereHas('postulante.gruposCup', fn ($q) => $q->where('grupos_cup.id', $filters['grupo_id']));
        }

        if (!empty($filters['materia_id'])) {
            $query->whereHas('postulante.examenesCup', fn ($q) => $q->where('materia_id', $filters['materia_id']));
        }

        if (!empty($filters['carrera_id'])) {
            $query->where('carrera_asignada_id', $filters['carrera_id']);
        }

        if (!empty($filters['estado_admision'])) {
            $query->where('estado_admision', $filters['estado_admision']);
        }

        return $query->orderBy('posicion_ranking', 'asc');
    }

    /**
     * Formatea datos para el Reporte 2.
     */
    public function formatPostulantesAprobados($admisiones): array
    {
        return collect($admisiones)->map(function ($a) {
            return [
                'ci' => $a->postulante?->ci ?? 'N/A',
                'nombre_completo' => $a->postulante ? trim($a->postulante->nombres . ' ' . $a->postulante->apellidos) : 'N/A',
                'promedio_final_cup' => $a->promedio_final_cup !== null ? floatval($a->promedio_final_cup) : 0.0,
                'primera_carrera' => $a->primeraCarrera?->nombre ?? 'N/A',
                'segunda_carrera' => $a->segundaCarrera?->nombre ?? 'N/A',
                'carrera_asignada' => $a->carreraAsignada?->nombre ?? 'Sin cupo asignado',
                'estado_admision' => $a->estado_admision,
                'ranking' => $a->posicion_ranking ?? 'N/A',
                'grupo' => $a->postulante?->gruposCup->first()?->nombre ?? 'Sin grupo',
            ];
        })->all();
    }

    /**
     * Consulta base para el Reporte 3: Postulantes reprobados.
     */
    public function queryPostulantesReprobados(array $filters)
    {
        $query = AdmisionCUP::query()
            ->where('estado_academico_cup', 'REPROBADO')
            ->whereHas('postulante')
            ->with(['postulante.gruposCup', 'postulante.examenesCup.materia', 'primeraCarrera', 'segundaCarrera']);

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->whereHas('postulante', function ($q) use ($search) {
                $q->where('ci', 'like', "%{$search}%")
                  ->orWhere('nombres', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%")
                  ->orWhere('correo', 'like', "%{$search}%")
                  ->orWhere(DB::raw("lower(nombres || ' ' || apellidos)"), 'like', '%' . strtolower($search) . '%');
            });
        }

        if (!empty($filters['grupo_id'])) {
            $query->whereHas('postulante.gruposCup', fn ($q) => $q->where('grupos_cup.id', $filters['grupo_id']));
        }

        if (!empty($filters['materia_id'])) {
            $query->whereHas('postulante.examenesCup', fn ($q) => $q->where('materia_id', $filters['materia_id']));
        }

        if (!empty($filters['carrera_id'])) {
            $carreraId = $filters['carrera_id'];
            $query->where(function ($q) use ($carreraId) {
                $q->where('primera_carrera_id', $carreraId)
                  ->orWhere('segunda_carrera_id', $carreraId);
            });
        }

        if (!empty($filters['estado_admision'])) {
            $query->where('estado_admision', $filters['estado_admision']);
        }

        return $query->orderBy('promedio_final_cup', 'desc');
    }

    /**
     * Formatea datos para el Reporte 3.
     */
    public function formatPostulantesReprobados($admisiones): array
    {
        return collect($admisiones)->map(function ($a) {
            $failedExams = $a->postulante ? $a->postulante->examenesCup->filter(function ($e) {
                return $e->estado_materia === 'REPROBADO' ||
                    $e->parcial_1 < 60 ||
                    $e->parcial_2 < 60 ||
                    $e->parcial_3 < 60 ||
                    $e->nota_final < 60;
            }) : collect();
            
            $materiasReprobadas = $failedExams->map(fn ($e) => $e->materia?->nombre)->filter()->unique()->implode(', ');

            return [
                'ci' => $a->postulante?->ci ?? 'N/A',
                'nombre_completo' => $a->postulante ? trim($a->postulante->nombres . ' ' . $a->postulante->apellidos) : 'N/A',
                'promedio_final_cup' => $a->promedio_final_cup !== null ? floatval($a->promedio_final_cup) : 0.0,
                'materias_reprobadas' => $materiasReprobadas ?: 'Ninguna (Notas incompletas)',
                'grupo' => $a->postulante?->gruposCup->first()?->nombre ?? 'Sin grupo',
                'estado_admision' => $a->estado_admision,
            ];
        })->all();
    }

    /**
     * Obtiene el reporte 4: Promedios generales.
     */
    public function getPromediosGenerales(array $filters): array
    {
        $query = AdmisionCUP::query()->whereHas('postulante');

        if (!empty($filters['grupo_id'])) {
            $query->whereHas('postulante.gruposCup', fn ($q) => $q->where('grupos_cup.id', $filters['grupo_id']));
        }
        if (!empty($filters['materia_id'])) {
            $query->whereHas('postulante.examenesCup', fn ($q) => $q->where('materia_id', $filters['materia_id']));
        }
        if (!empty($filters['carrera_id'])) {
            $carreraId = $filters['carrera_id'];
            $query->where(function ($q) use ($carreraId) {
                $q->where('primera_carrera_id', $carreraId)
                  ->orWhere('segunda_carrera_id', $carreraId)
                  ->orWhere('carrera_asignada_id', $carreraId);
            });
        }

        $avg = $query->clone()->whereNotNull('promedio_final_cup')->avg('promedio_final_cup');
        $max = $query->clone()->max('promedio_final_cup');
        $min = $query->clone()->min('promedio_final_cup');

        $totalEvaluados = $query->clone()->whereIn('estado_academico_cup', ['APROBADO', 'REPROBADO'])->count();
        $totalAprobados = $query->clone()->where('estado_academico_cup', 'APROBADO')->count();
        $totalReprobados = $query->clone()->where('estado_academico_cup', 'REPROBADO')->count();
        $totalPendientes = $query->clone()->where('estado_academico_cup', 'PENDIENTE')->count();

        // Lista de promedios por grupo
        $gruposData = [];
        $grupos = GrupoCup::with(['postulantes.admisionCup'])->get();
        foreach ($grupos as $g) {
            $filteredPostulantes = $g->postulantes->filter(function ($p) use ($filters) {
                if (!empty($filters['carrera_id'])) {
                    if ($p->primera_carrera_id != $filters['carrera_id'] && 
                        $p->segunda_carrera_id != $filters['carrera_id']) {
                        return false;
                    }
                }
                if (!empty($filters['materia_id'])) {
                    if (!$p->examenesCup()->where('materia_id', $filters['materia_id'])->exists()) {
                        return false;
                    }
                }
                return true;
            });

            if ($filteredPostulantes->isEmpty()) {
                continue;
            }

            $gAvg = $filteredPostulantes->avg(fn ($p) => $p->admisionCup?->promedio_final_cup);
            $gAprobados = $filteredPostulantes->filter(fn ($p) => $p->admisionCup?->estado_academico_cup === 'APROBADO')->count();
            $gReprobados = $filteredPostulantes->filter(fn ($p) => $p->admisionCup?->estado_academico_cup === 'REPROBADO')->count();
            $gPendientes = $filteredPostulantes->filter(fn ($p) => !$p->admisionCup || $p->admisionCup->estado_academico_cup === 'PENDIENTE')->count();

            $gruposData[] = [
                'grupo' => $g->nombre,
                'promedio_grupo' => $gAvg !== null ? round((float) $gAvg, 2) : 0,
                'aprobados' => $gAprobados,
                'reprobados' => $gReprobados,
                'pendientes' => $gPendientes,
            ];
        }

        // Lista de promedios por carrera asignada o preferida
        $carrerasData = [];
        $carreras = Carrera::all();
        foreach ($carreras as $c) {
            $cQuery = AdmisionCUP::query()->where(function ($q) use ($c) {
                $q->where('carrera_asignada_id', $c->id)
                  ->orWhere('primera_carrera_id', $c->id)
                  ->orWhere('segunda_carrera_id', $c->id);
            });

            if (!empty($filters['grupo_id'])) {
                $cQuery->whereHas('postulante.gruposCup', fn ($q) => $q->where('grupos_cup.id', $filters['grupo_id']));
            }
            if (!empty($filters['materia_id'])) {
                $cQuery->whereHas('postulante.examenesCup', fn ($q) => $q->where('materia_id', $filters['materia_id']));
            }

            $cAvg = $cQuery->clone()->where('carrera_asignada_id', $c->id)->whereNotNull('promedio_final_cup')->avg('promedio_final_cup');
            $admitidos = $cQuery->clone()->where('carrera_asignada_id', $c->id)->count();
            $aprobadosSinCupo = $cQuery->clone()->where('estado_admision', 'APROBADO_SIN_CUPO')->count();

            $carrerasData[] = [
                'carrera' => $c->nombre,
                'promedio' => $cAvg !== null ? round((float) $cAvg, 2) : 0,
                'admitidos' => $admitidos,
                'aprobados_sin_cupo' => $aprobadosSinCupo,
            ];
        }

        return [
            'promedio_general_cup' => $avg !== null ? round((float) $avg, 2) : 0.0,
            'promedio_mas_alto' => $max !== null ? floatval($max) : 0.0,
            'promedio_mas_bajo' => $min !== null ? floatval($min) : 0.0,
            'total_evaluados' => $totalEvaluados,
            'total_aprobados' => $totalAprobados,
            'total_reprobados' => $totalReprobados,
            'total_pendientes' => $totalPendientes,
            'grupos' => $gruposData,
            'carreras' => $carrerasData,
        ];
    }

    /**
     * Consulta base para el Reporte 5: Cantidad de grupos habilitados.
     */
    public function queryGruposHabilitados(array $filters)
    {
        $query = GrupoCup::query()->withCount('postulantes');

        if (!empty($filters['grupo_id'])) {
            $query->where('id', $filters['grupo_id']);
        }

        if (!empty($filters['materia_id'])) {
            $query->whereHas('asignacionesDocentes', fn ($q) => $q->where('materia_id', $filters['materia_id']));
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('codigo', 'asc');
    }

    /**
     * Devuelve el resumen acumulado de grupos habilitados.
     */
    public function getResumenGruposHabilitados(array $filters): array
    {
        $totalGruposHabilitados = GrupoCup::where('estado', 'ACTIVO')->count();
        $totalGrupos = GrupoCup::count();
        
        $totalEstudiantesAsignados = DB::table('grupo_postulante')->count();
        $capacidadTotal = GrupoCup::sum('capacidad_maxima');

        return [
            'total_grupos_habilitados' => $totalGruposHabilitados,
            'total_grupos' => $totalGrupos,
            'total_estudiantes_asignados' => $totalEstudiantesAsignados,
            'capacidad_total' => (int) $capacidadTotal,
        ];
    }

    /**
     * Formatea datos para el Reporte 5.
     */
    public function formatGruposHabilitados($grupos): array
    {
        return collect($grupos)->map(function ($g) {
            return [
                'codigo' => $g->codigo,
                'nombre' => $g->nombre,
                'capacidad_maxima' => intval($g->capacidad_maxima),
                'estudiantes_asignados' => intval($g->postulantes_count),
                'estado' => $g->estado,
                'fecha_creacion' => $g->created_at ? $g->created_at->format('Y-m-d') : 'N/A',
            ];
        })->all();
    }

    /**
     * Consulta base para el Reporte 6: Estadísticas por materia.
     */
    public function queryEstadisticasMateria(array $filters)
    {
        $query = Materia::query()->where('estado', 'ACTIVA');

        if (!empty($filters['materia_id'])) {
            $query->where('id', $filters['materia_id']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where('nombre', 'like', "%{$search}%");
        }

        return $query->orderBy('nombre', 'asc');
    }

    /**
     * Formatea estadísticas detalladas para el Reporte 6.
     */
    public function formatEstadisticasMateria($materias, array $filters): array
    {
        return collect($materias)->map(function ($m) use ($filters) {
            $examQuery = ExamenCUP::where('materia_id', $m->id);

            if (!empty($filters['grupo_id'])) {
                $examQuery->where('grupo_id', $filters['grupo_id']);
            }

            if (!empty($filters['carrera_id'])) {
                $carreraId = $filters['carrera_id'];
                $examQuery->whereHas('postulante', function ($q) use ($carreraId) {
                    $q->where('primera_carrera_id', $carreraId)
                      ->orWhere('segunda_carrera_id', $carreraId);
                });
            }

            $evaluados = $examQuery->clone()->count();
            $aprobados = $examQuery->clone()->where('estado_materia', 'APROBADO')->count();
            $reprobados = $examQuery->clone()->where('estado_materia', 'REPROBADO')->count();

            $avg = $examQuery->clone()->avg('nota_final');
            $max = $examQuery->clone()->max('nota_final');
            $min = $examQuery->clone()->min('nota_final');

            // Pendientes: Estudiantes asignados a un grupo que aún no tienen calificaciones registradas en esta materia
            $totalAsignadosQuery = DB::table('grupo_postulante');
            if (!empty($filters['grupo_id'])) {
                $totalAsignadosQuery->where('grupo_id', $filters['grupo_id']);
            }
            $totalAsignadosCount = $totalAsignadosQuery->count();
            $pendientes = max(0, $totalAsignadosCount - $evaluados);

            $pctAprobacion = $evaluados > 0 ? round(($aprobados / $evaluados) * 100, 2) : 0;

            return [
                'materia' => $m->nombre,
                'evaluados' => $evaluados,
                'aprobados' => $aprobados,
                'reprobados' => $reprobados,
                'pendientes' => $pendientes,
                'promedio_materia' => $avg !== null ? round((float) $avg, 2) : 0,
                'nota_maxima' => $max !== null ? round((float) $max, 2) : 0,
                'nota_minima' => $min !== null ? round((float) $min, 2) : 0,
                'porcentaje_aprobacion' => $pctAprobacion,
            ];
        })->all();
    }

    /**
     * Consulta base para el Reporte 7: Docentes por grupos.
     */
    public function queryDocentesPorGrupo(array $filters)
    {
        $query = AsignacionDocenteGrupo::query()
            ->with(['grupo', 'materia', 'docente.user', 'cargasHorarias.aula']);

        if (!empty($filters['grupo_id'])) {
            $query->where('grupo_id', $filters['grupo_id']);
        }

        if (!empty($filters['materia_id'])) {
            $query->where('materia_id', $filters['materia_id']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->whereHas('docente', function ($q) use ($search) {
                $q->where('ci', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($u) use ($search) {
                      $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        return $query->orderBy('grupo_id', 'asc')->orderBy('materia_id', 'asc');
    }

    /**
     * Formatea datos para el Reporte 7 expandiendo las asignaciones a cargas horarias.
     */
    public function formatDocentesPorGrupo($asignaciones): array
    {
        $results = [];
        foreach ($asignaciones as $asig) {
            $cargas = $asig->cargasHorarias;
            $docenteNombre = $asig->docente && $asig->docente->user 
                ? $asig->docente->user->name 
                : ($asig->docente ? trim($asig->docente->profesion . ' ' . $asig->docente->ci) : 'Sin Docente');
            $correoDocente = $asig->docente && $asig->docente->user ? $asig->docente->user->email : 'N/A';
            
            if ($cargas->isEmpty()) {
                $results[] = [
                    'grupo' => $asig->grupo?->nombre ?? 'N/A',
                    'materia' => $asig->materia?->nombre ?? 'N/A',
                    'docente' => $docenteNombre,
                    'correo_docente' => $correoDocente,
                    'aula' => 'Sin asignar',
                    'dia' => 'Sin asignar',
                    'hora_inicio' => 'Sin asignar',
                    'hora_fin' => 'Sin asignar',
                    'turno' => 'Sin asignar',
                    'estado_asignacion' => $asig->estado ?? 'INACTIVO'
                ];
            } else {
                foreach ($cargas as $carga) {
                    $results[] = [
                        'grupo' => $asig->grupo?->nombre ?? 'N/A',
                        'materia' => $asig->materia?->nombre ?? 'N/A',
                        'docente' => $docenteNombre,
                        'correo_docente' => $correoDocente,
                        'aula' => $carga->aula?->nombre ?? 'Sin asignar',
                        'dia' => $carga->dia_semana ?? 'Sin asignar',
                        'hora_inicio' => $carga->hora_inicio ?? 'Sin asignar',
                        'hora_fin' => $carga->hora_fin ?? 'Sin asignar',
                        'turno' => $carga->turno ?? 'Sin asignar',
                        'estado_asignacion' => $asig->estado ?? 'INACTIVO'
                    ];
                }
            }
        }
        return $results;
    }

    /**
     * Consulta base para el Reporte 8: Grupos con mayor cantidad de aprobados.
     */
    public function queryGruposMayorAprobados(array $filters)
    {
        $query = GrupoCup::query()->with(['postulantes.admisionCup', 'postulantes.examenesCup']);

        if (!empty($filters['grupo_id'])) {
            $query->where('id', $filters['grupo_id']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    /**
     * Formatea estadísticas detalladas para el Reporte 8.
     */
    public function formatGruposMayorAprobados($grupos, array $filters): array
    {
        $results = [];
        foreach ($grupos as $grupo) {
            $totalEstudiantes = $grupo->postulantes->count();
            $aprobados = 0;
            $reprobados = 0;
            $pendientes = 0;
            
            foreach ($grupo->postulantes as $postulante) {
                // Filtro carrera si aplica
                if (!empty($filters['carrera_id'])) {
                    if ($postulante->primera_carrera_id != $filters['carrera_id'] && 
                        $postulante->segunda_carrera_id != $filters['carrera_id']) {
                        continue;
                    }
                }

                $admision = $postulante->admisionCup;
                $estado = $admision ? $admision->estado_academico_cup : null;
                
                // Si la admisión no se ha procesado, calcular dinámicamente según notas de exámenes
                if (!$estado) {
                    $examenes = $postulante->examenesCup;
                    if ($examenes->count() < 4) {
                        $estado = 'PENDIENTE';
                    } else {
                        $todasAprobadas = $examenes->every(function ($e) {
                            return strtoupper($e->estado_materia) === 'APROBADO';
                        });
                        $estado = $todasAprobadas ? 'APROBADO' : 'REPROBADO';
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
            
            $porcentajeAprobacion = $totalEstudiantes > 0 
                ? round(($aprobados / $totalEstudiantes) * 100, 2) 
                : 0;
                
            $results[] = [
                'grupo' => $grupo->nombre,
                'total_estudiantes' => $totalEstudiantes,
                'aprobados' => $aprobados,
                'reprobados' => $reprobados,
                'pendientes' => $pendientes,
                'porcentaje_aprobacion' => $porcentajeAprobacion
            ];
        }
        
        // Ordena grupos descendente por aprobados
        usort($results, fn ($a, $b) => $b['aprobados'] <=> $a['aprobados']);
        
        return $results;
    }
}
