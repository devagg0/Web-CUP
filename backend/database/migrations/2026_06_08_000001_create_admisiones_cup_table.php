<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admisiones_cup', function (Blueprint $table) {
            $table->id();
            $table->foreignId('postulante_id')->unique()->constrained('postulantes')->cascadeOnDelete();
            $table->decimal('promedio_final_cup', 5, 2)->nullable();
            $table->string('estado_academico_cup', 50); // PENDIENTE, APROBADO, REPROBADO
            $table->foreignId('primera_carrera_id')->nullable()->constrained('carreras')->nullOnDelete();
            $table->foreignId('segunda_carrera_id')->nullable()->constrained('carreras')->nullOnDelete();
            $table->foreignId('carrera_asignada_id')->nullable()->constrained('carreras')->nullOnDelete();
            $table->string('tipo_admision', 50)->nullable(); // PRIMERA_OPCION, SEGUNDA_OPCION, SIN_CUPO
            $table->string('estado_admision', 50); // ADMITIDO_PRIMERA_OPCION, ADMITIDO_SEGUNDA_OPCION, APROBADO_SIN_CUPO, REPROBADO, PENDIENTE
            $table->integer('posicion_ranking')->nullable();
            $table->text('observacion')->nullable();
            $table->timestamp('fecha_procesamiento')->nullable();
            $table->timestamps();

            // Indexes for faster lookups and reporting
            $table->index('estado_admision');
            $table->index('carrera_asignada_id');
            $table->index(['estado_admision', 'carrera_asignada_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admisiones_cup');
    }
};
