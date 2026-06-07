<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AsignacionDocenteGrupo extends Model
{
    use HasFactory;

    public const ESTADO_ACTIVA = 'ACTIVA';
    public const ESTADO_INACTIVA = 'INACTIVA';

    public const ESTADOS = [
        self::ESTADO_ACTIVA,
        self::ESTADO_INACTIVA,
    ];

    protected $table = 'asignaciones_docente_grupo';

    protected $fillable = [
        'grupo_id',
        'materia_id',
        'docente_id',
        'estado',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function grupo()
    {
        return $this->belongsTo(GrupoCup::class, 'grupo_id');
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }

    public function docente()
    {
        return $this->belongsTo(Docente::class, 'docente_id');
    }

    public function cargasHorarias()
    {
        return $this->hasMany(CargaHoraria::class, 'asignacion_docente_grupo_id');
    }
}
