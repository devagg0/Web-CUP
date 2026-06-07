<?php

namespace App\Services;

use App\Models\AsignacionDocenteGrupo;
use App\Models\AsistenciaDocente;
use App\Models\Aula;
use App\Models\CargaHoraria;
use App\Models\Docente;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CargaHorariaService
{
    public function resumen(): array
    {
        return [
            'total_aulas' => Aula::count(),
            'aulas_activas' => Aula::where('estado', Aula::ESTADO_ACTIVA)->count(),
            'cargas_activas' => CargaHoraria::where('estado', CargaHoraria::ESTADO_ACTIVA)->count(),
            'asistencias_registradas' => AsistenciaDocente::count(),
        ];
    }

    public function crear(array $data): CargaHoraria
    {
        return DB::transaction(function () use ($data) {
            $asignacion = $this->validarAsignacionActiva((int) $data['asignacion_docente_grupo_id']);
            $aula = $this->validarAulaActiva((int) $data['aula_id']);

            $this->validarHora($data['hora_inicio'], $data['hora_fin']);
            $this->validarCruces($asignacion, $aula, $data['dia_semana'], $data['hora_inicio'], $data['hora_fin']);

            $carga = CargaHoraria::create([
                'asignacion_docente_grupo_id' => $asignacion->id,
                'aula_id' => $aula->id,
                'turno' => $data['turno'],
                'dia_semana' => $data['dia_semana'],
                'hora_inicio' => $data['hora_inicio'],
                'hora_fin' => $data['hora_fin'],
                'estado' => CargaHoraria::ESTADO_ACTIVA,
            ]);

            return $this->cargarRelaciones($carga);
        });
    }

    public function actualizar(CargaHoraria $carga, array $data): CargaHoraria
    {
        return DB::transaction(function () use ($carga, $data) {
            $carga = CargaHoraria::query()->lockForUpdate()->findOrFail($carga->id);

            $asignacionId = (int) ($data['asignacion_docente_grupo_id'] ?? $carga->asignacion_docente_grupo_id);
            $aulaId = (int) ($data['aula_id'] ?? $carga->aula_id);
            $turno = $data['turno'] ?? $carga->turno;
            $diaSemana = $data['dia_semana'] ?? $carga->dia_semana;
            $horaInicio = $data['hora_inicio'] ?? $this->hora($carga->hora_inicio);
            $horaFin = $data['hora_fin'] ?? $this->hora($carga->hora_fin);

            $asignacion = $this->validarAsignacionActiva($asignacionId);
            $aula = $this->validarAulaActiva($aulaId);

            $this->validarHora($horaInicio, $horaFin);

            if (($data['estado'] ?? $carga->estado) === CargaHoraria::ESTADO_ACTIVA) {
                $this->validarCruces($asignacion, $aula, $diaSemana, $horaInicio, $horaFin, $carga->id);
            }

            $carga->update([
                'asignacion_docente_grupo_id' => $asignacion->id,
                'aula_id' => $aula->id,
                'turno' => $turno,
                'dia_semana' => $diaSemana,
                'hora_inicio' => $horaInicio,
                'hora_fin' => $horaFin,
            ]);

            return $this->cargarRelaciones($carga);
        });
    }

    public function activar(CargaHoraria $carga): CargaHoraria
    {
        return DB::transaction(function () use ($carga) {
            $carga = CargaHoraria::query()->lockForUpdate()->findOrFail($carga->id);
            $asignacion = $this->validarAsignacionActiva($carga->asignacion_docente_grupo_id);
            $aula = $this->validarAulaActiva($carga->aula_id);

            $this->validarHora($this->hora($carga->hora_inicio), $this->hora($carga->hora_fin));
            $this->validarCruces(
                $asignacion,
                $aula,
                $carga->dia_semana,
                $this->hora($carga->hora_inicio),
                $this->hora($carga->hora_fin),
                $carga->id
            );

            $carga->update(['estado' => CargaHoraria::ESTADO_ACTIVA]);

            return $this->cargarRelaciones($carga);
        });
    }

    public function inactivar(CargaHoraria $carga): CargaHoraria
    {
        $carga->update(['estado' => CargaHoraria::ESTADO_INACTIVA]);

        return $this->cargarRelaciones($carga);
    }

    public function aulasDisponibles(string $diaSemana, string $horaInicio, string $horaFin)
    {
        $this->validarHora($horaInicio, $horaFin);

        return Aula::query()
            ->where('estado', Aula::ESTADO_ACTIVA)
            ->whereDoesntHave('cargasHorarias', function ($query) use ($diaSemana, $horaInicio, $horaFin) {
                $this->aplicarSolape($query, $diaSemana, $horaInicio, $horaFin);
            })
            ->orderBy('codigo')
            ->get();
    }

    public function registrarAsistencia(CargaHoraria $carga, Docente $docente, array $data, ?int $registradoPor): AsistenciaDocente
    {
        return DB::transaction(function () use ($carga, $docente, $data, $registradoPor) {
            $carga = $this->cargarRelaciones($carga);

            if ((int) $carga->asignacion?->docente_id !== $docente->id) {
                throw new RuntimeException('No puede registrar asistencia de una carga horaria que no le pertenece.');
            }

            $duplicada = AsistenciaDocente::where('carga_horaria_id', $carga->id)
                ->whereDate('fecha', $data['fecha'])
                ->exists();

            if ($duplicada) {
                throw new RuntimeException('Ya existe asistencia registrada para esta fecha.');
            }

            $asistencia = AsistenciaDocente::create([
                'carga_horaria_id' => $carga->id,
                'docente_id' => $docente->id,
                'fecha' => $data['fecha'],
                'estado_asistencia' => $data['estado_asistencia'],
                'observacion' => $data['observacion'] ?? null,
                'registrado_por' => $registradoPor,
            ]);

            return $asistencia->fresh(['cargaHoraria.asignacion.grupo', 'cargaHoraria.asignacion.materia', 'cargaHoraria.aula', 'docente.user', 'registradoPor']);
        });
    }

    public function transform(CargaHoraria $carga): array
    {
        $carga = $this->cargarRelaciones($carga);

        return [
            'id' => $carga->id,
            'asignacion' => $this->transformAsignacion($carga->asignacion),
            'aula' => $this->transformAula($carga->aula),
            'turno' => $carga->turno,
            'dia_semana' => $carga->dia_semana,
            'hora_inicio' => $this->hora($carga->hora_inicio),
            'hora_fin' => $this->hora($carga->hora_fin),
            'estado' => $carga->estado,
            'created_at' => $carga->created_at?->toDatetimeString(),
        ];
    }

    public function transformMiCarga(CargaHoraria $carga, ?AsistenciaDocente $asistenciaHoy = null): array
    {
        $carga = $this->cargarRelaciones($carga);

        return [
            'id' => $carga->id,
            'grupo' => $this->transformGrupo($carga->asignacion?->grupo),
            'materia' => $this->transformMateria($carga->asignacion?->materia),
            'aula' => $this->transformAula($carga->aula),
            'turno' => $carga->turno,
            'dia_semana' => $carga->dia_semana,
            'hora_inicio' => $this->hora($carga->hora_inicio),
            'hora_fin' => $this->hora($carga->hora_fin),
            'estado' => $carga->estado,
            'asistencia_hoy' => $asistenciaHoy ? $this->transformAsistencia($asistenciaHoy) : null,
        ];
    }

    public function transformAsistencia(AsistenciaDocente $asistencia): array
    {
        $asistencia->loadMissing([
            'cargaHoraria.asignacion.grupo',
            'cargaHoraria.asignacion.materia',
            'cargaHoraria.asignacion.docente.user',
            'cargaHoraria.aula',
            'docente.user',
            'registradoPor',
        ]);

        return [
            'id' => $asistencia->id,
            'carga_horaria' => $this->transform($asistencia->cargaHoraria),
            'docente' => $asistencia->docente ? [
                'id' => $asistencia->docente->id,
                'nombre' => $asistencia->docente->user?->name,
                'correo' => $asistencia->docente->user?->email,
            ] : null,
            'fecha' => $asistencia->fecha?->toDateString(),
            'estado_asistencia' => $asistencia->estado_asistencia,
            'observacion' => $asistencia->observacion,
            'registrado_por' => $asistencia->registradoPor ? [
                'id' => $asistencia->registradoPor->id,
                'nombre' => $asistencia->registradoPor->name,
                'correo' => $asistencia->registradoPor->email,
            ] : null,
            'created_at' => $asistencia->created_at?->toDatetimeString(),
        ];
    }

    public function transformAula(?Aula $aula): ?array
    {
        if (! $aula) {
            return null;
        }

        return [
            'id' => $aula->id,
            'codigo' => $aula->codigo,
            'nombre' => $aula->nombre,
            'capacidad' => $aula->capacidad,
            'ubicacion' => $aula->ubicacion,
            'estado' => $aula->estado,
            'created_at' => $aula->created_at?->toDatetimeString(),
        ];
    }

    public function transformAsignacionDisponible(AsignacionDocenteGrupo $asignacion): array
    {
        $asignacion->loadMissing(['grupo', 'materia', 'docente.user']);

        return [
            'id' => $asignacion->id,
            'grupo' => $this->transformGrupo($asignacion->grupo),
            'materia' => $this->transformMateria($asignacion->materia),
            'docente' => $this->transformDocente($asignacion->docente),
            'estado' => $asignacion->estado,
        ];
    }

    private function validarAsignacionActiva(int $asignacionId): AsignacionDocenteGrupo
    {
        $asignacion = AsignacionDocenteGrupo::query()
            ->with(['grupo', 'materia', 'docente.user'])
            ->lockForUpdate()
            ->find($asignacionId);

        if (! $asignacion || $asignacion->estado !== AsignacionDocenteGrupo::ESTADO_ACTIVA) {
            throw new RuntimeException('La asignación docente-grupo no está activa.');
        }

        return $asignacion;
    }

    private function validarAulaActiva(int $aulaId): Aula
    {
        $aula = Aula::query()->lockForUpdate()->find($aulaId);

        if (! $aula || $aula->estado !== Aula::ESTADO_ACTIVA) {
            throw new RuntimeException('El aula no está activa.');
        }

        return $aula;
    }

    private function validarHora(string $horaInicio, string $horaFin): void
    {
        if ($horaFin <= $horaInicio) {
            throw new RuntimeException('La hora de fin debe ser mayor a la hora de inicio.');
        }
    }

    private function validarCruces(
        AsignacionDocenteGrupo $asignacion,
        Aula $aula,
        string $diaSemana,
        string $horaInicio,
        string $horaFin,
        ?int $cargaActualId = null
    ): void {
        $aulaOcupada = $this->queryCargasActivasExcepto($cargaActualId)
            ->where('aula_id', $aula->id)
            ->where(function ($query) use ($diaSemana, $horaInicio, $horaFin) {
                $this->aplicarSolape($query, $diaSemana, $horaInicio, $horaFin);
            })
            ->exists();

        if ($aulaOcupada) {
            throw new RuntimeException('El aula ya está ocupada en ese horario.');
        }

        $docenteOcupado = $this->queryCargasActivasExcepto($cargaActualId)
            ->whereHas('asignacion', function ($query) use ($asignacion) {
                $query->where('docente_id', $asignacion->docente_id);
            })
            ->where(function ($query) use ($diaSemana, $horaInicio, $horaFin) {
                $this->aplicarSolape($query, $diaSemana, $horaInicio, $horaFin);
            })
            ->exists();

        if ($docenteOcupado) {
            throw new RuntimeException('El docente ya tiene una clase asignada en ese horario.');
        }

        $grupoOcupado = $this->queryCargasActivasExcepto($cargaActualId)
            ->whereHas('asignacion', function ($query) use ($asignacion) {
                $query->where('grupo_id', $asignacion->grupo_id);
            })
            ->where(function ($query) use ($diaSemana, $horaInicio, $horaFin) {
                $this->aplicarSolape($query, $diaSemana, $horaInicio, $horaFin);
            })
            ->exists();

        if ($grupoOcupado) {
            throw new RuntimeException('El grupo ya tiene una clase asignada en ese horario.');
        }
    }

    private function aplicarSolape($query, string $diaSemana, string $horaInicio, string $horaFin): void
    {
        $query->where('dia_semana', $diaSemana)
            ->where('estado', CargaHoraria::ESTADO_ACTIVA)
            ->where('hora_inicio', '<', $horaFin)
            ->where('hora_fin', '>', $horaInicio);
    }

    private function queryCargasActivasExcepto(?int $cargaActualId)
    {
        return CargaHoraria::query()
            ->where('estado', CargaHoraria::ESTADO_ACTIVA)
            ->when($cargaActualId, fn ($query) => $query->where('id', '<>', $cargaActualId));
    }

    private function cargarRelaciones(CargaHoraria $carga): CargaHoraria
    {
        return $carga->loadMissing(['asignacion.grupo', 'asignacion.materia', 'asignacion.docente.user', 'aula']);
    }

    private function transformAsignacion(?AsignacionDocenteGrupo $asignacion): ?array
    {
        if (! $asignacion) {
            return null;
        }

        return [
            'id' => $asignacion->id,
            'grupo' => $this->transformGrupo($asignacion->grupo),
            'materia' => $this->transformMateria($asignacion->materia),
            'docente' => $this->transformDocente($asignacion->docente),
        ];
    }

    private function transformGrupo($grupo): ?array
    {
        if (! $grupo) {
            return null;
        }

        return [
            'id' => $grupo->id,
            'codigo' => $grupo->codigo,
            'nombre' => $grupo->nombre,
            'cantidad_estudiantes' => $grupo->cantidad_estudiantes,
        ];
    }

    private function transformMateria($materia): ?array
    {
        if (! $materia) {
            return null;
        }

        return [
            'id' => $materia->id,
            'nombre' => $materia->nombre,
        ];
    }

    private function transformDocente(?Docente $docente): ?array
    {
        if (! $docente) {
            return null;
        }

        return [
            'id' => $docente->id,
            'nombre' => $docente->user?->name,
            'correo' => $docente->user?->email,
        ];
    }

    private function hora(?string $hora): ?string
    {
        return $hora ? substr($hora, 0, 5) : null;
    }
}
