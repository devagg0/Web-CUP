<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencias_docente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('carga_horaria_id')->constrained('cargas_horarias')->restrictOnDelete();
            $table->foreignId('docente_id')->constrained('docentes')->restrictOnDelete();
            $table->date('fecha');
            $table->string('estado_asistencia', 20);
            $table->text('observacion')->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['carga_horaria_id', 'fecha']);
            $table->index('docente_id');
            $table->index('fecha');
            $table->index('estado_asistencia');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias_docente');
    }
};
