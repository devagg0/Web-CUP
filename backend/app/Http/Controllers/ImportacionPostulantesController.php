<?php

namespace App\Http\Controllers;

use App\Models\Postulante;
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

        $totalFilas = 0;
        $creados = [];
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
            $erroresDuplicadosArchivo = $this->validarDuplicadosEnArchivo($data, $ciLeidos, $correosLeidos);
            $validator = Validator::make($data, $this->reglasValidacion());
            $erroresFila = array_merge($erroresDuplicadosArchivo, $validator->errors()->all());

            if ($erroresFila !== []) {
                $errores[] = $this->errorFila($numeroFila, $data, implode(' ', $erroresFila));
                $this->registrarLeidos($data, $ciLeidos, $correosLeidos);
                continue;
            }

            try {
                $credenciales = DB::transaction(function () use ($data) {
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

                    return $this->accountService->crearCuentaPostulante($postulante);
                });

                $creado = [
                    'fila' => $numeroFila,
                    'ci' => $data['ci'],
                    'correo' => $data['correo'],
                    'registro' => $credenciales['registro'],
                    'password_temporal' => $credenciales['password_temporal'],
                ];

                if ($credenciales['correo_error']) {
                    $creado['correo_error'] = $credenciales['correo_error'];
                }

                $creados[] = $creado;
            } catch (\Throwable $exception) {
                $errores[] = $this->errorFila($numeroFila, $data, $exception->getMessage());
            }

            $this->registrarLeidos($data, $ciLeidos, $correosLeidos);
        }

        fclose($handle);

        return response()->json([
            'message' => 'Importación finalizada',
            'resumen' => [
                'total_filas' => $totalFilas,
                'creados' => count($creados),
                'omitidos' => count($errores),
            ],
            'errores' => $errores,
            'creados' => $creados,
        ]);
    }

    private function reglasValidacion(): array
    {
        return [
            'ci' => ['required', 'string', 'max:20', Rule::unique('postulantes', 'ci')],
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
                Rule::unique('postulantes', 'correo'),
                Rule::unique('users', 'email'),
            ],
            'colegio_procedencia' => ['required', 'string', 'max:150'],
            'ciudad' => ['required', 'string', 'max:100'],
            'primera_carrera_id' => ['required', 'integer', Rule::exists('carreras', 'id')],
            'segunda_carrera_id' => [
                'required',
                'integer',
                Rule::exists('carreras', 'id'),
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
