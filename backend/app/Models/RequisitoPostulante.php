<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequisitoPostulante extends Model
{
    use HasFactory;

    protected $table = 'requisitos_postulante';

    protected $fillable = [
        'postulante_id',
        'tipo_requisito',
        'archivo_path',
        'estado',
        'observacion',
    ];

    public function postulante()
    {
        return $this->belongsTo(Postulante::class);
    }
}
