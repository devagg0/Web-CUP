<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['nombre' => 'admin', 'descripcion' => 'Administrador del sistema'],
            ['nombre' => 'postulante', 'descripcion' => 'Usuario postulante del CUP'],
            ['nombre' => 'docente', 'descripcion' => 'Docente del CUP'],
            ['nombre' => 'coordinador', 'descripcion' => 'Coordinador académico del CUP'],
            ['nombre' => 'autoridad', 'descripcion' => 'Autoridad académica con acceso a reportes'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['nombre' => $role['nombre']], $role);
        }
    }
}
