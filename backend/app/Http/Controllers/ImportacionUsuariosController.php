<?php

namespace App\Http\Controllers;

use App\Services\ImportadorUsuariosService;
use Illuminate\Http\Request;

class ImportacionUsuariosController extends Controller
{
    public function __construct(private readonly ImportadorUsuariosService $importadorUsuarios)
    {
    }

    public function importar(Request $request)
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            return response()->json(
                $this->importadorUsuarios->importar($request->file('archivo'))
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json(json_decode($exception->getMessage(), true), 422);
        } catch (\RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }
}
