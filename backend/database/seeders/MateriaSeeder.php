<?php

namespace Database\Seeders;

use App\Models\Materia;
use Illuminate\Database\Seeder;

class MateriaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $materias = [
            [
                'nombre' => 'Computación',
                'codigo' => 'COM-CUP',
                'descripcion' => 'Materia de Computación del Curso Preuniversitario',
                'estado' => 'ACTIVA',
            ],
            [
                'nombre' => 'Matemáticas',
                'codigo' => 'MAT-CUP',
                'descripcion' => 'Materia de Matemáticas del Curso Preuniversitario',
                'estado' => 'ACTIVA',
            ],
            [
                'nombre' => 'Inglés',
                'codigo' => 'ING-CUP',
                'descripcion' => 'Materia de Inglés del Curso Preuniversitario',
                'estado' => 'ACTIVA',
            ],
            [
                'nombre' => 'Física',
                'codigo' => 'FIS-CUP',
                'descripcion' => 'Materia de Física del Curso Preuniversitario',
                'estado' => 'ACTIVA',
            ],
        ];

        foreach ($materias as $materia) {
            Materia::updateOrCreate(
                ['codigo' => $materia['codigo']],
                $materia
            );
        }
    }
}
