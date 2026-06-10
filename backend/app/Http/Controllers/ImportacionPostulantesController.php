<?php

namespace App\Http\Controllers;

use App\Models\Postulante;
use App\Models\User;
use App\Models\Role;
use App\Models\Carrera;
use App\Services\PostulanteAccountService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ImportacionPostulantesController extends Controller
{
    private const COLUMNAS_REQUERIDAS = [
        'ci',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'sexo',
        'direccion',
        'telefono',
        'correo',
        'colegio_procedencia',
        'ciudad',
        'primera_carrera_id',
        'segunda_carrera_id',
        'estado',
    ];

    public function __construct(private readonly PostulanteAccountService $accountService)
    {
    }

    public function importar(Request $request)
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $handle = fopen($request->file('archivo')->getRealPath(), 'r');

        if ($handle === false) {
            return response()->json([
                'message' => 'No se pudo leer el archivo. Por ahora se aceptan CSV/TXT separados por punto y coma (;).',
            ], 422);
        }

        $headers = fgetcsv($handle, 0, ';');

        if ($headers === false) {
            fclose($handle);

            return response()->json([
                'message' => 'El archivo está vacío.',
            ], 422);
        }

        $headers = $this->normalizarHeaders($headers);
        $faltantes = array_values(array_diff(self::COLUMNAS_REQUERIDAS, $headers));

        if ($faltantes !== []) {
            fclose($handle);

            return response()->json([
                'message' => 'El archivo no tiene todas las columnas obligatorias.',
                'columnas_faltantes' => $faltantes,
                'formato' => implode(';', self::COLUMNAS_REQUERIDAS),
            ], 422);
        }

        // Cache role and active carreras
        $rolPostulante = Role::where('nombre', 'postulante')->first();
        $rolPostulanteId = $rolPostulante ? $rolPostulante->id : null;
        $carrerasIds = Carrera::pluck('id')->toArray();

        // Cache existing CIs and emails for fast memory checks
        $existingCis = array_fill_keys(Postulante::pluck('ci')->map(fn($val) => (string)$val)->toArray(), true);
        $existingPostulanteCorreos = array_fill_keys(Postulante::pluck('correo')->map(fn($val) => strtolower((string)$val))->toArray(), true);
        $existingUserEmails = array_fill_keys(User::pluck('email')->map(fn($val) => strtolower((string)$val))->toArray(), true);

        // Pre-calculate sequential registration number
        $queryRegistro = DB::table('users')
            ->whereNotNull('registro');

        if (DB::getDriverName() === 'sqlite') {
            $maxRegistro = $queryRegistro
                ->orderByRaw('CAST(registro AS INTEGER) DESC')
                ->value('registro');
        } else {
            $maxRegistro = $queryRegistro
                ->whereRaw("registro ~ '^[0-9]+$'")
                ->orderByRaw('CAST(registro AS BIGINT) DESC')
                ->value('registro');
        }

        $siguienteRegistro = $maxRegistro ? ((int) $maxRegistro) + 1 : 219051216;

        $totalFilas = 0;
        $creados = [];
        $omitidos = [];
        $errores = [];
        $ciLeidos = [];
        $correosLeidos = [];
        $numeroFila = 1;

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            $numeroFila++;

            if ($this->filaVacia($row)) {
                continue;
            }

            $totalFilas++;
            $data = $this->normalizarFila($headers, $row);
            $ci = $data['ci'] ?? null;
            $correo = $data['correo'] ?? null;

            // 1. Detect duplicates before creating (check files and DB)
            $erroresDuplicadosArchivo = $this->validarDuplicadosEnArchivo($data, $ciLeidos, $correosLeidos);
            $esDuplicadoDb = false;
            if ($ci && isset($existingCis[$ci])) {
                $esDuplicadoDb = true;
            }
            if ($correo && (isset($existingPostulanteCorreos[$correo]) || isset($existingUserEmails[$correo]))) {
                $esDuplicadoDb = true;
            }

            if (!empty($erroresDuplicadosArchivo) || $esDuplicadoDb) {
                $motivo = !empty($erroresDuplicadosArchivo) ? implode(' ', $erroresDuplicadosArchivo) : 'El postulante (CI o correo) ya está registrado en el sistema.';
                $omitidos[] = [
                    'fila' => $numeroFila,
                    'ci' => $ci,
                    'correo' => $correo,
                    'motivo' => $motivo,
                ];
                $this->registrarLeidos($data, $ciLeidos, $correosLeidos);
                continue;
            }

            // 2. Validate structural data
            $validator = Validator::make($data, $this->reglasValidacion($carrerasIds));
            if ($validator->fails()) {
                $errores[] = $this->errorFila($numeroFila, $data, implode(' ', $validator->errors()->all()));
                $this->registrarLeidos($data, $ciLeidos, $correosLeidos);
                continue;
            }

            // 3. Insert applicant and account atomically
            try {
                $registroStr = (string)$siguienteRegistro;
                $credenciales = DB::transaction(function () use ($data, $rolPostulanteId, $registroStr) {
                    $postulante = Postulante::create([
                        'user_id' => null,
                        'ci' => $data['ci'],
                        'nombres' => $data['nombres'],
                        'apellidos' => $data['apellidos'],
                        'fecha_nacimiento' => $data['fecha_nacimiento'],
                        'sexo' => $data['sexo'],
                        'direccion' => $data['direccion'],
                        'telefono' => $data['telefono'],
                        'correo' => $data['correo'],
                        'colegio_procedencia' => $data['colegio_procedencia'],
                        'ciudad' => $data['ciudad'],
                        'primera_carrera_id' => $data['primera_carrera_id'],
                        'segunda_carrera_id' => $data['segunda_carrera_id'],
                        'estado_preinscripcion' => 'INSCRITO',
                        'observacion_admin' => 'Importado por carga masiva administrativa',
                        'fecha_aprobacion' => now()->toDateString(),
                    ]);

                    return $this->accountService->crearCuentaPostulante($postulante, [
                        'enviar_correo' => false,
                        'role_id' => $rolPostulanteId,
                        'registro' => $registroStr,
                    ]);
                });

                $siguienteRegistro++;

                // Register CI/correo in the memory sets to prevent subsequent duplicates
                if ($ci) {
                    $existingCis[$ci] = true;
                }
                if ($correo) {
                    $existingPostulanteCorreos[$correo] = true;
                    $existingUserEmails[$correo] = true;
                }

                $creados[] = [
                    'ci' => $data['ci'],
                    'correo' => $data['correo'],
                    'registro' => $credenciales['registro'],
                    'password_temporal' => $credenciales['password_temporal'],
                ];
            } catch (\Throwable $exception) {
                $errores[] = $this->errorFila($numeroFila, $data, $exception->getMessage());
            }

            $this->registrarLeidos($data, $ciLeidos, $correosLeidos);
        }

        fclose($handle);

        return response()->json([
            'success' => true,
            'message' => 'Importación procesada correctamente',
            'total_filas' => $totalFilas,
            'creados' => count($creados),
            'omitidos' => count($omitidos),
            'errores' => count($errores),
            'correos_enviados' => 0,
            'envio_correos' => false,
            'postulantes_creados' => $creados,
            'postulantes_omitidos' => $omitidos,
            'errores_detalle' => $errores,
        ]);
    }

    private function reglasValidacion(array $carrerasIds): array
    {
        return [
            'ci' => ['required', 'string', 'max:20'],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'fecha_nacimiento' => ['required', 'date'],
            'sexo' => ['required', 'string', Rule::in(['MASCULINO', 'FEMENINO', 'OTRO'])],
            'direccion' => ['required', 'string', 'max:255'],
            'telefono' => ['required', 'string', 'max:30'],
            'correo' => [
                'required',
                'email',
                'max:150',
            ],
            'colegio_procedencia' => ['required', 'string', 'max:150'],
            'ciudad' => ['required', 'string', 'max:100'],
            'primera_carrera_id' => ['required', 'integer', Rule::in($carrerasIds)],
            'segunda_carrera_id' => [
                'required',
                'integer',
                Rule::in($carrerasIds),
                'different:primera_carrera_id',
            ],
            'estado' => ['required', 'string', Rule::in(['INSCRITO'])],
        ];
    }

    private function normalizarHeaders(array $headers): array
    {
        return array_map(function ($header) {
            return trim(str_replace("\xEF\xBB\xBF", '', (string) $header));
        }, $headers);
    }

    private function normalizarFila(array $headers, array $row): array
    {
        $row = array_pad($row, count($headers), null);
        $data = array_combine($headers, array_slice($row, 0, count($headers)));

        foreach ($data as $key => $value) {
            $data[$key] = is_string($value) ? trim($value) : $value;
        }

        $data['sexo'] = strtoupper((string) ($data['sexo'] ?? ''));
        $data['estado'] = strtoupper((string) ($data['estado'] ?? ''));
        $data['correo'] = strtolower((string) ($data['correo'] ?? ''));

        return $data;
    }

    private function filaVacia(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function validarDuplicadosEnArchivo(array $data, array $ciLeidos, array $correosLeidos): array
    {
        $errores = [];
        $ci = $data['ci'] ?? null;
        $correo = $data['correo'] ?? null;

        if ($ci && in_array($ci, $ciLeidos, true)) {
            $errores[] = 'CI duplicado en el archivo.';
        }

        if ($correo && in_array($correo, $correosLeidos, true)) {
            $errores[] = 'Correo duplicado en el archivo.';
        }

        return $errores;
    }

    private function registrarLeidos(array $data, array &$ciLeidos, array &$correosLeidos): void
    {
        if (! empty($data['ci'])) {
            $ciLeidos[] = $data['ci'];
        }

        if (! empty($data['correo'])) {
            $correosLeidos[] = $data['correo'];
        }
    }

    private function errorFila(int $fila, array $data, string $error): array
    {
        return [
            'fila' => $fila,
            'ci' => $data['ci'] ?? null,
            'correo' => $data['correo'] ?? null,
            'error' => $error,
        ];
    }
}
