<?php

namespace App\Console\Commands;

use App\Models\ExamenCUP;
use Illuminate\Console\Command;

class RecalcularNotas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cup:recalcular-notas';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalcula nota_final y estado_materia de todos los exámenes CUP según las nuevas reglas académicas.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $examenes = ExamenCUP::all();
        $totalRevisados = 0;
        $totalActualizados = 0;
        $totalAprobados = 0;
        $totalReprobados = 0;

        $this->info("Iniciando el recálculo de notas de " . $examenes->count() . " exámenes...");

        foreach ($examenes as $examen) {
            $totalRevisados++;
            
            $p1 = (float) $examen->parcial_1;
            $p2 = (float) $examen->parcial_2;
            $p3 = (float) $examen->parcial_3;
            
            $nuevaNotaFinal = ExamenCUP::calcularNotaFinal($p1, $p2, $p3);
            $nuevoEstado = ExamenCUP::estadoMateria($p1, $p2, $p3, $nuevaNotaFinal);

            $modificado = false;
            
            if (abs((float) $examen->nota_final - (float) $nuevaNotaFinal) > 0.001) {
                $examen->nota_final = $nuevaNotaFinal;
                $modificado = true;
            }

            if ($examen->estado_materia !== $nuevoEstado) {
                $examen->estado_materia = $nuevoEstado;
                $modificado = true;
            }

            if ($modificado) {
                $examen->save();
                $totalActualizados++;
            }

            if ($nuevoEstado === ExamenCUP::ESTADO_APROBADO) {
                $totalAprobados++;
            } else {
                $totalReprobados++;
            }
        }

        $this->info("Recálculo completado.");
        $this->table(
            ['Métrica', 'Cantidad'],
            [
                ['Total Revisados', $totalRevisados],
                ['Total Actualizados', $totalActualizados],
                ['Total Aprobados (Materia)', $totalAprobados],
                ['Total Reprobados (Materia)', $totalReprobados]
            ]
        );

        return self::SUCCESS;
    }
}
