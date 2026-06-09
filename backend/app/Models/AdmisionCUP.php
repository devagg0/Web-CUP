<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdmisionCUP extends Model
{
    use HasFactory;

    protected $table = 'admisiones_cup';

    protected $fillable = [
        'postulante_id',
        'promedio_final_cup',
        'estado_academico_cup',
        'primera_carrera_id',
        'segunda_carrera_id',
        'carrera_asignada_id',
        'tipo_admision',
        'estado_admision',
        'posicion_ranking',
        'observacion',
        'fecha_procesamiento',
    ];

    protected $casts = [
        'promedio_final_cup' => 'decimal:2',
        'posicion_ranking' => 'integer',
        'fecha_procesamiento' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function postulante()
    {
        return $this->belongsTo(Postulante::class, 'postulante_id');
    }

    public function primeraCarrera()
    {
        return $this->belongsTo(Carrera::class, 'primera_carrera_id');
    }

    public function segundaCarrera()
    {
        return $this->belongsTo(Carrera::class, 'segunda_carrera_id');
    }

    public function carreraAsignada()
    {
        return $this->belongsTo(Carrera::class, 'carrera_asignada_id');
    }
}
