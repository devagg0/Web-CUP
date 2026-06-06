<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GrupoCup extends Model
{
    use HasFactory;

    protected $table = 'grupos_cup';

    protected $fillable = [
        'codigo',
        'nombre',
        'capacidad_maxima',
        'cantidad_estudiantes',
        'estado',
    ];

    protected $casts = [
        'capacidad_maxima' => 'integer',
        'cantidad_estudiantes' => 'integer',
    ];

    public function postulantes()
    {
        return $this->belongsToMany(Postulante::class, 'grupo_postulante', 'grupo_id', 'postulante_id')
            ->withTimestamps();
    }
}
