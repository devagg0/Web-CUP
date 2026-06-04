<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('postulantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('ci', 20)->unique();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->date('fecha_nacimiento');
            $table->string('sexo', 20);
            $table->string('direccion', 255);
            $table->string('telefono', 30);
            $table->string('correo', 150)->unique();
            $table->string('colegio_procedencia', 150);
            $table->string('ciudad', 100);
            $table->foreignId('primera_carrera_id')->constrained('carreras');
            $table->foreignId('segunda_carrera_id')->constrained('carreras');
            $table->string('estado_preinscripcion')->default('PREINSCRITO');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('postulantes');
    }
};
