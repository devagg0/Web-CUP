<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cargas_horarias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asignacion_docente_grupo_id')->constrained('asignaciones_docente_grupo')->restrictOnDelete();
            $table->foreignId('aula_id')->constrained('aulas')->restrictOnDelete();
            $table->string('turno', 20);
            $table->string('dia_semana', 20);
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('estado', 20)->default('ACTIVA');
            $table->timestamps();

            $table->index('asignacion_docente_grupo_id');
            $table->index('aula_id');
            $table->index('turno');
            $table->index('dia_semana');
            $table->index('estado');
            $table->index(['aula_id', 'dia_semana', 'estado']);
            $table->index(['dia_semana', 'hora_inicio', 'hora_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cargas_horarias');
    }
};
