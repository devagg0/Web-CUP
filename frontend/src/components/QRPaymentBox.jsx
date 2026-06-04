export default function QRPaymentBox() {
  return (
    <div className="payment-row">
      <strong>Pago simulado</strong>
      <div className="qr-card">
        <div className="qr-placeholder">QR</div>
        <div className="qr-details">
          <p><strong>Monto:</strong> Bs. 200</p>
          <p><strong>Concepto:</strong> Pago de inscripción CUP</p>
          <p><strong>Referencia:</strong> CUP-PREINSCRIPCION</p>
        </div>
      </div>
      <div className="payment-steps">
        <p>1. Escanea el QR.</p>
        <p>2. Realiza el pago.</p>
        <p>3. Sube el comprobante.</p>
      </div>
    </div>
  );
}
