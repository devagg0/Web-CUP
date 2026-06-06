<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Postulante extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ci',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'sexo',
        'direccion',
        'telefono',
        'correo',
        'colegio_procedencia',
        'ciudad',
        'primera_carrera_id',
        'segunda_carrera_id',
        'estado_preinscripcion',
        'observacion_admin',
        'fecha_aprobacion',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'fecha_aprobacion' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function primeraCarrera()
    {
        return $this->belongsTo(Carrera::class, 'primera_carrera_id');
    }

    public function segundaCarrera()
    {
        return $this->belongsTo(Carrera::class, 'segunda_carrera_id');
    }

    public function segunda_carrera()
    {
        return $this->segundaCarrera();
    }

    public function requisitos()
    {
        return $this->hasMany(RequisitoPostulante::class);
    }

    public function pago()
    {
        return $this->hasOne(PagoPreinscripcion::class);
    }

    public function gruposCup()
    {
        return $this->belongsToMany(GrupoCup::class, 'grupo_postulante', 'postulante_id', 'grupo_id')
            ->withTimestamps();
    }
}
