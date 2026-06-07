<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aulas', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 50)->unique();
            $table->string('nombre');
            $table->unsignedInteger('capacidad');
            $table->string('ubicacion')->nullable();
            $table->string('estado', 20)->default('ACTIVA');
            $table->timestamps();

            $table->index('estado');
            $table->index('nombre');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aulas');
    }
};
