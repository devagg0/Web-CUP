<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Docente extends Model
{
    public const ESTADO_PERFIL_PENDIENTE = 'PERFIL_PENDIENTE';
    public const ESTADO_EN_REVISION = 'EN_REVISION';
    public const ESTADO_OBSERVADO = 'OBSERVADO';
    public const ESTADO_HABILITADO = 'HABILITADO';
    public const ESTADO_RECHAZADO = 'RECHAZADO';
    public const ESTADO_INACTIVO = 'INACTIVO';

    public const ESTADOS = [
        self::ESTADO_PERFIL_PENDIENTE,
        self::ESTADO_EN_REVISION,
        self::ESTADO_OBSERVADO,
        self::ESTADO_HABILITADO,
        self::ESTADO_RECHAZADO,
        self::ESTADO_INACTIVO,
    ];

    protected $table = 'docentes';

    protected $fillable = [
        'user_id',
        'ci',
        'telefono',
        'profesion',
        'especialidad',
        'materia_id',
        'tiene_maestria',
        'tiene_diplomado',
        'anios_experiencia',
        'estado_docente',
        'observacion_admin',
        'titulo_profesional_path',
        'certificado_maestria_path',
        'certificado_diplomado_path',
        'cv_path',
        'fecha_envio_revision',
        'fecha_aprobacion',
        'aprobado_por',
    ];

    protected $casts = [
        'tiene_maestria' => 'boolean',
        'tiene_diplomado' => 'boolean',
        'anios_experiencia' => 'integer',
        'fecha_envio_revision' => 'datetime',
        'fecha_aprobacion' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class);
    }

    public function aprobadoPor()
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    public function getTituloProfesionalUrlAttribute(): ?string
    {
        return $this->publicUrl($this->titulo_profesional_path);
    }

    public function getCertificadoMaestriaUrlAttribute(): ?string
    {
        return $this->publicUrl($this->certificado_maestria_path);
    }

    public function getCertificadoDiplomadoUrlAttribute(): ?string
    {
        return $this->publicUrl($this->certificado_diplomado_path);
    }

    public function getCvUrlAttribute(): ?string
    {
        return $this->publicUrl($this->cv_path);
    }

    private function publicUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}
