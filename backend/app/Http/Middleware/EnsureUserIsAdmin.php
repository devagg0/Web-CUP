<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || $user->role?->nombre !== 'admin') {
            return response()->json([
                'message' => 'No tienes permisos para realizar esta acción',
            ], 403);
        }

        return $next($request);
    }
}
