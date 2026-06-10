<?php

namespace App\Http\Controllers;

use App\Models\Postulante;
use App\Models\PagoPreinscripcion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Stripe;
use Stripe\Checkout\Session;

class StripePaymentController extends Controller
{
    public function checkout(Request $request)
    {
        $request->validate([
            'ci' => ['required', 'string'],
            'correo' => ['required', 'email'],
        ]);

        $postulante = Postulante::where('ci', $request->input('ci'))
            ->where('correo', $request->input('correo'))
            ->first();

        if (!$postulante) {
            return response()->json([
                'message' => 'No se encontró ninguna preinscripción con los datos proporcionados.',
            ], 404);
        }

        if (!in_array($postulante->estado_preinscripcion, ['PAGO_HABILITADO', 'PAGO_OBSERVADO'])) {
            return response()->json([
                'message' => 'El pago no está habilitado o ya se encuentra en revisión/aprobado.',
            ], 422);
        }

        $stripeSecret = config('services.stripe.secret');
        if (empty($stripeSecret)) {
            return response()->json([
                'message' => 'Stripe no está configurado en el servidor.',
            ], 500);
        }

        Stripe::setApiKey($stripeSecret);

        $currency = config('services.stripe.currency', 'usd');
        $amount = config('services.stripe.amount', 10000); // 10000 cents = $100.00
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => 'Pago de Inscripción CUP - UAGRM',
                            'description' => "Postulante CI: {$postulante->ci} | {$postulante->nombres} {$postulante->apellidos}",
                        ],
                        'unit_amount' => $amount,
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $frontendUrl . '/postulante/pago-exitoso?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $frontendUrl . '/consulta',
                'customer_email' => $postulante->correo,
                'metadata' => [
                    'postulante_id' => $postulante->id,
                    'ci' => $postulante->ci,
                ],
            ]);

            return response()->json([
                'checkout_url' => $session->url,
                'session_id' => $session->id,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al conectar con Stripe: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function confirmar(Request $request)
    {
        $request->validate([
            'session_id' => ['required', 'string'],
        ]);

        $stripeSecret = config('services.stripe.secret');
        Stripe::setApiKey($stripeSecret);

        try {
            $session = Session::retrieve($request->input('session_id'));

            if ($session->payment_status !== 'paid') {
                return response()->json([
                    'message' => 'El pago no ha sido completado.',
                ], 400);
            }

            $postulanteId = $session->metadata->postulante_id;
            $postulante = Postulante::find($postulanteId);

            if (!$postulante) {
                return response()->json([
                    'message' => 'Postulante no encontrado.',
                ], 404);
            }

            // Atomically update or create payment log and set status to PAGO_EN_REVISION
            $pago = DB::transaction(function () use ($postulante, $session) {
                $montoReal = $session->amount_total / 100; // convert cents to decimal

                $pago = PagoPreinscripcion::updateOrCreate(
                    ['stripe_session_id' => $session->id],
                    [
                        'postulante_id' => $postulante->id,
                        'monto' => $montoReal,
                        'stripe_payment_intent_id' => $session->payment_intent,
                        'metodo_pago' => 'STRIPE',
                        'estado' => 'PENDIENTE_VALIDACION',
                        'fecha_pago' => now(),
                    ]
                );

                $postulante->update([
                    'estado_preinscripcion' => 'PAGO_EN_REVISION',
                ]);

                return $pago;
            });

            return response()->json([
                'success' => true,
                'message' => 'Pago de Stripe confirmado y registrado como pendiente de validación.',
                'data' => [
                    'ci' => $postulante->ci,
                    'nombres' => $postulante->nombres,
                    'apellidos' => $postulante->apellidos,
                    'monto' => $pago->monto,
                    'stripe_session_id' => $pago->stripe_session_id,
                    'stripe_payment_intent_id' => $pago->stripe_payment_intent_id,
                    'fecha_pago' => $pago->fecha_pago,
                    'estado' => $pago->estado,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al confirmar el pago: ' . $e->getMessage(),
            ], 500);
        }
    }
}
