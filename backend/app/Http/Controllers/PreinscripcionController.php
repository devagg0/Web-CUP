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
                'required',
                'integer',
                Rule::exists('carreras', 'id')->where('estado', 'ACTIVA'),
                'different:primera_carrera_id',
            ],
            'titulo_bachiller' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'carnet_identidad' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'otros' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

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
                'segunda_carrera_id' => $validated['segunda_carrera_id'],
                'estado_preinscripcion' => 'EN_REVISION_REQUISITOS',
            ]);

            $this->createRequisito($postulante, 'TITULO_BACHILLER', $request->file('titulo_bachiller'));
            $this->createRequisito($postulante, 'CARNET_IDENTIDAD', $request->file('carnet_identidad'));

            if ($request->hasFile('otros')) {
                $this->createRequisito($postulante, 'OTROS', $request->file('otros'));
            }
        });

        $postulante->refresh()->load([
            'primeraCarrera:id,nombre',
            'segundaCarrera:id,nombre',
            'requisitos',
        ]);

        return response()->json([
            'message' => 'Solicitud de preinscripción enviada correctamente. Sus requisitos serán revisados por administración.',
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
                'segunda_carrera' => $postulante->segundaCarrera
                    ? ['id' => $postulante->segundaCarrera->id, 'nombre' => $postulante->segundaCarrera->nombre]
                    : null,
            ],
            'estado' => $postulante->estado_preinscripcion,
        ], 201);
    }

    public function consultar(Request $request)
    {
        $validated = $request->validate([
            'ci' => ['required', 'string', 'max:20'],
            'correo' => ['required', 'email', 'max:150'],
        ]);

        $postulante = Postulante::with([
            'primeraCarrera:id,nombre',
            'segundaCarrera:id,nombre',
            'requisitos',
            'pago',
        ])
            ->where('ci', $validated['ci'])
            ->where('correo', $validated['correo'])
            ->first();

        if (! $postulante) {
            return response()->json([
                'message' => 'No se encontró ninguna preinscripción para los datos proporcionados.',
            ], 404);
        }

        $qr = null;
        if ($postulante->estado_preinscripcion === 'PAGO_HABILITADO') {
            $qr = [
                'monto' => 200,
                'concepto' => 'Pago de inscripción CUP',
                'referencia' => 'CUP-PREINSCRIPCION',
                'qr_text' => 'CUP-PREINSCRIPCION|200|'.$postulante->ci,
                'qr_url' => null,
            ];
        }

        return response()->json([
            'postulante' => [
                'id' => $postulante->id,
                'ci' => $postulante->ci,
                'nombres' => $postulante->nombres,
                'apellidos' => $postulante->apellidos,
                'correo' => $postulante->correo,
                'telefono' => $postulante->telefono,
                'direccion' => $postulante->direccion,
                'colegio_procedencia' => $postulante->colegio_procedencia,
                'ciudad' => $postulante->ciudad,
                'fecha_nacimiento' => $postulante->fecha_nacimiento,
                'sexo' => $postulante->sexo,
                'estado_preinscripcion' => $postulante->estado_preinscripcion,
                'observacion_admin' => $postulante->observacion_admin,
                'fecha_aprobacion' => $postulante->fecha_aprobacion,
                'primera_carrera' => $postulante->primeraCarrera
                    ? ['id' => $postulante->primeraCarrera->id, 'nombre' => $postulante->primeraCarrera->nombre]
                    : null,
                'segunda_carrera' => $postulante->segundaCarrera
                    ? ['id' => $postulante->segundaCarrera->id, 'nombre' => $postulante->segundaCarrera->nombre]
                    : null,
                'requisitos' => $postulante->requisitos->map(function ($requisito) {
                    return [
                        'id' => $requisito->id,
                        'tipo_requisito' => $requisito->tipo_requisito,
                        'estado' => $requisito->estado,
                        'archivo_url' => $requisito->archivo_url,
                        'observacion' => $requisito->observacion,
                    ];
                }),
                'pago' => $postulante->pago ? [
                    'id' => $postulante->pago->id,
                    'monto' => $postulante->pago->monto,
                    'estado' => $postulante->pago->estado,
                    'comprobante_url' => $postulante->pago->comprobante_url,
                    'observacion' => $postulante->pago->observacion,
                ] : null,
                'qr' => $qr,
            ],
        ]);
    }

    public function pago(Request $request)
    {
        $validated = $request->validate([
            'ci' => ['required', 'string', 'max:20'],
            'correo' => ['required', 'email', 'max:150'],
            'comprobante_pago' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $postulante = Postulante::where('ci', $validated['ci'])
            ->where('correo', $validated['correo'])
            ->first();

        if (! $postulante) {
            return response()->json([
                'message' => 'No se encontró ninguna preinscripción para los datos proporcionados.',
            ], 404);
        }

        if ($postulante->estado_preinscripcion !== 'PAGO_HABILITADO') {
            return response()->json([
                'message' => 'El comprobante de pago solo puede subirse cuando la preinscripción está habilitada para pago.',
            ], 422);
        }

        $comprobantePath = $this->storeFileForPostulante($request->file('comprobante_pago'), $postulante->id, 'comprobante_pago');

        if ($postulante->pago) {
            $postulante->pago->update([
                'monto' => 200,
                'comprobante_path' => $comprobantePath,
                'estado' => 'EN_REVISION',
                'observacion' => null,
            ]);
        } else {
            $postulante->pago()->create([
                'monto' => 200,
                'comprobante_path' => $comprobantePath,
                'estado' => 'EN_REVISION',
            ]);
        }

        $postulante->update(['estado_preinscripcion' => 'PAGO_EN_REVISION']);

        return response()->json([
            'message' => 'Comprobante de pago enviado correctamente. Será revisado por administración.',
            'estado' => 'PAGO_EN_REVISION',
        ]);
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

    public function aprobarRequisitos(Postulante $postulante)
    {
        if ($postulante->estado_preinscripcion !== 'EN_REVISION_REQUISITOS') {
            return response()->json([
                'message' => 'Solo se pueden aprobar requisitos en estado EN_REVISION_REQUISITOS.',
            ], 422);
        }

        DB::transaction(function () use ($postulante) {
            $postulante->requisitos()->update(['estado' => 'APROBADO']);
            $postulante->update(['estado_preinscripcion' => 'PAGO_HABILITADO']);
        });

        Mail::raw(
            "Estimado/a {$postulante->nombres} {$postulante->apellidos},\n\n" .
            "Sus requisitos han sido aprobados. Ahora puede consultar su preinscripción con CI y correo para subir el comprobante de pago.\n\n" .
            "Concepto: Pago de inscripción CUP\n" .
            "Monto: 200\n" .
            "Referencia: CUP-PREINSCRIPCION\n\n" .
            "Por favor continúe con el pago sobre la plataforma indicada.",
            function ($message) use ($postulante) {
                $message->to($postulante->correo)
                    ->subject('Requisitos aprobados - Sistema CUP');
            }
        );

        return response()->json([
            'message' => 'Requisitos aprobados. Pago habilitado para el postulante.',
            'estado' => 'PAGO_HABILITADO',
        ]);
    }

    public function observarRequisitos(Request $request, Postulante $postulante)
    {
        $validated = $request->validate([
            'observacion' => ['required', 'string'],
        ]);

        if ($postulante->estado_preinscripcion !== 'EN_REVISION_REQUISITOS') {
            return response()->json([
                'message' => 'Solo se pueden observar requisitos en estado EN_REVISION_REQUISITOS.',
            ], 422);
        }

        DB::transaction(function () use ($postulante, $validated) {
            $postulante->requisitos()->update(['estado' => 'OBSERVADO']);
            $postulante->update([
                'estado_preinscripcion' => 'REQUISITOS_OBSERVADOS',
                'observacion_admin' => $validated['observacion'],
            ]);
        });

        Mail::raw(
            "Estimado/a {$postulante->nombres} {$postulante->apellidos},\n\n" .
            "Su preinscripción ha sido observada por administración.\n\n" .
            "Observación: {$validated['observacion']}\n\n" .
            "Por favor revise y vuelva a cargar los documentos según las indicaciones.",
            function ($message) use ($postulante) {
                $message->to($postulante->correo)
                    ->subject('Requisitos observados - Sistema CUP');
            }
        );

        return response()->json([
            'message' => 'Requisitos observados. Se envió notificación al postulante.',
            'estado' => 'REQUISITOS_OBSERVADOS',
        ]);
    }

    public function aprobarPago(Postulante $postulante)
    {
        if ($postulante->estado_preinscripcion !== 'PAGO_EN_REVISION') {
            return response()->json([
                'message' => 'Solo se puede aprobar pago en estado PAGO_EN_REVISION.',
            ], 422);
        }

        if (! $postulante->pago || ! $postulante->pago->comprobante_path) {
            return response()->json([
                'message' => 'No existe comprobante de pago para esta preinscripción.',
            ], 422);
        }

        $rolPostulante = Role::where('nombre', 'postulante')->first();

        if (! $rolPostulante) {
            return response()->json([
                'message' => 'Rol postulante no configurado en el sistema.',
            ], 500);
        }

        $registro = $this->generarRegistroSecuencial();
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

            $postulante->pago->update(['estado' => 'APROBADO']);
        });

        Mail::raw(
            "Estimado/a {$postulante->nombres} {$postulante->apellidos},\n\n" .
            "Su pago ha sido aprobado y su usuario ha sido generado correctamente.\n\n" .
            "Registro: {$registro}\n" .
            "Contraseña temporal: {$passwordTemporal}\n\n" .
            "Por favor ingrese al sistema y cambie su contraseña en el primer acceso.",
            function ($message) use ($postulante) {
                $message->to($postulante->correo)
                    ->subject('Pago aprobado - Sistema CUP');
            }
        );

        return response()->json([
            'message' => 'Pago aprobado. Usuario postulante generado correctamente.',
            'credenciales' => [
                'registro' => $registro,
                'password_temporal' => $passwordTemporal,
            ],
            'estado' => 'INSCRITO',
        ]);
    }

    public function observarPago(Request $request, Postulante $postulante)
    {
        $validated = $request->validate([
            'observacion' => ['required', 'string'],
        ]);

        if (! $postulante->pago) {
            return response()->json([
                'message' => 'No existe pago registrado para esta preinscripción.',
            ], 422);
        }

        if ($postulante->estado_preinscripcion !== 'PAGO_EN_REVISION') {
            return response()->json([
                'message' => 'Solo se puede observar pago en estado PAGO_EN_REVISION.',
            ], 422);
        }

        DB::transaction(function () use ($postulante, $validated) {
            $postulante->pago->update([
                'estado' => 'OBSERVADO',
                'observacion' => $validated['observacion'],
            ]);
            $postulante->update([
                'estado_preinscripcion' => 'PAGO_OBSERVADO',
                'observacion_admin' => $validated['observacion'],
            ]);
        });

        Mail::raw(
            "Estimado/a {$postulante->nombres} {$postulante->apellidos},\n\n" .
            "Su comprobante de pago ha sido observado por administración.\n\n" .
            "Observación: {$validated['observacion']}\n\n" .
            "Por favor revise la observación y cargue un nuevo comprobante si es necesario.",
            function ($message) use ($postulante) {
                $message->to($postulante->correo)
                    ->subject('Pago observado - Sistema CUP');
            }
        );

        return response()->json([
            'message' => 'Pago observado. Notificación enviada al postulante.',
            'estado' => 'PAGO_OBSERVADO',
        ]);
    }

    public function aprobar(Postulante $postulante)
    {
        if ($postulante->estado_preinscripcion === 'EN_REVISION_REQUISITOS') {
            return $this->aprobarRequisitos($postulante);
        }

        if ($postulante->estado_preinscripcion === 'PAGO_EN_REVISION') {
            return $this->aprobarPago($postulante);
        }

        return response()->json([
            'message' => 'No se puede aprobar esta preinscripción en el estado actual.',
        ], 422);
    }

    public function observar(Request $request, Postulante $postulante)
    {
        if ($postulante->estado_preinscripcion === 'EN_REVISION_REQUISITOS') {
            return $this->observarRequisitos($request, $postulante);
        }

        if ($postulante->estado_preinscripcion === 'PAGO_EN_REVISION') {
            return $this->observarPago($request, $postulante);
        }

        return response()->json([
            'message' => 'No se puede observar esta preinscripción en el estado actual.',
        ], 422);
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

    private function generarRegistroSecuencial(): string
    {
        $maxRegistro = DB::table('users')
            ->selectRaw("MAX(CAST(registro AS BIGINT)) as max_registro")
            ->whereNotNull('registro')
            ->whereRaw("registro ~ '^[0-9]+$'")
            ->value('max_registro');

        if (! $maxRegistro) {
            return '219051216';
        }

        $next = (string) (((int) $maxRegistro) + 1);

        if (User::where('registro', $next)->exists()) {
            throw new \RuntimeException('No fue posible generar un registro único.');
        }

        return $next;
    }

    private function generarPasswordTemporal(): string
    {
        return 'CUP-' . str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
    }
}
