<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\GrupoCup;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            // Find CUP-G01
            $grupo1 = GrupoCup::where('codigo', 'CUP-G01')->first();
            if (!$grupo1) {
                return;
            }

            // Find assignments for group 1 created after 2026-06-08
            $assignmentsToMove = DB::table('grupo_postulante')
                ->where('grupo_id', $grupo1->id)
                ->where('created_at', '>', '2026-06-08 00:00:00')
                ->get();

            if ($assignmentsToMove->isEmpty()) {
                return;
            }

            // Create CUP-G02 if not exists
            $grupo2 = GrupoCup::firstOrCreate(
                ['codigo' => 'CUP-G02'],
                [
                    'nombre' => 'Grupo 2',
                    'capacidad_maxima' => 70,
                    'cantidad_estudiantes' => 0,
                    'estado' => 'HABILITADO',
                ]
            );

            // Move the assignments to group 2
            $postulanteIds = $assignmentsToMove->pluck('postulante_id')->all();
            DB::table('grupo_postulante')
                ->where('grupo_id', $grupo1->id)
                ->whereIn('postulante_id', $postulanteIds)
                ->update(['grupo_id' => $grupo2->id]);

            // Update student counts
            $grupo1->cantidad_estudiantes = DB::table('grupo_postulante')->where('grupo_id', $grupo1->id)->count();
            $grupo1->save();

            $grupo2->cantidad_estudiantes = DB::table('grupo_postulante')->where('grupo_id', $grupo2->id)->count();
            $grupo2->save();
        });
    }

    public function down(): void
    {
        // One-way migration
    }
};
