<?php

namespace App\Services;

use App\Models\GrupoCup;
use App\Models\Postulante;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class GrupoCupService
{
    public const CAPACIDAD_MAXIMA = 70;

    public function resumen(): array
    {
        $totalInscritos = $this->totalInscritos();
        $gruposCalculados = $this->calcularCantidadGrupos($totalInscritos);
        $gruposGenerados = GrupoCup::count();
        $estudiantesAsignados = DB::table('grupo_postulante')->count();

        return [
            'total_inscritos' => $totalInscritos,
            'capacidad_por_grupo' => self::CAPACIDAD_MAXIMA,
            'grupos_calculados' => $gruposCalculados,
            'grupos_generados' => $gruposGenerados,
            'estudiantes_asignados' => $estudiantesAsignados,
            'estudiantes_pendientes' => max($totalInscritos - $estudiantesAsignados, 0),
        ];
    }

    public function generar(): array
    {
        return DB::transaction(function () {
            $gruposExisten = GrupoCup::query()->lockForUpdate()->exists();

            if (!$gruposExisten) {
                // Caso A: No existen grupos en el sistema
                $postulantes = Postulante::query()
                    ->where('estado_preinscripcion', 'INSCRITO')
                    ->whereDoesntHave('gruposCup')
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                $totalInscritos = $postulantes->count();

                if ($totalInscritos === 0) {
                    throw new RuntimeException('No existen postulantes inscritos para generar grupos.');
                }

                $cantidadGrupos = $this->calcularCantidadGrupos($totalInscritos);
                $grupos = collect();
                $nuevosAsignadosCount = $totalInscritos;

                for ($indice = 1; $indice <= $cantidadGrupos; $indice++) {
                    $grupoPostulantes = $postulantes
                        ->slice(($indice - 1) * self::CAPACIDAD_MAXIMA, self::CAPACIDAD_MAXIMA)
                        ->values();

                    $grupo = GrupoCup::create([
                        'codigo' => sprintf('CUP-G%02d', $indice),
                        'nombre' => 'Grupo '.$indice,
                        'capacidad_maxima' => self::CAPACIDAD_MAXIMA,
                        'cantidad_estudiantes' => $grupoPostulantes->count(),
                        'estado' => 'HABILITADO',
                    ]);

                    $grupo->postulantes()->attach($grupoPostulantes->pluck('id')->all());
                    $grupos->push($grupo->fresh());
                }

                $totalInscritosGeneral = $this->totalInscritos();
                $estudiantesAsignadosGeneral = DB::table('grupo_postulante')->count();
                $resumen = [
                    'total_inscritos' => $totalInscritosGeneral,
                    'capacidad_por_grupo' => self::CAPACIDAD_MAXIMA,
                    'grupos_generados' => GrupoCup::count(),
                    'grupos_nuevos_creados' => $cantidadGrupos,
                    'estudiantes_asignados' => $estudiantesAsignadosGeneral,
                    'estudiantes_pendientes' => max($totalInscritosGeneral - $estudiantesAsignadosGeneral, 0),
                    'nuevos_asignados' => $nuevosAsignadosCount,
                ];

                return [
                    'message' => 'Grupos generados correctamente',
                    'resumen' => $resumen,
                    'grupos' => $grupos,
                ];
            }

            // Caso B: Ya existen grupos en el sistema. Asignar pendientes en grupos nuevos.
            $postulantesPendientes = Postulante::query()
                ->where('estado_preinscripcion', 'INSCRITO')
                ->whereDoesntHave('gruposCup')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($postulantesPendientes->isEmpty()) {
                throw new RuntimeException('Los grupos ya fueron generados y no hay postulantes pendientes por asignar.');
            }

            // Determine next sequential group index
            $maxGrupo = GrupoCup::query()
                ->where('codigo', 'like', 'CUP-G%')
                ->orderByDesc('codigo')
                ->first();
            
            $siguienteIndice = 1;
            if ($maxGrupo) {
                if (preg_match('/CUP-G(\d+)/', $maxGrupo->codigo, $matches)) {
                    $siguienteIndice = ((int)$matches[1]) + 1;
                }
            } else {
                $siguienteIndice = GrupoCup::count() + 1;
            }

            $cantidadNuevosGrupos = (int) ceil($postulantesPendientes->count() / self::CAPACIDAD_MAXIMA);
            $gruposCreados = collect();
            $nuevosAsignadosCount = $postulantesPendientes->count();

            for ($i = 0; $i < $cantidadNuevosGrupos; $i++) {
                $grupoPostulantes = $postulantesPendientes
                    ->slice($i * self::CAPACIDAD_MAXIMA, self::CAPACIDAD_MAXIMA)
                    ->values();

                $grupo = GrupoCup::create([
                    'codigo' => sprintf('CUP-G%02d', $siguienteIndice),
                    'nombre' => 'Grupo '.$siguienteIndice,
                    'capacidad_maxima' => self::CAPACIDAD_MAXIMA,
                    'cantidad_estudiantes' => $grupoPostulantes->count(),
                    'estado' => 'HABILITADO',
                ]);

                $grupo->postulantes()->attach($grupoPostulantes->pluck('id')->all());
                $gruposCreados->push($grupo->fresh());

                $siguienteIndice++;
            }

            $totalInscritosGeneral = $this->totalInscritos();
            $estudiantesAsignadosGeneral = DB::table('grupo_postulante')->count();
            $resumen = [
                'total_inscritos' => $totalInscritosGeneral,
                'capacidad_por_grupo' => self::CAPACIDAD_MAXIMA,
                'grupos_generados' => GrupoCup::count(),
                'grupos_nuevos_creados' => $cantidadNuevosGrupos,
                'estudiantes_asignados' => $estudiantesAsignadosGeneral,
                'estudiantes_pendientes' => max($totalInscritosGeneral - $estudiantesAsignadosGeneral, 0),
                'nuevos_asignados' => $nuevosAsignadosCount,
            ];

            return [
                'message' => 'Se crearon nuevos grupos para los postulantes pendientes.',
                'resumen' => $resumen,
                'grupos' => $gruposCreados,
            ];
        });
    }

    public function calcularCantidadGrupos(int $totalInscritos): int
    {
        if ($totalInscritos <= 0) {
            return 0;
        }

        return (int) ceil($totalInscritos / self::CAPACIDAD_MAXIMA);
    }

    private function totalInscritos(): int
    {
        return Postulante::where('estado_preinscripcion', 'INSCRITO')->count();
    }
}
