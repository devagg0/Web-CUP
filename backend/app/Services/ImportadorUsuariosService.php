<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ImportadorUsuariosService
{
    private const COLUMNAS_REQUERIDAS = [
        'nombres',
        'apellidos',
        'correo',
        'rol',
        'estado',
    ];

    private const ESTADOS_PERMITIDOS = [
        'ACTIVO',
        'INACTIVO',
        'BLOQUEADO',
    ];

    private const ROLES_PERMITIDOS = [
        'admin' => 'Admin',
        'administrador' => 'Administrador',
        'coordinador' => 'Coordinador',
        'autoridad' => 'Autoridad',
        'docente' => 'Docente',
    ];

    private const ROLES_CANONICOS = [
        'admin' => 'admin',
        'administrador' => 'admin',
        'coordinador' => 'coordinador',
        'autoridad' => 'autoridad',
        'docente' => 'docente',
    ];

    public function importar(UploadedFile $archivo): array
    {
        $handle = fopen($archivo->getRealPath(), 'r');

        if ($handle === false) {
            throw new \RuntimeException('No se pudo leer el archivo. Por ahora se aceptan CSV/TXT separados por punto y coma (;).');
        }

        $headers = fgetcsv($handle, 0, ';');

        if ($headers === false) {
            fclose($handle);

            throw new \RuntimeException('El archivo está vacío.');
        }

        $headers = $this->normalizarHeaders($headers);
        $faltantes = array_values(array_diff(self::COLUMNAS_REQUERIDAS, $headers));

        if ($faltantes !== []) {
            fclose($handle);

            throw new \InvalidArgumentException(json_encode([
                'message' => 'El archivo no tiene todas las columnas obligatorias.',
                'columnas_faltantes' => $faltantes,
                'formato' => implode(';', self::COLUMNAS_REQUERIDAS),
            ], JSON_THROW_ON_ERROR));
        }

        $totalFilas = 0;
        $creados = [];
        $errores = [];
        $correosLeidos = [];
        $numeroFila = 1;

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            $numeroFila++;

            if ($this->filaVacia($row)) {
                continue;
            }

            $totalFilas++;
            $data = $this->normalizarFila($headers, $row);
            $erroresDuplicadosArchivo = $this->validarDuplicadosEnArchivo($data, $correosLeidos);
            $validator = Validator::make($data, $this->reglasValidacion());
            $erroresFila = array_merge($erroresDuplicadosArchivo, $validator->errors()->all());

            if ($erroresFila !== []) {
                $errores[] = $this->errorFila($numeroFila, $data, implode(' ', $erroresFila));
                $this->registrarCorreoLeido($data, $correosLeidos);
                continue;
            }

            try {
                $usuarioCreado = DB::transaction(function () use ($data) {
                    $rol = $this->obtenerRol($data['rol']);
                    $passwordTemporal = $this->generarPasswordTemporal();
                    $nombreCompleto = trim($data['nombres'] . ' ' . $data['apellidos']);

                    $user = User::create([
                        'name' => $nombreCompleto,
                        'email' => $data['correo'],
                        'password' => Hash::make($passwordTemporal),
                        'role_id' => $rol->id,
                        'estado' => $data['estado'],
                        'debe_cambiar_password' => true,
                        'registro' => null,
                    ]);

                    return [
                        'user' => $user,
                        'rol' => self::ROLES_PERMITIDOS[$this->normalizarRol($data['rol'])],
                        'password_temporal' => $passwordTemporal,
                    ];
                });

                $creado = [
                    'fila' => $numeroFila,
                    'nombre' => $usuarioCreado['user']->name,
                    'correo' => $usuarioCreado['user']->email,
                    'rol' => $usuarioCreado['rol'],
                    'password_temporal' => $usuarioCreado['password_temporal'],
                ];

                $correoError = $this->enviarCorreoCredenciales(
                    $usuarioCreado['user'],
                    $usuarioCreado['rol'],
                    $usuarioCreado['password_temporal']
                );

                if ($correoError) {
                    $creado['correo_error'] = $correoError;
                    $errores[] = $this->errorFila(
                        $numeroFila,
                        $data,
                        'Usuario creado, pero falló el envío de correo: ' . $correoError
                    );
                }

                $creados[] = $creado;
            } catch (\Throwable $exception) {
                $errores[] = $this->errorFila($numeroFila, $data, $exception->getMessage());
            }

            $this->registrarCorreoLeido($data, $correosLeidos);
        }

        fclose($handle);

        return [
            'message' => 'Importación de usuarios finalizada',
            'resumen' => [
                'total_filas' => $totalFilas,
                'creados' => count($creados),
                'omitidos' => $totalFilas - count($creados),
                'errores' => count($errores),
            ],
            'errores' => $errores,
            'creados' => $creados,
        ];
    }

    private function reglasValidacion(): array
    {
        return [
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'correo' => ['required', 'email', 'max:150', Rule::unique('users', 'email')],
            'rol' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! $this->rolPermitidoYExistente((string) $value)) {
                        $fail('El rol debe ser Admin, Administrador, Coordinador, Autoridad o Docente, y existir en el sistema.');
                    }
                },
            ],
            'estado' => ['required', 'string', Rule::in(self::ESTADOS_PERMITIDOS)],
        ];
    }

    private function normalizarHeaders(array $headers): array
    {
        return array_map(function ($header) {
            return trim(str_replace("\xEF\xBB\xBF", '', strtolower((string) $header)));
        }, $headers);
    }

    private function normalizarFila(array $headers, array $row): array
    {
        $row = array_pad($row, count($headers), null);
        $data = array_combine($headers, array_slice($row, 0, count($headers)));

        foreach ($data as $key => $value) {
            $data[$key] = is_string($value) ? trim($value) : $value;
        }

        $data['correo'] = strtolower((string) ($data['correo'] ?? ''));
        $data['estado'] = strtoupper((string) ($data['estado'] ?? ''));

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

    private function validarDuplicadosEnArchivo(array $data, array $correosLeidos): array
    {
        $correo = $data['correo'] ?? null;

        if ($correo && in_array($correo, $correosLeidos, true)) {
            return ['Correo duplicado en el archivo.'];
        }

        return [];
    }

    private function registrarCorreoLeido(array $data, array &$correosLeidos): void
    {
        if (! empty($data['correo'])) {
            $correosLeidos[] = $data['correo'];
        }
    }

    private function rolPermitidoYExistente(string $rol): bool
    {
        $rolNormalizado = $this->normalizarRol($rol);

        if (! array_key_exists($rolNormalizado, self::ROLES_CANONICOS)) {
            return false;
        }

        return Role::where('nombre', self::ROLES_CANONICOS[$rolNormalizado])->exists();
    }

    private function obtenerRol(string $rol): Role
    {
        $rolNormalizado = $this->normalizarRol($rol);
        $rolCanonico = self::ROLES_CANONICOS[$rolNormalizado] ?? null;

        if (! $rolCanonico) {
            throw new \RuntimeException('Rol no permitido.');
        }

        $role = Role::where('nombre', $rolCanonico)->first();

        if (! $role) {
            throw new \RuntimeException('Rol no configurado en el sistema.');
        }

        return $role;
    }

    private function normalizarRol(string $rol): string
    {
        return strtolower(trim($rol));
    }

    private function enviarCorreoCredenciales(User $user, string $rol, string $passwordTemporal): ?string
    {
        try {
            Mail::raw(
                "Estimado/a {$user->name},\n\n" .
                "Su cuenta interna para el Sistema de Admisión CUP FICCT - UAGRM fue creada correctamente.\n\n" .
                "Correo de acceso: {$user->email}\n" .
                "Contraseña temporal: {$passwordTemporal}\n" .
                "Rol: {$rol}\n\n" .
                "Por favor ingrese al sistema y cambie su contraseña en el primer acceso.",
                function ($message) use ($user) {
                    $message->to($user->email)
                        ->subject('Credenciales de acceso - Sistema CUP');
                }
            );
        } catch (\Throwable $exception) {
            return $exception->getMessage();
        }

        return null;
    }

    private function generarPasswordTemporal(): string
    {
        return 'CUP-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
    }

    private function errorFila(int $fila, array $data, string $error): array
    {
        return [
            'fila' => $fila,
            'correo' => $data['correo'] ?? null,
            'error' => $error,
        ];
    }
}
