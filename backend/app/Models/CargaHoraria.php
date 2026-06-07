<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CargaHoraria extends Model
{
    use HasFactory;

    public const TURNO_MANANA = 'MAÑANA';
    public const TURNO_TARDE = 'TARDE';
    public const TURNO_NOCHE = 'NOCHE';

    public const DIA_LUNES = 'LUNES';
    public const DIA_MARTES = 'MARTES';
    public const DIA_MIERCOLES = 'MIERCOLES';
    public const DIA_JUEVES = 'JUEVES';
    public const DIA_VIERNES = 'VIERNES';
    public const DIA_SABADO = 'SABADO';

    public const ESTADO_ACTIVA = 'ACTIVA';
    public const ESTADO_INACTIVA = 'INACTIVA';

    public const TURNOS = [
        self::TURNO_MANANA,
        self::TURNO_TARDE,
        self::TURNO_NOCHE,
    ];

    public const DIAS = [
        self::DIA_LUNES,
        self::DIA_MARTES,
        self::DIA_MIERCOLES,
        self::DIA_JUEVES,
        self::DIA_VIERNES,
        self::DIA_SABADO,
    ];

    public const ESTADOS = [
        self::ESTADO_ACTIVA,
        self::ESTADO_INACTIVA,
    ];

    protected $table = 'cargas_horarias';

    protected $fillable = [
        'asignacion_docente_grupo_id',
        'aula_id',
        'turno',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'estado',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function asignacion()
    {
        return $this->belongsTo(AsignacionDocenteGrupo::class, 'asignacion_docente_grupo_id');
    }

    public function aula()
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }

    public function asistencias()
    {
        return $this->hasMany(AsistenciaDocente::class, 'carga_horaria_id');
    }
}
