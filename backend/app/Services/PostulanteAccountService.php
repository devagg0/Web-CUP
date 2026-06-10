<?php

namespace App\Services;

use App\Models\Postulante;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class PostulanteAccountService
{
    public function crearCuentaPostulante(Postulante $postulante, array $options = []): array
    {
        $rolPostulanteId = $options['role_id'] ?? null;
        if (! $rolPostulanteId) {
            $rolPostulante = Role::where('nombre', 'postulante')->first();
            if (! $rolPostulante) {
                throw new \RuntimeException('Rol postulante no configurado en el sistema.');
            }
            $rolPostulanteId = $rolPostulante->id;
        }

        $registro = $options['registro'] ?? $this->generarRegistroSecuencial();
        $passwordTemporal = $this->generarPasswordTemporal();

        $user = User::create([
            'name' => trim($postulante->nombres . ' ' . $postulante->apellidos),
            'email' => $postulante->correo,
            'registro' => $registro,
            'password' => Hash::make($passwordTemporal),
            'role_id' => $rolPostulanteId,
            'estado' => 'ACTIVO',
            'debe_cambiar_password' => true,
        ]);

        $postulante->update([
            'user_id' => $user->id,
        ]);

        $enviarCorreo = $options['enviar_correo'] ?? true;
        $correoError = null;
        if ($enviarCorreo) {
            $correoError = $this->enviarCorreoCredenciales($postulante, $registro, $passwordTemporal);
        }

        return [
            'user' => $user,
            'registro' => $registro,
            'password_temporal' => $passwordTemporal,
            'correo_error' => $correoError,
        ];
    }

    private function enviarCorreoCredenciales(Postulante $postulante, string $registro, string $passwordTemporal): ?string
    {
        try {
            Mail::raw(
                "Estimado/a {$postulante->nombres} {$postulante->apellidos},\n\n" .
                "Su inscripción al Sistema de Admisión CUP FICCT - UAGRM fue registrada correctamente.\n\n" .
                "Registro: {$registro}\n" .
                "Contraseña temporal: {$passwordTemporal}\n\n" .
                "Por favor ingrese al sistema y cambie su contraseña en el primer acceso.",
                function ($message) use ($postulante) {
                    $message->to($postulante->correo)
                        ->subject('Inscripción exitosa - Sistema CUP');
                }
            );
        } catch (\Throwable $exception) {
            return $exception->getMessage();
        }

        return null;
    }

    private function generarRegistroSecuencial(): string
    {
        $query = DB::table('users')
            ->whereNotNull('registro');

        if (DB::getDriverName() === 'sqlite') {
            $maxRegistro = $query
                ->orderByRaw('CAST(registro AS INTEGER) DESC')
                ->value('registro');
        } else {
            $maxRegistro = $query
                ->whereRaw("registro ~ '^[0-9]+$'")
                ->lockForUpdate()
                ->orderByRaw('CAST(registro AS BIGINT) DESC')
                ->value('registro');
        }

        if (! $maxRegistro) {
            return '219051216';
        }

        $next = (string) (((int) $maxRegistro) + 1);

        if (User::where('registro', $next)->exists()) {
            throw new \RuntimeException('No fue posible generar un registro único.');
        }

        return $next;
    }

    private function generarPasswordTemporal(): string
    {
        return 'CUP-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
    }
}
