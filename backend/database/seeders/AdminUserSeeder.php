<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('nombre', 'admin')->first();

        User::updateOrCreate(
            ['email' => 'admin@cup.com'],
            [
                'name' => 'Administrador CUP',
                'password' => Hash::make('123456'),
                'role_id' => $adminRole?->id,
                'estado' => 'ACTIVO',
            ]
        );
    }
}
