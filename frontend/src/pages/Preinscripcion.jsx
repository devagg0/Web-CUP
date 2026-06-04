import { useEffect, useState } from 'react';
import PreinscripcionForm from '../components/PreinscripcionForm';
import PreinscripcionSuccess from '../components/PreinscripcionSuccess';
import * as preinscripcionService from '../services/preinscripcion';
import '../styles/preinscripcion.css';

export default function Preinscripcion() {
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    async function loadCarreras() {
      setError('');
      setLoading(true);
      try {
        const response = await preinscripcionService.getCarrerasActivas();
        const data = response.data || response;
        setCarreras(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las carreras activas. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    }

    loadCarreras();
  }, []);

  const handleSubmit = async (formData) => {
    setError('');
    setSubmitting(true);
    try {
      const response = await preinscripcionService.submitPreinscripcion(formData);
      const data = response.data || response;
      setSuccessData(data);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('Error al enviar la preinscripción. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-shell">
      <div className="public-header-panel">
        <div className="public-header-card">
          <div className="public-badge">FICCT - UAGRM</div>
          <h1>Preinscripción CUP</h1>
          <p>
            Completa tu solicitud para iniciar el proceso de admisión al curso preuniversitario.
          </p>
        </div>
      </div>

      <main className="public-main">
        <div className="public-content">
          <div className="section-intro">
            <h2>Formulario de Preinscripción</h2>
            <p>
              Llena tus datos personales, selecciona carreras, sube requisitos y carga tu comprobante de pago.
            </p>
          </div>

          {successData ? (
            <PreinscripcionSuccess data={successData} />
          ) : (
            <div className="preinscripcion-card">
              {loading ? (
                <div className="loading-message">Cargando datos de preinscripción...</div>
              ) : (
                <PreinscripcionForm
                  carreras={carreras}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              )}
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
        </div>
      </main>
    </div>
  );
}
