<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Carrera extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'cupos_totales',
        'cupos_ocupados',
        'estado',
    ];

    protected $appends = ['cupos_disponibles'];

    /**
     * Accesor para calcular cupos disponibles
     */
    public function getCuposDisponiblesAttribute()
    {
        return $this->cupos_totales - $this->cupos_ocupados;
    }

    public function postulantesPrimeraOpcion()
    {
        return $this->hasMany(Postulante::class, 'primera_carrera_id');
    }

    public function postulantesSegundaOpcion()
    {
        return $this->hasMany(Postulante::class, 'segunda_carrera_id');
    }
}
