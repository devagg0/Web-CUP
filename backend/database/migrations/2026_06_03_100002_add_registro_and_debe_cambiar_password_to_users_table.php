<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('registro', 9)->nullable()->unique()->after('email');
            $table->boolean('debe_cambiar_password')->default(false)->after('registro');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['registro']);
            $table->dropColumn(['registro', 'debe_cambiar_password']);
        });
    }
};
