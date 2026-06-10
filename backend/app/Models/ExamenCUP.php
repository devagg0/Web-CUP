<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamenCUP extends Model
{
    use HasFactory;

    public const ESTADO_APROBADO = 'APROBADO';
    public const ESTADO_REPROBADO = 'REPROBADO';

    protected $table = 'examen_cup';

    protected $fillable = [
        'postulante_id',
        'materia_id',
        'grupo_id',
        'docente_id',
        'parcial_1',
        'parcial_2',
        'parcial_3',
        'nota_final',
        'estado_materia',
    ];

    protected $casts = [
        'parcial_1' => 'decimal:2',
        'parcial_2' => 'decimal:2',
        'parcial_3' => 'decimal:2',
        'nota_final' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function calcularNotaFinal(float $parcial1, float $parcial2, float $parcial3): float
    {
        return round(($parcial1 * 0.30) + ($parcial2 * 0.30) + ($parcial3 * 0.40), 2);
    }

    public static function estadoMateria(float $parcial1, float $parcial2, float $parcial3, float $notaFinal): string
    {
        return (
            $parcial1 >= 60 &&
            $parcial2 >= 60 &&
            $parcial3 >= 60 &&
            $notaFinal >= 60
        ) ? self::ESTADO_APROBADO : self::ESTADO_REPROBADO;
    }

    public function postulante()
    {
        return $this->belongsTo(Postulante::class);
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class);
    }

    public function grupo()
    {
        return $this->belongsTo(GrupoCup::class, 'grupo_id');
    }

    public function docente()
    {
        return $this->belongsTo(Docente::class, 'docente_id');
    }
}
