<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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

    protected $appends = ['comprobante_url'];

    public function postulante()
    {
        return $this->belongsTo(Postulante::class);
    }

    public function getComprobanteUrlAttribute()
    {
        return $this->comprobante_path ? Storage::disk('public')->url($this->comprobante_path) : null;
    }
}
