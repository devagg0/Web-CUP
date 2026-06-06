<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grupos_cup', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();
            $table->string('nombre', 100);
            $table->unsignedSmallInteger('capacidad_maxima')->default(70);
            $table->unsignedSmallInteger('cantidad_estudiantes')->default(0);
            $table->string('estado', 20)->default('HABILITADO');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grupos_cup');
    }
};
