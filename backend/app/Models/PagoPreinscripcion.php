<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PagoPreinscripcion extends Model
{
    use HasFactory;

    protected $table = 'pagos_preinscripcion';

    protected $fillable = [
        'postulante_id',
        'monto',
        'comprobante_path',
        'estado',
        'observacion',
    ];

    public function postulante()
    {
        return $this->belongsTo(Postulante::class);
    }
}
