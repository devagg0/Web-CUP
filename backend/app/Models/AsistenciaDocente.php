<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AsistenciaDocente extends Model
{
    use HasFactory;

    public const ESTADO_DICTADA = 'DICTADA';
    public const ESTADO_NO_DICTADA = 'NO_DICTADA';
    public const ESTADO_REPROGRAMADA = 'REPROGRAMADA';

    public const ESTADOS = [
        self::ESTADO_DICTADA,
        self::ESTADO_NO_DICTADA,
        self::ESTADO_REPROGRAMADA,
    ];

    protected $table = 'asistencias_docente';

    protected $fillable = [
        'carga_horaria_id',
        'docente_id',
        'fecha',
        'estado_asistencia',
        'observacion',
        'registrado_por',
    ];

    protected $casts = [
        'fecha' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function cargaHoraria()
    {
        return $this->belongsTo(CargaHoraria::class, 'carga_horaria_id');
    }

    public function docente()
    {
        return $this->belongsTo(Docente::class, 'docente_id');
    }

    public function registradoPor()
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }
}
