<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $role = $request->query('role');
        $estado = $request->query('estado');

        $query = User::with('role')
            ->whereHas('role', function ($query) {
                $query->where('nombre', '<>', 'postulante');
            });

        if ($search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('estado', 'ilike', "%{$search}%")
                    ->orWhereHas('role', function ($query) use ($search) {
                        $query->where('nombre', 'ilike', "%{$search}%");
                    });
            });
        }

        if ($role) {
            $query->whereRelation('role', 'nombre', $role);
        }

        if ($estado) {
            $query->where('estado', $estado);
        }

        $users = $query->orderBy('id')->paginate(10);
        $users->getCollection()->transform(function (User $user) {
            return $this->transformUser($user);
        });

        return response()->json($users);
    }

    public function show(User $user)
    {
        $user->load('role');

        if ($user->role?->nombre === 'postulante') {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        return response()->json($this->transformUser($user));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', Password::min(8)->mixedCase()->numbers()],
            'role_id' => ['required', Rule::exists('roles', 'id')],
            'estado' => ['required', Rule::in(['ACTIVO', 'INACTIVO', 'BLOQUEADO'])],
        ]);

        if ($this->isPostulanteRole($validated['role_id'])) {
            return response()->json([
                'message' => 'No se permite crear postulantes desde este módulo',
            ], 422);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'estado' => $validated['estado'],
        ]);

        $user->load('role');

        return response()->json([
            'message' => 'Usuario creado correctamente',
            'user' => $this->transformUser($user),
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $user->load('role');

        if ($user->role?->nombre === 'postulante') {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['sometimes', 'nullable', Password::min(8)->mixedCase()->numbers()],
            'role_id' => ['required', Rule::exists('roles', 'id')],
            'estado' => ['required', Rule::in(['ACTIVO', 'INACTIVO', 'BLOQUEADO'])],
        ]);

        if ($this->isPostulanteRole($validated['role_id'])) {
            return response()->json([
                'message' => 'No se permite asignar rol postulante desde este módulo',
            ], 422);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role_id = $validated['role_id'];
        $user->estado = $validated['estado'];

        if ($request->filled('password')) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();
        $user->load('role');

        return response()->json([
            'message' => 'Usuario actualizado correctamente',
            'user' => $this->transformUser($user),
        ]);
    }

    public function updateEstado(Request $request, User $user)
    {
        $user->load('role');

        if ($user->role?->nombre === 'postulante') {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        $validated = $request->validate([
            'estado' => ['required', Rule::in(['ACTIVO', 'INACTIVO', 'BLOQUEADO'])],
        ]);

        if ($request->user()->id === $user->id && in_array($validated['estado'], ['INACTIVO', 'BLOQUEADO'], true)) {
            return response()->json([
                'message' => 'No puedes desactivar o bloquear tu propio usuario',
            ], 422);
        }

        $user->estado = $validated['estado'];
        $user->save();

        return response()->json([
            'message' => 'Estado del usuario actualizado correctamente',
            'user' => $this->transformUser($user),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $user->load('role');

        if ($user->role?->nombre === 'postulante') {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'No puedes desactivar o bloquear tu propio usuario',
            ], 422);
        }

        $user->estado = 'INACTIVO';
        $user->save();

        return response()->json([
            'message' => 'Usuario desactivado correctamente',
        ]);
    }

    public function roles()
    {
        $roles = Role::whereIn('nombre', ['admin', 'docente', 'coordinador', 'autoridad'])
            ->get(['id', 'nombre', 'descripcion']);

        return response()->json(['data' => $roles]);
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'nombre' => $user->role->nombre,
                'descripcion' => $user->role->descripcion,
            ] : null,
            'estado' => $user->estado,
            'created_at' => $user->created_at?->toDatetimeString(),
            'updated_at' => $user->updated_at?->toDatetimeString(),
        ];
    }

    private function isPostulanteRole(int $roleId): bool
    {
        return Role::where('nombre', 'postulante')->value('id') === $roleId;
    }
}
