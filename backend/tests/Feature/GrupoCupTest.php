<?php

namespace Tests\Feature;

use App\Models\Carrera;
use App\Models\GrupoCup;
use App\Models\Postulante;
use App\Models\User;
use App\Services\GrupoCupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GrupoCupTest extends TestCase
{
    use RefreshDatabase;

    private GrupoCupService $grupoCupService;
    private Carrera $carrera1;
    private Carrera $carrera2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->grupoCupService = new GrupoCupService();

        // Create careers for testing
        $this->carrera1 = Carrera::create([
            'nombre' => 'Ingeniería de Sistemas',
            'descripcion' => 'Carrera de Ingeniería de Sistemas',
            'cupos_totales' => 100,
            'cupos_ocupados' => 0,
            'estado' => 'ACTIVA',
        ]);

        $this->carrera2 = Carrera::create([
            'nombre' => 'Ingeniería Informática',
            'descripcion' => 'Carrera de Ingeniería Informática',
            'cupos_totales' => 100,
            'cupos_ocupados' => 0,
            'estado' => 'ACTIVA',
        ]);
    }

    private function createPostulante(string $ci, string $estado = 'INSCRITO'): Postulante
    {
        $user = User::create([
            'name' => 'Test User ' . $ci,
            'email' => "user{$ci}@test.com",
            'password' => bcrypt('password'),
        ]);

        return Postulante::create([
            'user_id' => $user->id,
            'ci' => $ci,
            'nombres' => 'Juan ' . $ci,
            'apellidos' => 'Perez ' . $ci,
            'fecha_nacimiento' => '2000-01-01',
            'sexo' => 'MASCULINO',
            'direccion' => 'Calle Falsa 123',
            'telefono' => '12345678',
            'correo' => "user{$ci}@test.com",
            'colegio_procedencia' => 'Colegio Test',
            'ciudad' => 'Cochabamba',
            'primera_carrera_id' => $this->carrera1->id,
            'segunda_carrera_id' => $this->carrera2->id,
            'estado_preinscripcion' => $estado,
        ]);
    }

    /**
     * Test first-time group generation.
     */
    public function test_generar_grupos_inicialmente(): void
    {
        // Create 15 registered applicants
        for ($i = 1; $i <= 15; $i++) {
            $this->createPostulante("CI-{$i}");
        }

        $resultado = $this->grupoCupService->generar();

        $this->assertCount(1, $resultado['grupos']);
        $grupo = $resultado['grupos']->first();
        $this->assertEquals('CUP-G01', $grupo->codigo);
        $this->assertEquals(15, $grupo->cantidad_estudiantes);
        $this->assertEquals(15, $resultado['resumen']['estudiantes_asignados']);
        $this->assertEquals(15, $resultado['resumen']['nuevos_asignados']);
        $this->assertEquals(0, $resultado['resumen']['estudiantes_pendientes']);
        $this->assertEquals(1, $resultado['resumen']['grupos_nuevos_creados']);
        $this->assertEquals('Grupos generados correctamente', $resultado['message']);
    }

    /**
     * Test appending new applicants to a new group instead of existing one.
     */
    public function test_generar_grupos_cuando_ya_existen_y_hay_postulantes_pendientes_crea_grupo_nuevo(): void
    {
        // 1. First-time generate (15 applicants)
        for ($i = 1; $i <= 15; $i++) {
            $this->createPostulante("CI-{$i}");
        }
        $this->grupoCupService->generar();

        // Verify state: CUP-G01 has 15 students
        $grupo = GrupoCup::where('codigo', 'CUP-G01')->first();
        $this->assertEquals(15, $grupo->cantidad_estudiantes);

        // 2. Register 2 new pending applicants
        $this->createPostulante("CI-16");
        $this->createPostulante("CI-17");

        // 3. Generate groups again
        $resultado = $this->grupoCupService->generar();

        // Verify state: CUP-G01 STILL has 15 students (it is not modified)
        $grupo->refresh();
        $this->assertEquals(15, $grupo->cantidad_estudiantes);

        // Verify CUP-G02 was created with 2 students
        $grupo2 = GrupoCup::where('codigo', 'CUP-G02')->first();
        $this->assertNotNull($grupo2);
        $this->assertEquals(2, $grupo2->cantidad_estudiantes);
        $this->assertCount(2, GrupoCup::all());

        // Verify return data
        $this->assertEquals(17, $resultado['resumen']['total_inscritos']);
        $this->assertEquals(17, $resultado['resumen']['estudiantes_asignados']);
        $this->assertEquals(0, $resultado['resumen']['estudiantes_pendientes']);
        $this->assertEquals(2, $resultado['resumen']['nuevos_asignados']);
        $this->assertEquals(1, $resultado['resumen']['grupos_nuevos_creados']);
        $this->assertEquals('Se crearon nuevos grupos para los postulantes pendientes.', $resultado['message']);
    }

    /**
     * Test throwing exception when no pending applicants are found.
     */
    public function test_generar_grupos_cuando_ya_existen_y_no_hay_pendientes_lanza_excepcion(): void
    {
        // 1. Create 15 applicants and generate
        for ($i = 1; $i <= 15; $i++) {
            $this->createPostulante("CI-{$i}");
        }
        $this->grupoCupService->generar();

        // 2. Generate again without adding any new applicant
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Los grupos ya fueron generados y no hay postulantes pendientes por asignar.');

        $this->grupoCupService->generar();
    }
}
