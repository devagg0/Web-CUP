<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('postulantes')) {
            if (DB::getDriverName() !== 'sqlite') {
                DB::statement("ALTER TABLE postulantes ALTER COLUMN user_id DROP NOT NULL");
                DB::statement("ALTER TABLE postulantes ALTER COLUMN segunda_carrera_id DROP NOT NULL");
                DB::statement("ALTER TABLE postulantes ALTER COLUMN estado_preinscripcion SET DEFAULT 'EN_REVISION'");
            } else {
                Schema::table('postulantes', function (Blueprint $table) {
                    $table->foreignId('user_id')->nullable()->change();
                    $table->foreignId('segunda_carrera_id')->nullable()->change();
                });
            }

            Schema::table('postulantes', function (Blueprint $table) {
                if (! Schema::hasColumn('postulantes', 'observacion_admin')) {
                    $table->text('observacion_admin')->nullable()->after('estado_preinscripcion');
                }
                if (! Schema::hasColumn('postulantes', 'fecha_aprobacion')) {
                    $table->date('fecha_aprobacion')->nullable()->after('observacion_admin');
                }
            });

            DB::statement("UPDATE postulantes SET estado_preinscripcion = 'EN_REVISION' WHERE estado_preinscripcion = 'PREINSCRITO'");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('postulantes')) {
            Schema::table('postulantes', function (Blueprint $table) {
                if (Schema::hasColumn('postulantes', 'observacion_admin')) {
                    $table->dropColumn('observacion_admin');
                }
                if (Schema::hasColumn('postulantes', 'fecha_aprobacion')) {
                    $table->dropColumn('fecha_aprobacion');
                }
            });

            if (DB::getDriverName() !== 'sqlite') {
                DB::statement("ALTER TABLE postulantes ALTER COLUMN user_id SET NOT NULL");
                DB::statement("ALTER TABLE postulantes ALTER COLUMN segunda_carrera_id SET NOT NULL");
                DB::statement("ALTER TABLE postulantes ALTER COLUMN estado_preinscripcion SET DEFAULT 'PREINSCRITO'");
            } else {
                Schema::table('postulantes', function (Blueprint $table) {
                    $table->foreignId('user_id')->change();
                    $table->foreignId('segunda_carrera_id')->change();
                });
            }
        }
    }
};
