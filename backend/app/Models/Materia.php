<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materia extends Model
{
    protected $table = 'materias';

    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'estado',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function docentes()
    {
        return $this->hasMany(Docente::class);
    }

    public function asignacionesDocentesGrupo()
    {
        return $this->hasMany(AsignacionDocenteGrupo::class, 'materia_id');
    }
}
