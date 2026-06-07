<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Aula extends Model
{
    use HasFactory;

    public const ESTADO_ACTIVA = 'ACTIVA';
    public const ESTADO_INACTIVA = 'INACTIVA';

    public const ESTADOS = [
        self::ESTADO_ACTIVA,
        self::ESTADO_INACTIVA,
    ];

    protected $table = 'aulas';

    protected $fillable = [
        'codigo',
        'nombre',
        'capacidad',
        'ubicacion',
        'estado',
    ];

    protected $casts = [
        'capacidad' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function cargasHorarias()
    {
        return $this->hasMany(CargaHoraria::class, 'aula_id');
    }
}
