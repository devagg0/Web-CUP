<?php

namespace App\Services;

use App\Models\AsignacionDocenteGrupo;
use App\Models\Docente;
use App\Models\ExamenCUP;
use App\Models\Materia;
use App\Models\Postulante;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class ExamenCUPService
{
    public const MATERIAS_REQUERIDAS = 4;
    public const ESTADO_FINAL_APROBADO = 'APROBADO';
    public const ESTADO_FINAL_REPROBADO = 'REPROBADO';

    public function resumen(User $user): array
    {
        $query = $this->queryVisibleParaUsuario($user);

        return [
            'total_registros' => (clone $query)->count(),
            'materias_aprobadas' => (clone $query)->where('estado_materia', ExamenCUP::ESTADO_APROBADO)->count(),
            'materias_reprobadas' => (clone $query)->where('estado_materia', ExamenCUP::ESTADO_REPROBADO)->count(),
            'postulantes_con_notas' => (clone $query)->distinct('postulante_id')->count('postulante_id'),
            'postulantes_cup_aprobados' => $this->contarPostulantesPorEstadoFinal($query, self::ESTADO_FINAL_APROBADO),
            'postulantes_cup_reprobados' => $this->contarPostulantesPorEstadoFinal($query, self::ESTADO_FINAL_REPROBADO),
        ];
    }

    public function queryVisibleParaUsuario(User $user)
    {
        $query = ExamenCUP::query()
            ->with(['postulante', 'materia', 'grupo', 'docente.user']);

        if ($this->esDocente($user)) {
            $docente = $this->obtenerDocenteUsuario($user);
            $query->where('docente_id', $docente->id);
        }

        return $query;
    }

    public function registrar(array $data, User $user): ExamenCUP
    {
        return DB::transaction(function () use ($data, $user) {
            $datos = $this->prepararDatosNota($data, $user);

            $examen = ExamenCUP::updateOrCreate(
                [
                    'postulante_id' => $datos['postulante_id'],
                    'materia_id' => $datos['materia_id'],
                ],
                $datos
            );

            return $examen->fresh(['postulante', 'materia', 'grupo', 'docente.user']);
        });
    }

    public function actualizar(ExamenCUP $examen, array $data, User $user): ExamenCUP
    {
        return DB::transaction(function () use ($examen, $data, $user) {
            $data = array_merge([
                'postulante_id' => $examen->postulante_id,
                'materia_id' => $examen->materia_id,
                'grupo_id' => $examen->grupo_id,
                'docente_id' => $examen->docente_id,
            ], $data);

            $datos = $this->prepararDatosNota($data, $user, $examen->id);
            $examen->update($datos);

            return $examen->fresh(['postulante', 'materia', 'grupo', 'docente.user']);
        });
    }

    public function importar(UploadedFile $archivo, User $user): array
    {
        [$headers, $filas] = $this->leerArchivo($archivo);
        $preparadas = [];
        $errores = [];
        $clavesLeidas = [];

        foreach ($filas as $fila) {
            try {
                $data = $this->normalizarFilaImportacion($headers, $fila['valores']);
                $clave = ($data['postulante_id'] ?? $data['ci'] ?? '').'|'.($data['materia_id'] ?? $data['materia'] ?? '');

                if (in_array($clave, $clavesLeidas, true)) {
                    throw new RuntimeException('Nota duplicada en el archivo para el mismo postulante y materia.');
                }

                $datos = $this->prepararDatosNota($data, $user);
                $preparadas[] = $datos;
                $clavesLeidas[] = $clave;
            } catch (RuntimeException $exception) {
                $errores[] = [
                    'fila' => $fila['numero'],
                    'ci' => $data['ci'] ?? null,
                    'postulante_id' => $data['postulante_id'] ?? null,
                    'materia' => $data['materia'] ?? null,
                    'materia_id' => $data['materia_id'] ?? null,
                    'error' => $exception->getMessage(),
                ];
            }
        }

        if ($errores !== []) {
            return [
                'importados' => 0,
                'errores' => $errores,
                'notas' => [],
            ];
        }

        $notas = DB::transaction(function () use ($preparadas) {
            return collect($preparadas)->map(function (array $datos) {
                return ExamenCUP::updateOrCreate(
                    [
                        'postulante_id' => $datos['postulante_id'],
                        'materia_id' => $datos['materia_id'],
                    ],
                    $datos
                )->fresh(['postulante', 'materia', 'grupo', 'docente.user']);
            });
        });

        return [
            'importados' => $notas->count(),
            'errores' => [],
            'notas' => $notas->map(fn (ExamenCUP $examen) => $this->transform($examen))->values(),
        ];
    }

    public function transform(ExamenCUP $examen): array
    {
        $examen->loadMissing(['postulante', 'materia', 'grupo', 'docente.user']);

        return [
            'id' => $examen->id,
            'postulante' => $examen->postulante ? [
                'id' => $examen->postulante->id,
                'ci' => $examen->postulante->ci,
                'nombre_completo' => trim($examen->postulante->nombres.' '.$examen->postulante->apellidos),
                'correo' => $examen->postulante->correo,
            ] : null,
            'materia' => $examen->materia ? [
                'id' => $examen->materia->id,
                'nombre' => $examen->materia->nombre,
                'codigo' => $examen->materia->codigo,
            ] : null,
            'grupo' => $examen->grupo ? [
                'id' => $examen->grupo->id,
                'codigo' => $examen->grupo->codigo,
                'nombre' => $examen->grupo->nombre,
            ] : null,
            'docente' => $examen->docente ? [
                'id' => $examen->docente->id,
                'nombre' => $examen->docente->user?->name,
                'correo' => $examen->docente->user?->email,
            ] : null,
            'parcial_1' => (float) $examen->parcial_1,
            'parcial_2' => (float) $examen->parcial_2,
            'parcial_3' => (float) $examen->parcial_3,
            'nota_final' => (float) $examen->nota_final,
            'estado_materia' => $examen->estado_materia,
            'updated_at' => $examen->updated_at?->toDatetimeString(),
        ];
    }

    public function transformPostulante(Postulante $postulante, ?User $user = null): array
    {
        $postulante->loadMissing([
            'examenesCup.materia',
            'examenesCup.grupo',
            'examenesCup.docente.user',
        ]);

        $examenes = $postulante->examenesCup;

        if ($user && $this->esDocente($user)) {
            $docente = $this->obtenerDocenteUsuario($user);
            $examenes = $examenes->where('docente_id', $docente->id)->values();
        }

        return [
            'postulante' => [
                'id' => $postulante->id,
                'ci' => $postulante->ci,
                'nombre_completo' => trim($postulante->nombres.' '.$postulante->apellidos),
                'correo' => $postulante->correo,
            ],
            'notas' => $examenes->map(fn (ExamenCUP $examen) => $this->transform($examen))->values(),
            'promedio_final_cup' => $this->promedioFinal($examenes),
            'estado_final_cup' => $this->estadoFinal($examenes),
        ];
    }

    private function prepararDatosNota(array $data, User $user, ?int $examenActualId = null): array
    {
        $postulante = $this->resolverPostulante($data);
        $materia = $this->resolverMateria($data);
        $grupoId = $this->resolverGrupoPostulante($postulante, $data);
        $docenteId = $this->resolverDocente($data, $user, $grupoId, $materia->id);

        $this->validarAsignacionDocente($docenteId, $grupoId, $materia->id, $user);

        $parcial1 = $this->validarNota($data['parcial_1'] ?? null, 'parcial_1');
        $parcial2 = $this->validarNota($data['parcial_2'] ?? null, 'parcial_2');
        $parcial3 = $this->validarNota($data['parcial_3'] ?? null, 'parcial_3');
        $notaFinal = ExamenCUP::calcularNotaFinal($parcial1, $parcial2, $parcial3);

        $duplicado = ExamenCUP::query()
            ->where('postulante_id', $postulante->id)
            ->where('materia_id', $materia->id)
            ->when($examenActualId, fn ($query) => $query->where('id', '<>', $examenActualId))
            ->exists();

        if ($duplicado) {
            throw new RuntimeException('Ya existen notas registradas para este postulante y materia.');
        }

        return [
            'postulante_id' => $postulante->id,
            'materia_id' => $materia->id,
            'grupo_id' => $grupoId,
            'docente_id' => $docenteId,
            'parcial_1' => $parcial1,
            'parcial_2' => $parcial2,
            'parcial_3' => $parcial3,
            'nota_final' => $notaFinal,
            'estado_materia' => ExamenCUP::estadoMateria($notaFinal),
        ];
    }

    private function resolverPostulante(array $data): Postulante
    {
        $query = Postulante::query();

        if (! empty($data['postulante_id'])) {
            $postulante = $query->find((int) $data['postulante_id']);
        } elseif (! empty($data['ci'])) {
            $postulante = $query->where('ci', trim((string) $data['ci']))->first();
        } else {
            throw new RuntimeException('Debe enviar postulante_id o ci.');
        }

        if (! $postulante) {
            throw new RuntimeException('El postulante no existe.');
        }

        return $postulante;
    }

    private function resolverMateria(array $data): Materia
    {
        if (! empty($data['materia_id'])) {
            $materia = Materia::find((int) $data['materia_id']);
        } elseif (! empty($data['materia'])) {
            $materiaTexto = trim((string) $data['materia']);
            $materia = Materia::where('nombre', $materiaTexto)
                ->orWhere('codigo', $materiaTexto)
                ->first();
        } else {
            throw new RuntimeException('Debe enviar materia_id o materia.');
        }

        if (! $materia) {
            throw new RuntimeException('La materia no existe.');
        }

        return $materia;
    }

    private function resolverGrupoPostulante(Postulante $postulante, array $data): int
    {
        $grupoId = isset($data['grupo_id']) && $data['grupo_id'] !== ''
            ? (int) $data['grupo_id']
            : (int) DB::table('grupo_postulante')->where('postulante_id', $postulante->id)->value('grupo_id');

        if ($grupoId <= 0) {
            throw new RuntimeException('El postulante no tiene grupo CUP asignado.');
        }

        $pertenece = DB::table('grupo_postulante')
            ->where('postulante_id', $postulante->id)
            ->where('grupo_id', $grupoId)
            ->exists();

        if (! $pertenece) {
            throw new RuntimeException('El postulante no pertenece al grupo indicado.');
        }

        return $grupoId;
    }

    private function resolverDocente(array $data, User $user, int $grupoId, int $materiaId): int
    {
        if ($this->esDocente($user)) {
            return $this->obtenerDocenteUsuario($user)->id;
        }

        if (! empty($data['docente_id'])) {
            return (int) $data['docente_id'];
        }

        $docenteId = AsignacionDocenteGrupo::where('grupo_id', $grupoId)
            ->where('materia_id', $materiaId)
            ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)
            ->value('docente_id');

        if (! $docenteId) {
            throw new RuntimeException('No existe docente activo asignado para esta materia y grupo.');
        }

        return (int) $docenteId;
    }

    private function validarAsignacionDocente(int $docenteId, int $grupoId, int $materiaId, User $user): void
    {
        if (! Docente::whereKey($docenteId)->exists()) {
            throw new RuntimeException('El docente no existe.');
        }

        $asignado = AsignacionDocenteGrupo::where('docente_id', $docenteId)
            ->where('grupo_id', $grupoId)
            ->where('materia_id', $materiaId)
            ->where('estado', AsignacionDocenteGrupo::ESTADO_ACTIVA)
            ->exists();

        if (! $asignado) {
            throw new RuntimeException('Solo docentes asignados pueden registrar notas para esta materia y grupo.');
        }

        if ($this->esDocente($user) && $this->obtenerDocenteUsuario($user)->id !== $docenteId) {
            throw new RuntimeException('No puedes registrar notas con otro docente.');
        }
    }

    private function validarNota(mixed $valor, string $campo): float
    {
        if ($valor === null || $valor === '') {
            throw new RuntimeException("El campo {$campo} es obligatorio.");
        }

        if (! is_numeric($valor)) {
            throw new RuntimeException("El campo {$campo} debe ser numérico.");
        }

        $nota = (float) $valor;

        if ($nota < 0 || $nota > 100) {
            throw new RuntimeException("El campo {$campo} debe estar entre 0 y 100.");
        }

        return round($nota, 2);
    }

    private function leerArchivo(UploadedFile $archivo): array
    {
        $contenido = file($archivo->getRealPath(), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        if ($contenido === false || $contenido === []) {
            throw new RuntimeException('El archivo está vacío.');
        }

        $delimitador = $this->detectarDelimitador($contenido[0]);
        $headers = array_map(fn ($header) => $this->normalizarHeader($header), str_getcsv($contenido[0], $delimitador));
        $filas = [];

        foreach (array_slice($contenido, 1) as $indice => $linea) {
            $valores = str_getcsv($linea, $delimitador);

            if ($this->filaVacia($valores)) {
                continue;
            }

            $filas[] = [
                'numero' => $indice + 2,
                'valores' => $valores,
            ];
        }

        return [$headers, $filas];
    }

    private function detectarDelimitador(string $linea): string
    {
        $delimitadores = [";" => substr_count($linea, ';'), "," => substr_count($linea, ','), "\t" => substr_count($linea, "\t")];

        arsort($delimitadores);

        return (string) array_key_first($delimitadores);
    }

    private function normalizarFilaImportacion(array $headers, array $valores): array
    {
        $valores = array_pad($valores, count($headers), null);
        $data = array_combine($headers, array_slice($valores, 0, count($headers)));

        foreach ($data as $key => $value) {
            $data[$key] = is_string($value) ? trim($value) : $value;
        }

        return $data;
    }

    private function normalizarHeader(string $header): string
    {
        $header = trim(str_replace("\xEF\xBB\xBF", '', $header));
        $header = Str::lower($header);

        return preg_replace('/[^a-z0-9]+/', '_', $header) ?: $header;
    }

    private function filaVacia(array $valores): bool
    {
        foreach ($valores as $valor) {
            if (trim((string) $valor) !== '') {
                return false;
            }
        }

        return true;
    }

    private function promedioFinal(Collection $examenes): ?float
    {
        if ($examenes->count() < self::MATERIAS_REQUERIDAS) {
            return null;
        }

        return round((float) $examenes->avg('nota_final'), 2);
    }

    private function estadoFinal(Collection $examenes): string
    {
        if ($examenes->count() < self::MATERIAS_REQUERIDAS) {
            return self::ESTADO_FINAL_REPROBADO;
        }

        return $examenes->every(fn (ExamenCUP $examen) => $examen->estado_materia === ExamenCUP::ESTADO_APROBADO)
            ? self::ESTADO_FINAL_APROBADO
            : self::ESTADO_FINAL_REPROBADO;
    }

    private function contarPostulantesPorEstadoFinal($query, string $estado): int
    {
        return (clone $query)
            ->get()
            ->groupBy('postulante_id')
            ->filter(fn (Collection $examenes) => $this->estadoFinal($examenes) === $estado)
            ->count();
    }

    private function esDocente(User $user): bool
    {
        return Str::lower($user->role?->nombre ?? '') === 'docente';
    }

    private function obtenerDocenteUsuario(User $user): Docente
    {
        $docente = $user->docente;

        if (! $docente) {
            throw new RuntimeException('Perfil docente no encontrado.');
        }

        return $docente;
    }
}
