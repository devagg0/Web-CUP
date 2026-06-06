<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocenteController extends Controller
{
    public function index(Request $request)
    {
        $query = Docente::with(['user.role', 'materia']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($query) use ($search) {
                $query->where('ci', 'ilike', "%{$search}%")
                    ->orWhere('telefono', 'ilike', "%{$search}%")
                    ->orWhere('profesion', 'ilike', "%{$search}%")
                    ->orWhere('especialidad', 'ilike', "%{$search}%")
                    ->orWhereHas('user', function ($query) use ($search) {
                        $query->where('name', 'ilike', "%{$search}%")
                            ->orWhere('email', 'ilike', "%{$search}%");
                    })
                    ->orWhereHas('materia', function ($query) use ($search) {
                        $query->where('nombre', 'ilike', "%{$search}%")
                            ->orWhere('codigo', 'ilike', "%{$search}%");
                    });
            });
        }

        if ($request->filled('estado_docente')) {
            $query->where('estado_docente', $request->query('estado_docente'));
        }

        if ($request->filled('materia_id')) {
            $query->where('materia_id', $request->query('materia_id'));
        }

        $docentes = $query->orderBy('id')->paginate(10);
        $docentes->getCollection()->transform(fn (Docente $docente) => $this->transformDocente($docente));

        return response()->json($docentes);
    }

    public function habilitados(Request $request)
    {
        $query = Docente::with(['user.role', 'materia'])
            ->where('estado_docente', Docente::ESTADO_HABILITADO);

        if ($request->filled('materia_id')) {
            $query->where('materia_id', $request->query('materia_id'));
        }

        $docentes = $query->orderBy('id')->get()
            ->map(fn (Docente $docente) => $this->transformDocente($docente));

        return response()->json([
            'data' => $docentes,
        ]);
    }

    public function usuariosDisponibles()
    {
        $usuarios = User::with('role')
            ->whereDoesntHave('docente')
            ->whereHas('role', function ($query) {
                $query->whereRaw('LOWER(nombre) = ?', ['docente']);
            })
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'estado' => $user->estado,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'nombre' => $user->role->nombre,
                    'descripcion' => $user->role->descripcion,
                ] : null,
            ]);

        return response()->json([
            'data' => $usuarios,
        ]);
    }

    public function show(Docente $docente)
    {
        $docente->load(['user.role', 'materia', 'aprobadoPor.role']);

        return response()->json($this->transformDocente($docente, true));
    }

    public function store(Request $request)
    {
        $validated = $this->validateDocente($request);

        $docente = Docente::create($validated);
        $this->storeFiles($request, $docente);
        $docente->load(['user.role', 'materia']);

        return response()->json([
            'message' => 'Perfil docente creado correctamente',
            'docente' => $this->transformDocente($docente, true),
        ], 201);
    }

    public function update(Request $request, Docente $docente)
    {
        $validated = $this->validateDocente($request, $docente);

        $docente->update($validated);
        $this->storeFiles($request, $docente);
        $docente->load(['user.role', 'materia', 'aprobadoPor.role']);

        return response()->json([
            'message' => 'Perfil docente actualizado correctamente',
            'docente' => $this->transformDocente($docente, true),
        ]);
    }

    public function enviarRevision(Docente $docente)
    {
        $docente->update([
            'estado_docente' => Docente::ESTADO_EN_REVISION,
            'fecha_envio_revision' => now(),
        ]);

        return response()->json([
            'message' => 'Perfil docente enviado a revision correctamente',
            'docente' => $this->transformDocente($docente->fresh(['user.role', 'materia']), true),
        ]);
    }

    public function aprobar(Request $request, Docente $docente)
    {
        $errores = $this->validarRequisitosAprobacion($docente);

        if ($errores !== []) {
            return response()->json([
                'message' => 'El docente no cumple los requisitos para aprobacion',
                'errors' => $errores,
            ], 422);
        }

        $docente->update([
            'estado_docente' => Docente::ESTADO_HABILITADO,
            'fecha_aprobacion' => now(),
            'aprobado_por' => $request->user()->id,
            'observacion_admin' => null,
        ]);

        return response()->json([
            'message' => 'Docente habilitado correctamente',
            'docente' => $this->transformDocente($docente->fresh(['user.role', 'materia', 'aprobadoPor.role']), true),
        ]);
    }

    public function observar(Request $request, Docente $docente)
    {
        $validated = $request->validate([
            'observacion_admin' => ['required', 'string'],
        ]);

        $docente->update([
            'estado_docente' => Docente::ESTADO_OBSERVADO,
            'observacion_admin' => $validated['observacion_admin'],
        ]);

        return response()->json([
            'message' => 'Docente observado correctamente',
            'docente' => $this->transformDocente($docente->fresh(['user.role', 'materia']), true),
        ]);
    }

    public function rechazar(Request $request, Docente $docente)
    {
        $validated = $request->validate([
            'observacion_admin' => ['required', 'string'],
        ]);

        $docente->update([
            'estado_docente' => Docente::ESTADO_RECHAZADO,
            'observacion_admin' => $validated['observacion_admin'],
        ]);

        return response()->json([
            'message' => 'Docente rechazado correctamente',
            'docente' => $this->transformDocente($docente->fresh(['user.role', 'materia']), true),
        ]);
    }

    public function inactivar(Docente $docente)
    {
        $docente->update([
            'estado_docente' => Docente::ESTADO_INACTIVO,
        ]);

        return response()->json([
            'message' => 'Docente inactivado correctamente',
            'docente' => $this->transformDocente($docente->fresh(['user.role', 'materia']), true),
        ]);
    }

    public function miPerfil(Request $request)
    {
        $docente = Docente::with(['user.role', 'materia', 'aprobadoPor.role'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $docente) {
            return response()->json([
                'message' => 'Perfil docente no encontrado',
            ], 404);
        }

        return response()->json($this->transformDocente($docente, true));
    }

    public function guardarMiPerfil(Request $request)
    {
        $docente = Docente::where('user_id', $request->user()->id)->first();
        $validated = $this->validateDocente($request, $docente, $request->user()->id, false);
        $validated['user_id'] = $request->user()->id;

        if ($docente) {
            $docente->update($validated);
        } else {
            $docente = Docente::create($validated);
        }

        $this->storeFiles($request, $docente);
        $docente->load(['user.role', 'materia', 'aprobadoPor.role']);

        return response()->json([
            'message' => 'Perfil docente guardado correctamente',
            'docente' => $this->transformDocente($docente, true),
        ], $docente->wasRecentlyCreated ? 201 : 200);
    }

    public function enviarMiPerfilRevision(Request $request)
    {
        $docente = Docente::where('user_id', $request->user()->id)->first();

        if (! $docente) {
            return response()->json([
                'message' => 'Perfil docente no encontrado',
            ], 404);
        }

        return $this->enviarRevision($docente);
    }

    private function validateDocente(
        Request $request,
        ?Docente $docente = null,
        ?int $forcedUserId = null,
        bool $allowEstado = true
    ): array {
        $docenteId = $docente?->id;
        $userRule = $forcedUserId
            ? ['sometimes']
            : ['required', Rule::exists('users', 'id')];

        $validated = $request->validate([
            'user_id' => $userRule,
            'ci' => ['required', 'string', 'max:50', Rule::unique('docentes', 'ci')->ignore($docenteId)],
            'telefono' => ['required', 'string', 'max:50'],
            'profesion' => ['required', 'string', 'max:255'],
            'especialidad' => ['required', 'string', 'max:255'],
            'materia_id' => ['required', Rule::exists('materias', 'id')],
            'tiene_maestria' => ['required', 'boolean'],
            'tiene_diplomado' => ['required', 'boolean'],
            'anios_experiencia' => ['nullable', 'integer', 'min:0'],
            'estado_docente' => [$allowEstado ? 'sometimes' : 'prohibited', Rule::in(Docente::ESTADOS)],
            'titulo_profesional' => ['sometimes', 'file', 'max:10240'],
            'certificado_maestria' => ['sometimes', 'file', 'max:10240'],
            'certificado_diplomado' => ['sometimes', 'file', 'max:10240'],
            'cv' => ['sometimes', 'file', 'max:10240'],
        ]);

        $validated['user_id'] = $forcedUserId ?: (int) $validated['user_id'];
        $this->validateUserIsDocente($validated['user_id'], $docenteId);

        if (! array_key_exists('estado_docente', $validated)) {
            $validated['estado_docente'] = $docente?->estado_docente ?: Docente::ESTADO_PERFIL_PENDIENTE;
        }

        unset(
            $validated['titulo_profesional'],
            $validated['certificado_maestria'],
            $validated['certificado_diplomado'],
            $validated['cv']
        );

        return $validated;
    }

    private function validateUserIsDocente(int $userId, ?int $docenteId = null): void
    {
        $user = User::with('role')->find($userId);

        if (! $user || $this->normalizeRole($user->role?->nombre ?? '') !== 'docente') {
            abort(response()->json([
                'message' => 'El usuario seleccionado debe tener rol Docente',
            ], 422));
        }

        $exists = Docente::where('user_id', $userId)
            ->when($docenteId, fn ($query) => $query->where('id', '<>', $docenteId))
            ->exists();

        if ($exists) {
            abort(response()->json([
                'message' => 'El usuario ya tiene un perfil docente',
            ], 422));
        }
    }

    private function storeFiles(Request $request, Docente $docente): void
    {
        $files = [
            'titulo_profesional' => 'titulo_profesional_path',
            'certificado_maestria' => 'certificado_maestria_path',
            'certificado_diplomado' => 'certificado_diplomado_path',
            'cv' => 'cv_path',
        ];

        $changes = [];

        foreach ($files as $input => $column) {
            if (! $request->hasFile($input)) {
                continue;
            }

            $changes[$column] = $request->file($input)->store("docentes/{$docente->id}", 'public');
        }

        if ($changes !== []) {
            $docente->update($changes);
        }
    }

    private function validarRequisitosAprobacion(Docente $docente): array
    {
        $errores = [];

        if (! filled($docente->profesion)) {
            $errores['profesion'][] = 'La profesion es obligatoria para aprobar';
        }

        if (! filled($docente->especialidad)) {
            $errores['especialidad'][] = 'La especialidad es obligatoria para aprobar';
        }

        if (! $docente->materia()->exists()) {
            $errores['materia_id'][] = 'La materia es obligatoria para aprobar';
        }

        if (! $docente->tiene_maestria) {
            $errores['tiene_maestria'][] = 'El docente debe tener maestria';
        }

        if (! $docente->tiene_diplomado) {
            $errores['tiene_diplomado'][] = 'El docente debe tener diplomado';
        }

        if (! $docente->titulo_profesional_path) {
            $errores['titulo_profesional'][] = 'El titulo profesional es obligatorio para aprobar';
        }

        if (! $docente->certificado_maestria_path) {
            $errores['certificado_maestria'][] = 'El certificado de maestria es obligatorio para aprobar';
        }

        if (! $docente->certificado_diplomado_path) {
            $errores['certificado_diplomado'][] = 'El certificado de diplomado es obligatorio para aprobar';
        }

        return $errores;
    }

    private function transformDocente(Docente $docente, bool $detalle = false): array
    {
        $data = [
            'id' => $docente->id,
            'user_id' => $docente->user_id,
            'nombre_usuario' => $docente->user?->name,
            'correo_usuario' => $docente->user?->email,
            'ci' => $docente->ci,
            'telefono' => $docente->telefono,
            'profesion' => $docente->profesion,
            'especialidad' => $docente->especialidad,
            'materia' => $docente->materia ? [
                'id' => $docente->materia->id,
                'nombre' => $docente->materia->nombre,
                'codigo' => $docente->materia->codigo,
            ] : null,
            'tiene_maestria' => $docente->tiene_maestria,
            'tiene_diplomado' => $docente->tiene_diplomado,
            'estado_docente' => $docente->estado_docente,
            'observacion_admin' => $docente->observacion_admin,
            'grupos_asignados_actuales' => 0,
            'capacidad_grupos_maxima' => 4,
            'created_at' => $docente->created_at?->toDatetimeString(),
        ];

        if ($detalle) {
            $data = array_merge($data, [
                'anios_experiencia' => $docente->anios_experiencia,
                'titulo_profesional_url' => $docente->titulo_profesional_url,
                'certificado_maestria_url' => $docente->certificado_maestria_url,
                'certificado_diplomado_url' => $docente->certificado_diplomado_url,
                'cv_url' => $docente->cv_url,
                'fecha_envio_revision' => $docente->fecha_envio_revision?->toDatetimeString(),
                'fecha_aprobacion' => $docente->fecha_aprobacion?->toDatetimeString(),
                'aprobado_por' => $docente->aprobadoPor ? [
                    'id' => $docente->aprobadoPor->id,
                    'name' => $docente->aprobadoPor->name,
                    'email' => $docente->aprobadoPor->email,
                ] : null,
                'updated_at' => $docente->updated_at?->toDatetimeString(),
            ]);
        }

        return $data;
    }

    private function normalizeRole(string $role): string
    {
        $role = mb_strtolower(trim($role));

        return match ($role) {
            'administrador' => 'admin',
            default => $role,
        };
    }
}
