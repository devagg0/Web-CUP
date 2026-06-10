<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos_preinscripcion', function (Blueprint $table) {
            $table->string('comprobante_path')->nullable()->change();
            $table->string('stripe_session_id')->nullable()->unique()->after('postulante_id');
            $table->string('stripe_payment_intent_id')->nullable()->after('stripe_session_id');
            $table->string('metodo_pago', 50)->default('COMPROBANTE')->after('stripe_payment_intent_id');
            $table->timestamp('fecha_pago')->nullable()->after('metodo_pago');
        });
    }

    public function down(): void
    {
        Schema::table('pagos_preinscripcion', function (Blueprint $table) {
            $table->string('comprobante_path')->nullable(false)->change();
            $table->dropColumn([
                'stripe_session_id',
                'stripe_payment_intent_id',
                'metodo_pago',
                'fecha_pago',
            ]);
        });
    }
};
