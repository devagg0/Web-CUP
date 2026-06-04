<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\PagoPreinscripcion;
use App\Models\Postulante;
use App\Models\RequisitoPostulante;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PreinscripcionController extends Controller
{
    public function carrerasActivas()
    {
        $carreras = Carrera::where('estado', 'ACTIVA')->get();

        return response()->json([
            'data' => $carreras,
        ]);
    }

    public function store(Request $request)
    {
        $request->merge([
            'segunda_carrera_id' => $request->input('segunda_carrera_id', $request->input('segundaCarreraId', $request->input('segundaCarrera.id'))),
        ]);

        $validated = $request->validate([
            'ci' => ['required', 'string', 'max:20', Rule::unique('postulantes', 'ci')],
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'fecha_nacimiento' => ['required', 'date'],
            'sexo' => ['required', 'string', Rule::in(['MASCULINO', 'FEMENINO', 'OTRO'])],
            'direccion' => ['required', 'string', 'max:255'],
            'telefono' => ['required', 'string', 'max:30'],
            'correo' => [
                'required',
                'email',
                'max:150',
                Rule::unique('postulantes', 'correo'),
                Rule::unique('users', 'email'),
            ],
            'colegio_procedencia' => ['required', 'string', 'max:150'],
            'ciudad' => ['required', 'string', 'max:100'],
            'primera_carrera_id' => [
                'required',
                'integer',
                Rule::exists('carreras', 'id')->where('estado', 'ACTIVA'),
            ],
            'segunda_carrera_id' => [
                'nullable',
                'integer',
                Rule::exists('carreras', 'id')->where('estado', 'ACTIVA'),
                'different:primera_carrera_id',
            ],
            'titulo_bachiller' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'carnet_identidad' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'otros' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'comprobante_pago' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        if (! empty($validated['segunda_carrera_id']) && $validated['primera_carrera_id'] === $validated['segunda_carrera_id']) {
            return response()->json([
                'message' => 'La primera y la segunda opción de carrera deben ser distintas.',
            ], 422);
        }

        DB::transaction(function () use ($validated, $request, &$postulante) {
            $postulante = Postulante::create([
                'user_id' => null,
                'ci' => $validated['ci'],
                'nombres' => $validated['nombres'],
                'apellidos' => $validated['apellidos'],
                'fecha_nacimiento' => $validated['fecha_nacimiento'],
                'sexo' => $validated['sexo'],
                'direccion' => $validated['direccion'],
                'telefono' => $validated['telefono'],
                'correo' => $validated['correo'],
                'colegio_procedencia' => $validated['colegio_procedencia'],
                'ciudad' => $validated['ciudad'],
                'primera_carrera_id' => $validated['primera_carrera_id'],
                'segunda_carrera_id' => isset($validated['segunda_carrera_id']) && $validated['segunda_carrera_id'] !== ''
                    ? $validated['segunda_carrera_id']
                    : null,
                'estado_preinscripcion' => 'EN_REVISION',
            ]);

            $this->createRequisito($postulante, 'TITULO_BACHILLER', $request->file('titulo_bachiller'));
            $this->createRequisito($postulante, 'CARNET_IDENTIDAD', $request->file('carnet_identidad'));

            if ($request->hasFile('otros')) {
                $this->createRequisito($postulante, 'OTROS', $request->file('otros'));
            }

            $comprobantePath = $this->storeFileForPostulante($request->file('comprobante_pago'), $postulante->id, 'comprobante_pago');

            $postulante->pago()->create([
                'monto' => 200,
                'comprobante_path' => $comprobantePath,
                'estado' => 'EN_REVISION',
            ]);
        });

        $postulante->refresh()->load([
            'primeraCarrera:id,nombre',
            'segundaCarrera:id,nombre',
            'requisitos',
            'pago',
        ]);

        return response()->json([
            'message' => 'Solicitud de preinscripción enviada correctamente. Sus requisitos y pago serán revisados por administración.',
            'postulante' => [
                'id' => $postulante->id,
                'ci' => $postulante->ci,
                'nombres' => $postulante->nombres,
                'apellidos' => $postulante->apellidos,
                'correo' => $postulante->correo,
                'estado_preinscripcion' => $postulante->estado_preinscripcion,
                'primera_carrera' => $postulante->primeraCarrera
                    ? ['id' => $postulante->primeraCarrera->id, 'nombre' => $postulante->primeraCarrera->nombre]
                    : null,
                'segunda_carrera_id' => $postulante->segunda_carrera_id,
                'segunda_carrera' => $postulante->segundaCarrera
                    ? ['id' => $postulante->segundaCarrera->id, 'nombre' => $postulante->segundaCarrera->nombre]
                    : null,
            ],
            'estado' => $postulante->estado_preinscripcion,
            'pago' => [
                'monto' => 200,
                'concepto' => 'Pago de inscripción CUP',
                'qr_url' => 'preinscripcion-qr.png',
            ],
        ], 201);
    }

    public function adminIndex(Request $request)
    {
        $query = Postulante::with([
            'primeraCarrera:id,nombre',
            'segundaCarrera:id,nombre',
            'requisitos',
            'pago',
        ]);

        if ($request->filled('estado')) {
            $query->where('estado_preinscripcion', $request->input('estado'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($sub) use ($search) {
                $sub->where('ci', 'ilike', "%{$search}%")
                    ->orWhere('nombres', 'ilike', "%{$search}%")
                    ->orWhere('apellidos', 'ilike', "%{$search}%")
                    ->orWhere('correo', 'ilike', "%{$search}%");
            });
        }

        $postulantes = $query->orderByDesc('created_at')->get();

        return response()->json(['data' => $postulantes]);
    }

    public function show(Postulante $postulante)
    {
        $postulante->load([
            'primeraCarrera:id,nombre',
            'segundaCarrera:id,nombre',
            'requisitos',
            'pago',
        ]);

        return response()->json(['data' => $postulante]);
    }

    public function aprobar(Postulante $postulante)
    {
        if ($postulante->user_id) {
            return response()->json([
                'message' => 'Esta preinscripción ya tiene usuario asociado.',
            ], 422);
        }

        $rolPostulante = Role::where('nombre', 'postulante')->first();

        if (! $rolPostulante) {
            return response()->json([
                'message' => 'Rol postulante no configurado en el sistema.',
            ], 500);
        }

        $registro = $this->generarRegistroUnico();
        $passwordTemporal = $this->generarPasswordTemporal();

        DB::transaction(function () use ($postulante, $rolPostulante, $registro, $passwordTemporal) {
            $user = User::create([
                'name' => trim($postulante->nombres . ' ' . $postulante->apellidos),
                'email' => $postulante->correo,
                'registro' => $registro,
                'password' => Hash::make($passwordTemporal),
                'role_id' => $rolPostulante->id,
                'estado' => 'ACTIVO',
                'debe_cambiar_password' => true,
            ]);

            $postulante->update([
                'user_id' => $user->id,
                'estado_preinscripcion' => 'INSCRITO',
                'fecha_aprobacion' => now()->toDateString(),
            ]);

            if ($postulante->pago) {
                $postulante->pago->update(['estado' => 'APROBADO']);
            }

            $postulante->requisitos()->update(['estado' => 'APROBADO']);
        });

        Mail::raw(
            "Su preinscripción ha sido aprobada.\n\n" .
            "Registro: {$registro}\n" .
            "Contraseña temporal: {$passwordTemporal}\n\n" .
            "Por favor inicie sesión y cambie su contraseña en el primer acceso.",
            function ($message) use ($postulante) {
                $message->to($postulante->correo)
                    ->subject('Preinscripción aprobada - Sistema CUP');
            }
        );

        return response()->json([
            'message' => 'Preinscripción aprobada. Usuario postulante generado correctamente.',
            'credenciales' => [
                'registro' => $registro,
                'password_temporal' => $passwordTemporal,
            ],
        ]);
    }

    public function observar(Request $request, Postulante $postulante)
    {
        $validated = $request->validate([
            'observacion' => ['required', 'string'],
        ]);

        $postulante->update([
            'estado_preinscripcion' => 'OBSERVADO',
            'observacion_admin' => $validated['observacion'],
        ]);

        Mail::raw(
            "Su preinscripción ha sido observada por administración.\n\n" .
            "Observación: {$validated['observacion']}\n\n" .
            "Por favor revise y corrija los documentos según las indicaciones.",
            function ($message) use ($postulante) {
                $message->to($postulante->correo)
                    ->subject('Preinscripción observada - Sistema CUP');
            }
        );

        return response()->json([
            'message' => 'Preinscripción marcada como OBSERVADO y notificación enviada al postulante.',
        ]);
    }

    public function rechazar(Request $request, Postulante $postulante)
    {
        $validated = $request->validate([
            'observacion' => ['required', 'string'],
        ]);

        $postulante->update([
            'estado_preinscripcion' => 'RECHAZADO',
            'observacion_admin' => $validated['observacion'],
        ]);

        Mail::raw(
            "Su preinscripción ha sido rechazada por administración.\n\n" .
            "Motivo: {$validated['observacion']}\n\n" .
            "Si tiene dudas, por favor contacte con el área de admisión.",
            function ($message) use ($postulante) {
                $message->to($postulante->correo)
                    ->subject('Preinscripción rechazada - Sistema CUP');
            }
        );

        return response()->json([
            'message' => 'Preinscripción rechazada y notificación enviada al postulante.',
        ]);
    }

    private function createRequisito(Postulante $postulante, string $tipo, $archivo)
    {
        $path = $this->storeFileForPostulante($archivo, $postulante->id, $tipo);

        RequisitoPostulante::create([
            'postulante_id' => $postulante->id,
            'tipo_requisito' => $tipo,
            'archivo_path' => $path,
            'estado' => 'EN_REVISION',
        ]);
    }

    private function storeFileForPostulante($archivo, int $postulanteId, string $prefix): string
    {
        $filename = sprintf('%s_%s.%s', strtolower($prefix), uniqid(), $archivo->getClientOriginalExtension());

        return $archivo->storeAs("preinscripciones/{$postulanteId}", $filename, 'public');
    }

    private function generarRegistroUnico(): string
    {
        do {
            $registro = str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT);
        } while (User::where('registro', $registro)->exists());

        return $registro;
    }

    private function generarPasswordTemporal(): string
    {
        return 'CUP-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
    }
}
