<?php

namespace App\Services;

use App\Models\AsignacionDocenteGrupo;
use App\Models\Docente;
use App\Models\GrupoCup;
use App\Models\Materia;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AsignacionDocenteGrupoService
{
    public const CAPACIDAD_GRUPOS_MAXIMA = 4;

    public function resumen(): array
    {
        return [
            'total_grupos' => GrupoCup::count(),
            'docentes_habilitados' => Docente::where('estado_docente', Docente::ESTADO_HABILITADO)->count(),
            'asignaciones_activas' => AsignacionDocenteGrupo::where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)->count(),
            'grupos_con_docentes' => AsignacionDocenteGrupo::where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)
                ->distinct('grupo_id')
                ->count('grupo_id'),
        ];
    }

    public function crear(array $data): AsignacionDocenteGrupo
    {
        return DB::transaction(function () use ($data) {
            [$grupo, $materia, $docente] = $this->validarAsignacion(
                (int) $data['grupo_id'],
                (int) $data['materia_id'],
                (int) $data['docente_id']
            );

            $asignacion = AsignacionDocenteGrupo::create([
                'grupo_id' => $grupo->id,
                'materia_id' => $materia->id,
                'docente_id' => $docente->id,
                'estado' => AsignacionDocenteGrupo::ESTADO_ACTIVA,
            ]);

            return $asignacion->fresh(['grupo', 'materia', 'docente.user', 'docente.materia']);
        });
    }

    public function inactivar(AsignacionDocenteGrupo $asignacion): AsignacionDocenteGrupo
    {
        $asignacion->update([
            'estado' => AsignacionDocenteGrupo::ESTADO_INACTIVA,
        ]);

        return $asignacion->fresh(['grupo', 'materia', 'docente.user', 'docente.materia']);
    }

    public function reactivar(AsignacionDocenteGrupo $asignacion): AsignacionDocenteGrupo
    {
        return DB::transaction(function () use ($asignacion) {
            $asignacion = AsignacionDocenteGrupo::query()
                ->lockForUpdate()
                ->findOrFail($asignacion->id);

            $this->validarAsignacion(
                $asignacion->grupo_id,
                $asignacion->materia_id,
                $asignacion->docente_id,
                $asignacion->id
            );

            $asignacion->update([
                'estado' => AsignacionDocenteGrupo::ESTADO_ACTIVA,
            ]);

            return $asignacion->fresh(['grupo', 'materia', 'docente.user', 'docente.materia']);
        });
    }

    public function docentesDisponibles(int $materiaId, ?int $grupoId = null)
    {
        $materia = Materia::find($materiaId);

        if (! $materia) {
            throw new RuntimeException('La materia no existe.');
        }

        if ($grupoId !== null && ! GrupoCup::whereKey($grupoId)->exists()) {
            throw new RuntimeException('El grupo no existe.');
        }

        return Docente::query()
            ->with(['user', 'materia'])
            ->withCount([
                'asignacionesGrupo as grupos_asignados_actuales' => fn ($query) => $query
                    ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA),
            ])
            ->where('estado_docente', Docente::ESTADO_HABILITADO)
            ->where('materia_id', $materia->id)
            ->has(
                'asignacionesGrupo',
                '<',
                self::CAPACIDAD_GRUPOS_MAXIMA,
                'and',
                fn ($query) => $query->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)
            )
            ->when($grupoId !== null, function ($query) use ($materia, $grupoId) {
                $query->whereDoesntHave('asignacionesGrupo', function ($query) use ($materia, $grupoId) {
                    $query->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)
                        ->where('materia_id', $materia->id)
                        ->where('grupo_id', $grupoId);
                });
            })
            ->orderBy('id')
            ->get();
    }

    public function transform(AsignacionDocenteGrupo $asignacion): array
    {
        $asignacion->loadMissing(['grupo', 'materia', 'docente.user', 'docente.materia']);

        return [
            'id' => $asignacion->id,
            'grupo' => $asignacion->grupo ? [
                'id' => $asignacion->grupo->id,
                'codigo' => $asignacion->grupo->codigo,
                'nombre' => $asignacion->grupo->nombre,
            ] : null,
            'materia' => $asignacion->materia ? [
                'id' => $asignacion->materia->id,
                'nombre' => $asignacion->materia->nombre,
            ] : null,
            'docente' => $asignacion->docente ? [
                'id' => $asignacion->docente->id,
                'nombre' => $asignacion->docente->user?->name,
                'correo' => $asignacion->docente->user?->email,
                'materia_habilitada' => $asignacion->docente->materia ? [
                    'id' => $asignacion->docente->materia->id,
                    'nombre' => $asignacion->docente->materia->nombre,
                ] : null,
            ] : null,
            'grupos_asignados_docente' => $this->contarAsignacionesActivasDocente($asignacion->docente_id),
            'capacidad_grupos_maxima' => self::CAPACIDAD_GRUPOS_MAXIMA,
            'estado' => $asignacion->estado,
            'created_at' => $asignacion->created_at?->toDatetimeString(),
        ];
    }

    public function transformDocenteDisponible(Docente $docente): array
    {
        return [
            'id' => $docente->id,
            'nombre' => $docente->user?->name,
            'correo' => $docente->user?->email,
            'materia_habilitada' => $docente->materia ? [
                'id' => $docente->materia->id,
                'nombre' => $docente->materia->nombre,
            ] : null,
            'grupos_asignados_actuales' => (int) $docente->grupos_asignados_actuales,
            'capacidad_grupos_maxima' => self::CAPACIDAD_GRUPOS_MAXIMA,
            'estado_docente' => $docente->estado_docente,
        ];
    }

    private function validarAsignacion(
        int $grupoId,
        int $materiaId,
        int $docenteId,
        ?int $asignacionActualId = null
    ): array {
        $grupo = GrupoCup::query()->lockForUpdate()->find($grupoId);

        if (! $grupo) {
            throw new RuntimeException('El grupo no existe.');
        }

        if ($grupo->estado !== 'HABILITADO') {
            throw new RuntimeException('El grupo no está habilitado.');
        }

        $materia = Materia::query()->lockForUpdate()->find($materiaId);

        if (! $materia) {
            throw new RuntimeException('La materia no existe.');
        }

        $docente = Docente::query()->lockForUpdate()->find($docenteId);

        if (! $docente) {
            throw new RuntimeException('El docente no existe.');
        }

        if ($docente->estado_docente !== Docente::ESTADO_HABILITADO) {
            throw new RuntimeException('El docente no está habilitado.');
        }

        if ((int) $docente->materia_id !== $materia->id) {
            throw new RuntimeException('El docente no está habilitado para esta materia.');
        }

        $asignacionDuplicada = $this->queryAsignacionesActivasExcepto($asignacionActualId)
            ->where('grupo_id', $grupo->id)
            ->where('materia_id', $materia->id)
            ->where('docente_id', $docente->id)
            ->exists();

        if ($asignacionDuplicada) {
            throw new RuntimeException('La asignación ya existe.');
        }

        $grupoMateriaOcupado = $this->queryAsignacionesActivasExcepto($asignacionActualId)
            ->where('grupo_id', $grupo->id)
            ->where('materia_id', $materia->id)
            ->exists();

        if ($grupoMateriaOcupado) {
            throw new RuntimeException('El grupo ya tiene un docente asignado para esta materia.');
        }

        $asignacionesActivasDocente = $this->queryAsignacionesActivasExcepto($asignacionActualId)
            ->where('docente_id', $docente->id)
            ->count();

        if ($asignacionesActivasDocente >= self::CAPACIDAD_GRUPOS_MAXIMA) {
            throw new RuntimeException('El docente ya alcanzó el máximo de 4 grupos asignados.');
        }

        return [$grupo, $materia, $docente];
    }

    private function queryAsignacionesActivasExcepto(?int $asignacionActualId)
    {
        return AsignacionDocenteGrupo::query()
            ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)
            ->when($asignacionActualId, fn ($query) => $query->where('id', '<>', $asignacionActualId));
    }

    private function contarAsignacionesActivasDocente(int $docenteId): int
    {
        return AsignacionDocenteGrupo::where('docente_id', $docenteId)
            ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)
            ->count();
    }
}
