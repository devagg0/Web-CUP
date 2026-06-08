<?php

namespace App\Http\Controllers;

use App\Models\GrupoCup;
use App\Services\GrupoHorarioService;
use Illuminate\Http\Request;
use RuntimeException;

class GrupoHorarioController extends Controller
{
    public function __construct(private GrupoHorarioService $grupoHorarioService)
    {
    }

    public function miGrupoHorario(Request $request)
    {
        try {
            return response()->json(
                $this->grupoHorarioService->obtenerHorarioPostulante($request->user())
            );
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function horarioGrupo(GrupoCup $grupo)
    {
        return response()->json(
            $this->grupoHorarioService->obtenerHorarioGrupo($grupo)
        );
    }
}
