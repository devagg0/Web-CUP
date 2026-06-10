<?php

namespace Tests\Feature;

use App\Models\Carrera;
use App\Models\Role;
use App\Models\Postulante;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class ImportacionPostulantesTest extends TestCase
{
    use RefreshDatabase;

    private Carrera $carrera1;
    private Carrera $carrera2;
    private Role $rolPostulante;
    private User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

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

        // Create role 'postulante' and 'admin'
        $this->rolPostulante = Role::create([
            'nombre' => 'postulante',
            'descripcion' => 'Rol postulante',
        ]);

        $rolAdmin = Role::create([
            'nombre' => 'admin',
            'descripcion' => 'Rol administrador',
        ]);

        // Create admin user for auth
        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role_id' => $rolAdmin->id,
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_importar_masivo_crea_postulantes_y_no_envia_correo(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Spy or mock Mail facade to assert it never receives raw method
        Mail::shouldReceive('raw')->never();

        $csvContent = "ci;nombres;apellidos;fecha_nacimiento;sexo;direccion;telefono;correo;colegio_procedencia;ciudad;primera_carrera_id;segunda_carrera_id;estado\n" .
            "9400001;Gabriel;Santos;1994-05-10;MASCULINO;Av. Banzer 123;70000001;gabriel.santos9400001@gmail.com;Colegio Florida;Santa Cruz;{$this->carrera1->id};{$this->carrera2->id};INSCRITO\n" .
            "9400002;Daniela;Molina;1995-08-20;FEMENINO;Av. Busch 456;70000002;daniela.molina9400002@gmail.com;Colegio Uboldi;Santa Cruz;{$this->carrera2->id};{$this->carrera1->id};INSCRITO";

        $file = UploadedFile::fake()->createWithContent('importar_test.csv', $csvContent);

        $response = $this->postJson('/api/admin/preinscripciones/importar', [
            'archivo' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Importación procesada correctamente',
                'total_filas' => 2,
                'correos_enviados' => 0,
                'envio_correos' => false,
            ]);

        $this->assertCount(2, Postulante::all());
        $this->assertCount(3, User::all()); // 1 admin + 2 imported users
    }

    public function test_flujo_manual_si_envia_correo(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Assert that raw email is called exactly once with expected text
        Mail::shouldReceive('raw')
            ->once()
            ->with(
                Mockery::on(function ($text) {
                    return str_contains($text, 'Su inscripción') && str_contains($text, '219051216');
                }),
                Mockery::any()
            );

        // Create a pre-registered applicant in revision
        $postulante = Postulante::create([
            'user_id' => null,
            'ci' => '9400003',
            'nombres' => 'Juan',
            'apellidos' => 'Perez',
            'fecha_nacimiento' => '1996-03-12',
            'sexo' => 'MASCULINO',
            'direccion' => 'Calle Falsa 123',
            'telefono' => '12345678',
            'correo' => 'juan.perez9400003@gmail.com',
            'colegio_procedencia' => 'Colegio Test',
            'ciudad' => 'Santa Cruz',
            'primera_carrera_id' => $this->carrera1->id,
            'segunda_carrera_id' => $this->carrera2->id,
            'estado_preinscripcion' => 'PAGO_EN_REVISION',
        ]);

        // Create a mock payment
        $postulante->pago()->create([
            'monto' => 200,
            'comprobante_path' => 'preinscripciones/1/comprobante_pago.png',
            'estado' => 'EN_REVISION',
        ]);

        // Call the manual approve payment endpoint
        $response = $this->postJson("/api/admin/preinscripciones/{$postulante->id}/aprobar-pago");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Pago aprobado. Usuario postulante generado correctamente.',
                'estado' => 'INSCRITO',
            ]);
    }

    public function test_importar_1000_postulantes_rapido(): void
    {
        Sanctum::actingAs($this->adminUser);

        Mail::shouldReceive('raw')->never();

        $rows = ["ci;nombres;apellidos;fecha_nacimiento;sexo;direccion;telefono;correo;colegio_procedencia;ciudad;primera_carrera_id;segunda_carrera_id;estado"];
        for ($i = 1; $i <= 1000; $i++) {
            $rows[] = "1000000{$i};Nombres{$i};Apellidos{$i};2000-01-01;MASCULINO;Calle {$i};70000000;correo{$i}@test.com;Colegio;Ciudad;{$this->carrera1->id};{$this->carrera2->id};INSCRITO";
        }
        $csvContent = implode("\n", $rows);

        $file = UploadedFile::fake()->createWithContent('importar_1000.csv', $csvContent);

        $startTime = microtime(true);

        $response = $this->postJson('/api/admin/preinscripciones/importar', [
            'archivo' => $file,
        ]);

        $endTime = microtime(true);
        $duration = $endTime - $startTime;

        $response->assertStatus(200);
        $responseData = $response->json();

        $this->assertEquals('Importación procesada correctamente', $responseData['message']);
        $this->assertEquals(1000, $responseData['total_filas']);
        $this->assertCount(1000, $responseData['postulantes_creados']);
        $this->assertEquals(0, $responseData['correos_enviados']);
        $this->assertFalse($responseData['envio_correos']);

        $this->assertLessThan(10.0, $duration, "La importación de 1000 postulantes tardó demasiado ({$duration}s)");
    }

    public function test_importar_idempotencia_y_consistencia(): void
    {
        Sanctum::actingAs($this->adminUser);

        Mail::shouldReceive('raw')->never();

        // 1. Initial counts
        $conteoInicialPostulantes = Postulante::count();

        // 2. Import 10 new applicants
        $rows = ["ci;nombres;apellidos;fecha_nacimiento;sexo;direccion;telefono;correo;colegio_procedencia;ciudad;primera_carrera_id;segunda_carrera_id;estado"];
        for ($i = 1; $i <= 10; $i++) {
            $rows[] = "990000{$i};Nombres{$i};Apellidos{$i};2000-01-01;MASCULINO;Calle {$i};70000000;correo{$i}@test.com;Colegio;Ciudad;{$this->carrera1->id};{$this->carrera2->id};INSCRITO";
        }
        $csvContent = implode("\n", $rows);
        $file = UploadedFile::fake()->createWithContent('importar_10.csv', $csvContent);

        $response = $this->postJson('/api/admin/preinscripciones/importar', [
            'archivo' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'creados' => 10,
                'omitidos' => 0,
                'errores' => 0,
            ]);

        // Verify DB count increased by 10
        $this->assertEquals($conteoInicialPostulantes + 10, Postulante::count());

        // 3. Re-import the exact same CSV
        $file2 = UploadedFile::fake()->createWithContent('importar_10_dup.csv', $csvContent);
        $response2 = $this->postJson('/api/admin/preinscripciones/importar', [
            'archivo' => $file2,
        ]);

        $response2->assertStatus(200)
            ->assertJson([
                'success' => true,
                'creados' => 0,
                'omitidos' => 10,
                'errores' => 0,
            ]);

        // Verify DB count did not increase on re-import
        $this->assertEquals($conteoInicialPostulantes + 10, Postulante::count());
    }
}
