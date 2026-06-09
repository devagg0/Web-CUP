<?php

namespace App\Services;

use App\Models\AdmisionCUP;
use App\Models\Carrera;
use App\Models\Postulante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AdmisionCUPService
{
    /**
     * Calcula el resultado académico de un postulante según sus notas de CU14.
     */
    public function calcularResultadoAcademico(Postulante $postulante): array
    {
        $examenes = $postulante->examenesCup;

        if ($examenes->count() < 4) {
            return [
                'promedio_final_cup' => null,
                'estado_academico_cup' => 'PENDIENTE',
            ];
        }

        // Calcula el promedio de las materias calificadas
        $promedio = round($examenes->avg('nota_final'), 2);

        // Verifica si aprobó todas las materias
        $todasAprobadas = $examenes->every(fn ($examen) => $examen->estado_materia === 'APROBADO');

        return [
            'promedio_final_cup' => $promedio,
            'estado_academico_cup' => $todasAprobadas ? 'APROBADO' : 'REPROBADO',
        ];
    }

    /**
     * Procesa las admisiones por cupo de forma transaccional e idempotente.
     */
    public function procesarAdmision(): array
    {
        return DB::transaction(function () {
            // 1. Validar que existan postulantes inscritos
            $postulantes = Postulante::where('estado_preinscripcion', 'INSCRITO')
                ->with(['examenesCup', 'primeraCarrera', 'segundaCarrera'])
                ->get();

            if ($postulantes->isEmpty()) {
                throw new RuntimeException('No existen postulantes inscritos para procesar la admisión.');
            }

            // 2. Validar que existan carreras con cupos configurados
            $carrerasActivas = Carrera::where('estado', 'ACTIVA')->get();
            if ($carrerasActivas->isEmpty() || $carrerasActivas->sum('cupos_totales') === 0) {
                throw new RuntimeException('No existen carreras con cupos configurados.');
            }

            // 3. Limpiar admisiones existentes de postulantes que ya no están inscritos (idempotencia)
            $postulanteIds = $postulantes->pluck('id')->toArray();
            AdmisionCUP::whereNotIn('postulante_id', $postulanteIds)->delete();

            // 4. Calcular el resultado académico para cada postulante
            $aprobados = [];
            $reprobados = [];
            $pendientes = [];

            foreach ($postulantes as $postulante) {
                $resultado = $this->calcularResultadoAcademico($postulante);
                $item = [
                    'postulante' => $postulante,
                    'promedio_final_cup' => $resultado['promedio_final_cup'],
                    'estado_academico_cup' => $resultado['estado_academico_cup'],
                ];

                if ($resultado['estado_academico_cup'] === 'APROBADO') {
                    $aprobados[] = $item;
                } elseif ($resultado['estado_academico_cup'] === 'REPROBADO') {
                    $reprobados[] = $item;
                } else {
                    $pendientes[] = $item;
                }
            }

            // 5. Ordenar los APROBADOS por promedio descendente y por ID ascendente en caso de empate
            $aprobadosSorted = collect($aprobados)->sort(function ($a, $b) {
                if ($a['promedio_final_cup'] == $b['promedio_final_cup']) {
                    return $a['postulante']->id <=> $b['postulante']->id;
                }
                return $b['promedio_final_cup'] <=> $a['promedio_final_cup'];
            })->values();

            // 6. Crear mapa local de cupos por carrera (usando cupos_totales)
            $cuposDisponiblesMap = $carrerasActivas->pluck('cupos_totales', 'id')->toArray();

            // 7. Procesar aprobados por ranking
            foreach ($aprobadosSorted as $index => $item) {
                $postulante = $item['postulante'];
                $primeraCarreraId = $postulante->primera_carrera_id;
                $segundaCarreraId = $postulante->segunda_carrera_id;

                $carreraAsignadaId = null;
                $tipoAdmision = null;
                $estadoAdmision = null;
                $observacion = "Procesado académicamente como APROBADO. ";

                // Intento 1: Primera carrera
                if (empty($primeraCarreraId)) {
                    $observacion .= "No tiene registrada primera carrera de preferencia. ";
                } elseif (!isset($cuposDisponiblesMap[$primeraCarreraId])) {
                    $observacion .= "La primera carrera seleccionada no está activa o no existe. ";
                } elseif ($cuposDisponiblesMap[$primeraCarreraId] > 0) {
                    $carreraAsignadaId = $primeraCarreraId;
                    $tipoAdmision = 'PRIMERA_OPCION';
                    $estadoAdmision = 'ADMITIDO_PRIMERA_OPCION';
                    $cuposDisponiblesMap[$primeraCarreraId]--;
                    $observacion .= "Admitido en su primera opción: " . ($postulante->primeraCarrera?->nombre ?? 'N/A') . ".";
                }

                // Intento 2: Segunda carrera (si aún no está asignado)
                if ($estadoAdmision === null) {
                    if (empty($segundaCarreraId)) {
                        $observacion .= "No tiene registrada segunda carrera de preferencia. ";
                    } elseif (!isset($cuposDisponiblesMap[$segundaCarreraId])) {
                        $observacion .= "La segunda carrera seleccionada no está activa o no existe. ";
                    } elseif ($cuposDisponiblesMap[$segundaCarreraId] > 0) {
                        $carreraAsignadaId = $segundaCarreraId;
                        $tipoAdmision = 'SEGUNDA_OPCION';
                        $estadoAdmision = 'ADMITIDO_SEGUNDA_OPCION';
                        $cuposDisponiblesMap[$segundaCarreraId]--;
                        $observacion .= "Admitido en su segunda opción: " . ($postulante->segundaCarrera?->nombre ?? 'N/A') . ".";
                    }
                }

                // Sin Cupo
                if ($estadoAdmision === null) {
                    $tipoAdmision = 'SIN_CUPO';
                    $estadoAdmision = 'APROBADO_SIN_CUPO';
                    $observacion .= "Sin cupo disponible en las opciones de carrera seleccionadas.";
                }

                AdmisionCUP::updateOrCreate(
                    ['postulante_id' => $postulante->id],
                    [
                        'promedio_final_cup' => $item['promedio_final_cup'],
                        'estado_academico_cup' => $item['estado_academico_cup'],
                        'primera_carrera_id' => $primeraCarreraId,
                        'segunda_carrera_id' => $segundaCarreraId,
                        'carrera_asignada_id' => $carreraAsignadaId,
                        'tipo_admision' => $tipoAdmision,
                        'estado_admision' => $estadoAdmision,
                        'posicion_ranking' => $index + 1,
                        'observacion' => trim($observacion),
                        'fecha_procesamiento' => now(),
                    ]
                );
            }

            // 8. Procesar reprobados
            foreach ($reprobados as $item) {
                $postulante = $item['postulante'];
                AdmisionCUP::updateOrCreate(
                    ['postulante_id' => $postulante->id],
                    [
                        'promedio_final_cup' => $item['promedio_final_cup'],
                        'estado_academico_cup' => $item['estado_academico_cup'],
                        'primera_carrera_id' => $postulante->primera_carrera_id,
                        'segunda_carrera_id' => $postulante->segunda_carrera_id,
                        'carrera_asignada_id' => null,
                        'tipo_admision' => null,
                        'estado_admision' => 'REPROBADO',
                        'posicion_ranking' => null,
                        'observacion' => 'Reprobado académicamente en el CU14 (al menos una materia reprobada).',
                        'fecha_procesamiento' => now(),
                    ]
                );
            }

            // 9. Procesar pendientes
            foreach ($pendientes as $item) {
                $postulante = $item['postulante'];
                AdmisionCUP::updateOrCreate(
                    ['postulante_id' => $postulante->id],
                    [
                        'promedio_final_cup' => null,
                        'estado_academico_cup' => $item['estado_academico_cup'],
                        'primera_carrera_id' => $postulante->primera_carrera_id,
                        'segunda_carrera_id' => $postulante->segunda_carrera_id,
                        'carrera_asignada_id' => null,
                        'tipo_admision' => null,
                        'estado_admision' => 'PENDIENTE',
                        'posicion_ranking' => null,
                        'observacion' => 'Pendiente de evaluación académica completa (menos de 4 materias calificadas).',
                        'fecha_procesamiento' => now(),
                    ]
                );
            }

            // 10. Actualizar permanentemente `cupos_ocupados` de todas las carreras de forma segura
            $carrerasTodas = Carrera::all();
            foreach ($carrerasTodas as $carrera) {
                $ocupados = AdmisionCUP::where('carrera_asignada_id', $carrera->id)
                    ->whereIn('estado_admision', ['ADMITIDO_PRIMERA_OPCION', 'ADMITIDO_SEGUNDA_OPCION'])
                    ->count();
                $carrera->update(['cupos_ocupados' => $ocupados]);
            }

            return [
                'procesados' => $postulantes->count(),
                'aprobados' => count($aprobados),
                'reprobados' => count($reprobados),
                'pendientes' => count($pendientes),
            ];
        });
    }

    /**
     * Retorna el resumen estadístico de la admisión por cupos.
     */
    public function resumen(): array
    {
        $totalPostulantes = AdmisionCUP::count();
        $totalAprobadosAcademicos = AdmisionCUP::where('estado_academico_cup', 'APROBADO')->count();
        $totalReprobadosAcademicos = AdmisionCUP::where('estado_academico_cup', 'REPROBADO')->count();
        $totalPendientesAcademicos = AdmisionCUP::where('estado_academico_cup', 'PENDIENTE')->count();

        $admitidos1ra = AdmisionCUP::where('estado_admision', 'ADMITIDO_PRIMERA_OPCION')->count();
        $admitidos2da = AdmisionCUP::where('estado_admision', 'ADMITIDO_SEGUNDA_OPCION')->count();
        $aprobadosSinCupo = AdmisionCUP::where('estado_admision', 'APROBADO_SIN_CUPO')->count();
        $reprobados = AdmisionCUP::where('estado_admision', 'REPROBADO')->count();
        $pendientes = AdmisionCUP::where('estado_admision', 'PENDIENTE')->count();

        $carreras = Carrera::all();

        $cuposPorCarrera = $carreras->map(fn ($c) => [
            'id' => $c->id,
            'nombre' => $c->nombre,
            'cupos_totales' => $c->cupos_totales,
            'cupos_ocupados' => $c->cupos_ocupados,
            'cupos_disponibles' => $c->cupos_disponibles,
        ])->values()->toArray();

        $admitidosPorCarrera = $carreras->map(fn ($c) => [
            'id' => $c->id,
            'nombre' => $c->nombre,
            'admitidos_count' => AdmisionCUP::where('carrera_asignada_id', $c->id)
                ->whereIn('estado_admision', ['ADMITIDO_PRIMERA_OPCION', 'ADMITIDO_SEGUNDA_OPCION'])
                ->count(),
        ])->values()->toArray();

        return [
            'total_postulantes' => $totalPostulantes,
            'total_aprobados_academicos' => $totalAprobadosAcademicos,
            'total_reprobados_academicos' => $totalReprobadosAcademicos,
            'total_pendientes_academicos' => $totalPendientesAcademicos,
            'admitidos_primera_opcion' => $admitidos1ra,
            'admitidos_segunda_opcion' => $admitidos2da,
            'aprobados_sin_cupo' => $aprobadosSinCupo,
            'reprobados' => $reprobados,
            'pendientes' => $pendientes,
            'cupos_por_carrera' => $cuposPorCarrera,
            'admitidos_por_carrera' => $admitidosPorCarrera,
        ];
    }

    /**
     * Construye la consulta de admisiones aplicando los filtros opcionales de la petición.
     */
    public function queryConFiltros(Request $request)
    {
        $query = AdmisionCUP::query()->with(['postulante', 'primeraCarrera', 'segundaCarrera', 'carreraAsignada']);

        if ($request->filled('carrera_id')) {
            $query->where('carrera_asignada_id', $request->input('carrera_id'));
        }

        if ($request->filled('estado_admision')) {
            $query->where('estado_admision', $request->input('estado_admision'));
        }

        if ($request->filled('ci')) {
            $ci = trim($request->input('ci'));
            $query->whereHas('postulante', fn ($q) => $q->where('ci', 'like', '%' . $ci . '%'));
        }

        if ($request->filled('nombre')) {
            $nombre = trim($request->input('nombre'));
            $query->whereHas('postulante', fn ($q) => $q->where('nombres', 'like', '%' . $nombre . '%')
                ->orWhere('apellidos', 'like', '%' . $nombre . '%'));
        }

        if ($request->filled('primera_carrera_id')) {
            $query->where('primera_carrera_id', $request->input('primera_carrera_id'));
        }

        if ($request->filled('segunda_carrera_id')) {
            $query->where('segunda_carrera_id', $request->input('segunda_carrera_id'));
        }

        if ($request->filled('carrera_asignada_id')) {
            $query->where('carrera_asignada_id', $request->input('carrera_asignada_id'));
        }

        $ordenPromedio = $request->input('orden_promedio', 'desc');
        if (!in_array($ordenPromedio, ['asc', 'desc'])) {
            $ordenPromedio = 'desc';
        }

        // Ordenamos por promedio y secundariamente por posición de ranking o ID
        $query->orderBy('promedio_final_cup', $ordenPromedio)
            ->orderBy('id', 'asc');

        return $query;
    }

    /**
     * Transforma un objeto AdmisionCUP en el formato de respuesta del JSON requerido.
     */
    public function transform(AdmisionCUP $admision): array
    {
        return [
            'id' => $admision->id,
            'postulante' => $admision->postulante ? [
                'id' => $admision->postulante->id,
                'ci' => $admision->postulante->ci,
                'nombre_completo' => trim($admision->postulante->nombres . ' ' . $admision->postulante->apellidos),
                'correo' => $admision->postulante->correo,
            ] : null,
            'promedio_final_cup' => $admision->promedio_final_cup !== null ? (float) $admision->promedio_final_cup : null,
            'estado_academico_cup' => $admision->estado_academico_cup,
            'primera_carrera' => $admision->primeraCarrera ? [
                'id' => $admision->primeraCarrera->id,
                'nombre' => $admision->primeraCarrera->nombre,
            ] : null,
            'segunda_carrera' => $admision->segundaCarrera ? [
                'id' => $admision->segundaCarrera->id,
                'nombre' => $admision->segundaCarrera->nombre,
            ] : null,
            'carrera_asignada' => $admision->carreraAsignada ? [
                'id' => $admision->carreraAsignada->id,
                'nombre' => $admision->carreraAsignada->nombre,
            ] : null,
            'estado_admision' => $admision->estado_admision,
            'tipo_admision' => $admision->tipo_admision,
            'posicion_ranking' => $admision->posicion_ranking,
            'observacion' => $admision->observacion,
            'fecha_procesamiento' => $admision->fecha_procesamiento ? $admision->fecha_procesamiento->toDateTimeString() : null,
        ];
    }
}
