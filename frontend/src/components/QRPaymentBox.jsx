export default function QRPaymentBox() {
  return (
    <div className="payment-row">
      <h4>Realizar pago CUP</h4>
      <div className="qr-card">
        <div className="qr-box">
          <div className="qr-placeholder">
            <div className="qr-grid">
              {Array(25).fill(null).map((_, i) => (
                <div key={i} className="qr-cell" style={{backgroundColor: Math.random() > 0.5 ? '#000' : '#fff'}} />
              ))}
            </div>
          </div>
          <p className="qr-label">Código QR de pago</p>
        </div>
        <div className="qr-details">
          <div className="detail-row">
            <span className="detail-label">Monto:</span>
            <span className="detail-value">Bs. 200</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Concepto:</span>
            <span className="detail-value">Pago de inscripción CUP</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Referencia:</span>
            <span className="detail-value">CUP-PREINSCRIPCION</span>
          </div>
          <div className="payment-instructions">
            <p><strong>Instrucciones:</strong></p>
            <ol>
              <li>Escanea el código QR con tu móvil</li>
              <li>Realiza el pago de Bs. 200</li>
              <li>Guarda el comprobante de pago</li>
              <li>Sube el comprobante en la sección inferior</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
