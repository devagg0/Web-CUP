import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Send } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DocenteFormModal, { buildDocenteFormData } from '../components/DocenteFormModal';
import DocenteDetailModal from '../components/DocenteDetailModal';
import EstadoDocenteBadge from '../components/EstadoDocenteBadge';
import * as docentesService from '../services/docentes';
import * as materiasService from '../services/materias';
import '../styles/docentes.css';

const extractList = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.materias)) return payload.materias;
  return [];
};

const extractPerfil = (response) => response?.data?.docente || response?.data?.perfil || response?.docente || response?.perfil || response?.data || response;

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || data?.error || fallback;
};

const getStoredUser = () => {
  try {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const hasMinimumData = (perfil) => Boolean(
  perfil?.ci
  && perfil?.telefono
  && perfil?.profesion
  && perfil?.especialidad
  && (perfil?.materia_id || perfil?.materia?.id || perfil?.materia_habilitada?.id),
);

const alertByEstado = {
  EN_REVISION: ['info', 'Tu perfil está en revisión por coordinación académica.'],
  HABILITADO: ['success', 'Tu perfil fue aprobado. Ya puedes ser asignado a grupos de tu materia habilitada.'],
  RECHAZADO: ['error', 'Tu perfil fue rechazado. Contacta con coordinación académica.'],
  INACTIVO: ['muted', 'Tu perfil docente está inactivo.'],
};

export default function MiPerfilDocente() {
  const user = getStoredUser();
  const [perfil, setPerfil] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const loadPerfil = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await docentesService.obtenerMiPerfilDocente();
      const data = extractPerfil(response);
      setPerfil(data?.id ? data : null);
    } catch (e) {
      if (e?.response?.status === 404) {
        setPerfil(null);
      } else {
        setError(getBackendError(e, 'No se pudo cargar tu perfil docente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMaterias = async () => {
    try {
      const response = await materiasService.getMateriasActivas();
      const materiasArray = extractList(response);
      console.log('Materias activas normalizadas:', materiasArray);
      setMaterias(materiasArray);
    } catch (e) {
      setError(getBackendError(e, 'No se pudieron cargar las materias.'));
    }
  };

  useEffect(() => {
    loadPerfil();
    loadMaterias();
  }, []);

  const statusAlert = useMemo(() => {
    if (!perfil?.estado_docente) return null;
    if (perfil.estado_docente === 'OBSERVADO') {
      return ['warning', perfil.observacion_admin || 'Tu perfil fue observado. Corrige los datos y vuelve a enviarlo a revisión.'];
    }
    return alertByEstado[perfil.estado_docente] || null;
  }, [perfil]);

  const handleSave = async (formData) => {
    setSaving(true);
    setFormError('');
    try {
      await docentesService.guardarMiPerfilDocente(formData);
      setMessage('Perfil docente guardado correctamente.');
      setFormOpen(false);
      loadPerfil();
    } catch (e) {
      setFormError(getBackendError(e, 'No se pudo guardar tu perfil docente.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSendRevision = async () => {
    if (!perfil?.id || !hasMinimumData(perfil)) return;
    if (!window.confirm('¿Enviar tu perfil docente a revisión?')) return;

    setSaving(true);
    setError('');
    try {
      await docentesService.enviarMiPerfilRevision();
      setMessage('Perfil enviado a revisión correctamente.');
      loadPerfil();
    } catch (e) {
      setError(getBackendError(e, 'No se pudo enviar tu perfil a revisión.'));
    } finally {
      setSaving(false);
    }
  };

  const showSendButton = perfil?.id && hasMinimumData(perfil) && perfil.estado_docente !== 'HABILITADO';

  return (
    <div className="app-shell docentes-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Mi perfil docente" breadcrumb="Sistema de Admisión CUP / Perfil docente" />

        <div className="content-inner">
          <div className="docente-profile-card">
            <div>
              <h2>{user?.name || 'Docente'}</h2>
              <p>{user?.email || user?.correo || 'Sin correo registrado'}</p>
              <strong>Rol Docente</strong>
            </div>
            <div className="profile-status">
              {perfil?.estado_docente ? <EstadoDocenteBadge estado={perfil.estado_docente} /> : <span className="estado-docente-badge pendiente">Sin perfil</span>}
              <span>{perfil?.materia?.nombre || perfil?.materia_habilitada?.nombre || 'Materia pendiente'}</span>
            </div>
          </div>

          {!perfil && !loading && (
            <div className="empty-profile-card">
              <h3>Aún no completaste tu perfil docente.</h3>
              <p>Registra tus datos académicos y documentos para que coordinación pueda revisarlos.</p>
              <button className="btn-primary" type="button" onClick={() => setFormOpen(true)}>
                Completar perfil
              </button>
            </div>
          )}

          {statusAlert && (
            <div className={`docente-alert ${statusAlert[0]}`}>
              {statusAlert[1]}
            </div>
          )}

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          {loading ? (
            <div className="card table-loading">Cargando perfil docente...</div>
          ) : perfil ? (
            <div className="card docente-profile-actions">
              <div>
                <h3>Datos de perfil</h3>
                <p>{perfil.profesion || 'Profesión pendiente'} / {perfil.especialidad || 'Especialidad pendiente'}</p>
              </div>
              <div className="profile-buttons">
                <button className="btn-secondary btn-inline" type="button" onClick={loadPerfil}>
                  <RefreshCcw size={16} /> Actualizar
                </button>
                <button className="btn-secondary" type="button" onClick={() => setDetailOpen(true)}>
                  Ver detalle
                </button>
                <button className="btn-primary" type="button" onClick={() => { setFormError(''); setFormOpen(true); }}>
                  Guardar perfil
                </button>
                {showSendButton && (
                  <button className="btn-primary" type="button" onClick={handleSendRevision} disabled={saving}>
                    <Send size={16} /> Enviar a revisión
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {!perfil && (
            <DocenteFormModal
              open={formOpen}
              mode="docente"
              docente={null}
              materias={materias}
              saving={saving}
              backendError={formError}
              onClose={() => setFormOpen(false)}
              onSubmit={handleSave}
            />
          )}

          {perfil && (
            <DocenteFormModal
              open={formOpen}
              mode="docente"
              docente={perfil}
              materias={materias}
              saving={saving}
              backendError={formError}
              onClose={() => setFormOpen(false)}
              onSubmit={async (formData) => {
                const sanitized = formData instanceof FormData ? formData : buildDocenteFormData(formData, false);
                await handleSave(sanitized);
              }}
            />
          )}

          <DocenteDetailModal docente={detailOpen ? perfil : null} onClose={() => setDetailOpen(false)} />
        </div>
      </main>
    </div>
  );
}
