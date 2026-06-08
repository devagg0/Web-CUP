<?php

namespace App\Services;

use App\Models\AsignacionDocenteGrupo;
use App\Models\CargaHoraria;
use App\Models\GrupoCup;
use App\Models\Postulante;
use App\Models\User;
use Illuminate\Support\Collection;
use RuntimeException;

class GrupoHorarioService
{
    public function obtenerHorarioPostulante(User $user): array
    {
        $postulante = $user->postulante;

        if (! $postulante) {
            throw new RuntimeException('No se encontró un postulante asociado a este usuario.');
        }

        if ($postulante->estado_preinscripcion !== 'INSCRITO') {
            throw new RuntimeException('No tienes una inscripción activa para consultar horario.');
        }

        $grupo = $postulante->gruposCup()
            ->orderBy('grupos_cup.id')
            ->first();

        if (! $grupo) {
            throw new RuntimeException('Aún no tienes un grupo asignado.');
        }

        $horario = $this->cargasActivasDelGrupo($grupo);
        $respuesta = [
            'postulante' => $this->formatearPostulante($postulante),
            'grupo' => $this->formatearGrupo($grupo),
            'resumen' => $this->construirResumen($grupo, $horario),
            'horario' => $horario->map(fn (CargaHoraria $carga) => $this->formatearCargaHoraria($carga))->values(),
        ];

        if ($horario->isEmpty()) {
            return ['message' => 'Tu grupo aún no tiene horario asignado.'] + $respuesta;
        }

        return $respuesta;
    }

    public function obtenerHorarioGrupo(GrupoCup $grupo): array
    {
        $horario = $this->cargasActivasDelGrupo($grupo);
        $resumen = $this->construirResumen($grupo, $horario);
        $resumen['total_estudiantes'] = $grupo->cantidad_estudiantes;

        return [
            'grupo' => $this->formatearGrupo($grupo),
            'resumen' => $resumen,
            'horario' => $horario->map(fn (CargaHoraria $carga) => $this->formatearCargaHoraria($carga))->values(),
        ];
    }

    private function cargasActivasDelGrupo(GrupoCup $grupo): Collection
    {
        $ordenDias = array_flip(CargaHoraria::DIAS);

        return CargaHoraria::query()
            ->with(['asignacion.materia', 'asignacion.docente.user', 'aula'])
            ->where('estado', CargaHoraria::ESTADO_ACTIVA)
            ->whereHas('asignacion', function ($query) use ($grupo) {
                $query->where('grupo_id', $grupo->id)
                    ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA);
            })
            ->get()
            ->sortBy([
                fn (CargaHoraria $carga) => $ordenDias[$carga->dia_semana] ?? 99,
                fn (CargaHoraria $carga) => $this->hora($carga->hora_inicio),
            ])
            ->values();
    }

    private function formatearPostulante(Postulante $postulante): array
    {
        return [
            'id' => $postulante->id,
            'ci' => $postulante->ci,
            'nombre_completo' => trim($postulante->nombres.' '.$postulante->apellidos),
            'correo' => $postulante->correo,
            'estado_preinscripcion' => $postulante->estado_preinscripcion,
        ];
    }

    private function formatearGrupo(GrupoCup $grupo): array
    {
        return [
            'id' => $grupo->id,
            'codigo' => $grupo->codigo,
            'nombre' => $grupo->nombre,
            'capacidad_maxima' => $grupo->capacidad_maxima,
            'cantidad_estudiantes' => $grupo->cantidad_estudiantes,
            'estado' => $grupo->estado,
        ];
    }

    private function formatearCargaHoraria(CargaHoraria $carga): array
    {
        $asignacion = $carga->asignacion;
        $docente = $asignacion?->docente;
        $aula = $carga->aula;

        return [
            'id' => $carga->id,
            'materia' => $asignacion?->materia ? [
                'id' => $asignacion->materia->id,
                'nombre' => $asignacion->materia->nombre,
            ] : null,
            'docente' => $docente ? [
                'id' => $docente->id,
                'nombre' => $docente->user?->name,
                'correo' => $docente->user?->email,
            ] : null,
            'aula' => $aula ? [
                'id' => $aula->id,
                'codigo' => $aula->codigo,
                'nombre' => $aula->nombre,
                'ubicacion' => $aula->ubicacion,
            ] : null,
            'turno' => $carga->turno,
            'dia_semana' => $carga->dia_semana,
            'hora_inicio' => $this->hora($carga->hora_inicio),
            'hora_fin' => $this->hora($carga->hora_fin),
            'estado' => $carga->estado,
        ];
    }

    private function construirResumen(GrupoCup $grupo, Collection $horario): array
    {
        return [
            'total_materias_programadas' => $horario
                ->pluck('asignacion.materia_id')
                ->filter()
                ->unique()
                ->count(),
            'total_clases' => $horario->count(),
            'turnos' => $horario
                ->pluck('turno')
                ->filter()
                ->unique()
                ->values(),
        ];
    }

    private function hora(?string $hora): ?string
    {
        return $hora ? substr($hora, 0, 5) : null;
    }
}
