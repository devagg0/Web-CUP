<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('docentes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
            $table->string('ci', 50)->unique();
            $table->string('telefono', 50);
            $table->string('profesion', 255);
            $table->string('especialidad', 255);
            $table->foreignId('materia_id')->constrained('materias')->restrictOnDelete();
            $table->boolean('tiene_maestria')->default(false);
            $table->boolean('tiene_diplomado')->default(false);
            $table->unsignedSmallInteger('anios_experiencia')->nullable();
            $table->string('estado_docente', 30)->default('PERFIL_PENDIENTE');
            $table->text('observacion_admin')->nullable();
            $table->string('titulo_profesional_path')->nullable();
            $table->string('certificado_maestria_path')->nullable();
            $table->string('certificado_diplomado_path')->nullable();
            $table->string('cv_path')->nullable();
            $table->timestamp('fecha_envio_revision')->nullable();
            $table->timestamp('fecha_aprobacion')->nullable();
            $table->foreignId('aprobado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('estado_docente');
            $table->index('materia_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('docentes');
    }
};
