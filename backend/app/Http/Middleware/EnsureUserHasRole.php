<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (! $user || ! $user->role) {
            return response()->json([
                'message' => 'No tienes permisos para realizar esta accion',
            ], 403);
        }

        $userRole = $this->normalizeRole($user->role->nombre);
        $allowedRoles = array_map(fn (string $role) => $this->normalizeRole($role), $roles);

        if (! in_array($userRole, $allowedRoles, true)) {
            return response()->json([
                'message' => 'No tienes permisos para realizar esta accion',
            ], 403);
        }

        return $next($request);
    }

    private function normalizeRole(string $role): string
    {
        $normalized = Str::lower(trim($role));

        return match ($normalized) {
            'administrador' => 'admin',
            default => $normalized,
        };
    }
}
