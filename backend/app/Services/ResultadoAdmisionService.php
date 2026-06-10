<?php

namespace App\Services;

use App\Models\AdmisionCUP;
use App\Models\Postulante;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ResultadoAdmisionService
{
    /**
     * Obtiene el resultado de admisión de un postulante a partir del usuario.
     */
    public function obtenerResultadoPostulante(User $user): array
    {
        $postulante = $user->postulante;

        if (!$postulante) {
            throw new ModelNotFoundException("No se encontró el perfil del postulante.");
        }

        // Cargar las relaciones básicas de la carrera del postulante por si no hay admisión
        $postulante->load(['primeraCarrera', 'segundaCarrera']);

        $admision = AdmisionCUP::with(['postulante', 'primeraCarrera', 'segundaCarrera', 'carreraAsignada'])
            ->where('postulante_id', $postulante->id)
            ->first();

        $nombreCompleto = trim($postulante->nombres . ' ' . $postulante->apellidos);

        if (!$admision) {
            // Retornar resultado pendiente por defecto
            return [
                'postulante' => [
                    'id' => $postulante->id,
                    'ci' => $postulante->ci,
                    'nombre_completo' => $nombreCompleto,
                    'correo' => $postulante->correo
                ],
                'resultado' => [
                    'promedio_final_cup' => null,
                    'estado_academico_cup' => 'PENDIENTE',
                    'estado_admision' => 'PENDIENTE',
                    'tipo_admision' => null,
                    'posicion_ranking' => null,
                    'observacion' => 'Tu resultado de admisión aún no fue procesado.',
                    'fecha_procesamiento' => null
                ],
                'carreras' => [
                    'primera_carrera' => $postulante->primeraCarrera ? [
                        'id' => $postulante->primeraCarrera->id,
                        'nombre' => $postulante->primeraCarrera->nombre
                    ] : null,
                    'segunda_carrera' => $postulante->segundaCarrera ? [
                        'id' => $postulante->segundaCarrera->id,
                        'nombre' => $postulante->segundaCarrera->nombre
                    ] : null,
                    'carrera_asignada' => null
                ],
                'mensaje' => $this->obtenerMensajeEstado('PENDIENTE')
            ];
        }

        return [
            'postulante' => [
                'id' => $postulante->id,
                'ci' => $postulante->ci,
                'nombre_completo' => $nombreCompleto,
                'correo' => $postulante->correo
            ],
            'resultado' => [
                'promedio_final_cup' => $admision->promedio_final_cup !== null ? (float) $admision->promedio_final_cup : null,
                'estado_academico_cup' => $admision->estado_academico_cup,
                'estado_admision' => $admision->estado_admision,
                'tipo_admision' => $admision->tipo_admision,
                'posicion_ranking' => $admision->posicion_ranking,
                'observacion' => $admision->observacion,
                'fecha_procesamiento' => $admision->fecha_procesamiento ? $admision->fecha_procesamiento->toDateTimeString() : null
            ],
            'carreras' => [
                'primera_carrera' => $admision->primeraCarrera ? [
                    'id' => $admision->primeraCarrera->id,
                    'nombre' => $admision->primeraCarrera->nombre
                ] : null,
                'segunda_carrera' => $admision->segundaCarrera ? [
                    'id' => $admision->segundaCarrera->id,
                    'nombre' => $admision->segundaCarrera->nombre
                ] : null,
                'carrera_asignada' => $admision->carreraAsignada ? [
                    'id' => $admision->carreraAsignada->id,
                    'nombre' => $admision->carreraAsignada->nombre
                ] : null
            ],
            'mensaje' => $this->obtenerMensajeEstado($admision->estado_admision)
        ];
    }

    /**
     * Retorna el mensaje correspondiente según el estado de la admisión.
     */
    private function obtenerMensajeEstado(string $estado): string
    {
        return match ($estado) {
            'ADMITIDO_PRIMERA_OPCION' => 'Felicidades, fuiste admitido a tu primera opción de carrera.',
            'ADMITIDO_SEGUNDA_OPCION' => 'Felicidades, fuiste admitido a tu segunda opción de carrera.',
            'APROBADO_SIN_CUPO' => 'Aprobaste académicamente el CUP, pero no alcanzaste cupo en tus carreras elegidas.',
            'REPROBADO' => 'No aprobaste académicamente el CUP.',
            default => 'Tu resultado final aún está pendiente. Puede que falten notas o que la admisión no haya sido procesada.',
        };
    }
}
