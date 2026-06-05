import { useState } from 'react';
import ConsultaPreinscripcionPanel from '../components/ConsultaPreinscripcionPanel';
import * as preinscripcionService from '../services/preinscripcion';
import '../styles/preinscripcion.css';

export default function ConsultaPreinscripcion() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSearch = async (data) => {
    setError('');
    setResult(null);
    setUploadError('');
    setUploadSuccess('');
    setLoading(true);

    try {
      const response = await preinscripcionService.consultarPreinscripcion(data);
      const responseData = response.data || response;
      setResult(responseData);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('No se pudo consultar la preinscripción. Verifica tus datos e intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData) => {
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      const response = await preinscripcionService.enviarComprobantePago(formData);
      const responseData = response.data || response;
      setResult(responseData);
      setUploadSuccess('Comprobante enviado correctamente. Espera la revisión de administración.');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setUploadError(err.response.data.message);
      } else {
        setUploadError('Error al enviar el comprobante. Intenta nuevamente.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="public-shell">
      <div className="public-header-panel">
        <div className="public-header-card">
          <div className="public-badge">FICCT - UAGRM</div>
          <h1>Consultar preinscripción</h1>
          <p>Accede al estado de tu solicitud con tu CI y correo electrónico.</p>
        </div>
      </div>

      <main className="public-main">
        <div className="public-content">
          <div className="section-intro">
            <h2>Seguimiento de solicitud</h2>
            <p>Revisa el estado de tus requisitos y sube el comprobante cuando el pago esté habilitado.</p>
          </div>

          <div className="preinscripcion-card consulta-card">
            <ConsultaPreinscripcionPanel
              onSearch={handleSearch}
              onUpload={handleUpload}
              loading={loading}
              uploadLoading={uploading}
              error={error}
              uploadError={uploadError}
              uploadSuccess={uploadSuccess}
              result={result}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
