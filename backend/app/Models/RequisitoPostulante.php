<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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

    protected $appends = ['archivo_url'];

    public function postulante()
    {
        return $this->belongsTo(Postulante::class);
    }

    public function getArchivoUrlAttribute()
    {
        return $this->archivo_path ? Storage::disk('public')->url($this->archivo_path) : null;
    }
}
