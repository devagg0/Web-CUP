<?php

namespace Database\Seeders;

use App\Models\Carrera;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CarreraSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $carreras = [
            [
                'nombre' => 'Ingeniería de Sistemas',
                'descripcion' => 'Carrera de Ingeniería de Sistemas',
                'cupos_totales' => 100,
                'cupos_ocupados' => 0,
                'estado' => 'ACTIVA',
            ],
            [
                'nombre' => 'Ingeniería Informática',
                'descripcion' => 'Carrera de Ingeniería Informática',
                'cupos_totales' => 100,
                'cupos_ocupados' => 0,
                'estado' => 'ACTIVA',
            ],
            [
                'nombre' => 'Ingeniería en Telecomunicaciones',
                'descripcion' => 'Carrera de Ingeniería en Telecomunicaciones',
                'cupos_totales' => 100,
                'cupos_ocupados' => 0,
                'estado' => 'ACTIVA',
            ],
            [
                'nombre' => 'Ingeniería en Robótica',
                'descripcion' => 'Carrera de Ingeniería en Robótica',
                'cupos_totales' => 100,
                'cupos_ocupados' => 0,
                'estado' => 'ACTIVA',
            ],
        ];

        foreach ($carreras as $carrera) {
            Carrera::updateOrCreate(
                ['nombre' => $carrera['nombre']],
                $carrera
            );
        }
    }
}
