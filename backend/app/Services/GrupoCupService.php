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
            if (GrupoCup::query()->lockForUpdate()->exists()) {
                throw new RuntimeException('Los grupos ya fueron generados.');
            }

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

            $resumen = [
                'total_inscritos' => $totalInscritos,
                'capacidad_por_grupo' => self::CAPACIDAD_MAXIMA,
                'grupos_generados' => $grupos->count(),
                'estudiantes_asignados' => $totalInscritos,
                'estudiantes_pendientes' => 0,
            ];

            return [
                'resumen' => $resumen,
                'grupos' => $grupos,
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
