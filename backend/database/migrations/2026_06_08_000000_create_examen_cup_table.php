<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examen_cup', function (Blueprint $table) {
            $table->id();
            $table->foreignId('postulante_id')->constrained('postulantes')->cascadeOnDelete();
            $table->foreignId('materia_id')->constrained('materias')->restrictOnDelete();
            $table->foreignId('grupo_id')->constrained('grupos_cup')->restrictOnDelete();
            $table->foreignId('docente_id')->constrained('docentes')->restrictOnDelete();
            $table->decimal('parcial_1', 5, 2);
            $table->decimal('parcial_2', 5, 2);
            $table->decimal('parcial_3', 5, 2);
            $table->decimal('nota_final', 5, 2);
            $table->string('estado_materia', 20);
            $table->timestamps();

            $table->unique(['postulante_id', 'materia_id']);
            $table->index('grupo_id');
            $table->index('materia_id');
            $table->index('docente_id');
            $table->index(['grupo_id', 'materia_id']);
            $table->index(['postulante_id', 'estado_materia']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examen_cup');
    }
};
