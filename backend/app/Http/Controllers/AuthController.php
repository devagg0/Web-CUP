<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['nullable', 'email'],
            'identificador' => ['required_without:email', 'string'],
            'password' => ['required'],
        ], [
            'email.email' => 'El campo email debe ser un correo válido.',
            'identificador.required_without' => 'El campo identificador es obligatorio cuando no se envía email.',
            'password.required' => 'El campo password es obligatorio.',
        ]);

        $identifier = $request->input('email', $request->input('identificador'));
        $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL);

        $user = $isEmail
            ? User::where('email', $identifier)->first()
            : User::where('registro', $identifier)->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        if (! $user->isActive()) {
            return response()->json(['message' => 'Usuario inactivo o bloqueado'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;
        $user->load('role');

        return response()->json([
            'message' => 'Inicio de sesión correcto',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'registro' => $user->registro,
                'role' => $user->role?->nombre,
                'estado' => $user->estado,
                'debe_cambiar_password' => $user->debe_cambiar_password,
            ],
        ], 200);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('role');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'registro' => $user->registro,
            'role' => $user->role?->nombre,
            'estado' => $user->estado,
            'debe_cambiar_password' => $user->debe_cambiar_password,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente',
        ]);
    }

    public function cambiarPassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'password_actual' => ['required'],
            'password' => [
                'required',
                'confirmed',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
            ],
        ], [
            'password_actual.required' => 'El campo password_actual es obligatorio.',
            'password.required' => 'El campo password es obligatorio.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, una minúscula y un número.',
        ]);

        if (! Hash::check($validated['password_actual'], $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta',
            ], 422);
        }

        $user->password = Hash::make($validated['password']);
        $user->debe_cambiar_password = false;
        $user->save();

        $currentToken = $request->user()->currentAccessToken();
        if ($currentToken) {
            $user->tokens()->where('id', '!=', $currentToken->id)->delete();
        } else {
            $user->tokens()->delete();
        }

        $user->load('role');

        return response()->json([
            'message' => 'Contraseña actualizada correctamente',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'registro' => $user->registro,
                'role' => $user->role?->nombre,
                'estado' => $user->estado,
                'debe_cambiar_password' => $user->debe_cambiar_password,
            ],
        ], 200);
    }
}
