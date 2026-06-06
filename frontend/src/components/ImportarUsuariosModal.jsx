import { useMemo, useState } from 'react';
import { Download, FileUp, X } from 'lucide-react';
import * as usersService from '../services/users';

const TEMPLATE_HEADER = 'nombres;apellidos;correo;rol;estado';
const TEMPLATE_ROWS = [
  'Juan Carlos;Mendoza Rojas;juan.docente@gmail.com;Docente;ACTIVO',
  'Maria Fernanda;Roca Vargas;maria.coordinador@gmail.com;Coordinador;ACTIVO',
  'Luis Alberto;Vaca Suarez;luis.autoridad@gmail.com;Autoridad;ACTIVO',
];

const getExtension = (fileName = '') => fileName.split('.').pop()?.toLowerCase() || '';

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  return data?.message || data?.error || 'No se pudo completar la importación. Revisa el archivo e intenta nuevamente.';
};

export default function ImportarUsuariosModal({ open, onClose, onImported }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const createdRows = useMemo(() => (Array.isArray(result?.creados) ? result.creados : []), [result]);
  const errorRows = useMemo(() => (Array.isArray(result?.errores) ? result.errores : []), [result]);
  const resumen = result?.resumen || {};

  if (!open) return null;

  const resetAndClose = () => {
    setSelectedFile(null);
    setFieldError('');
    setServerError('');
    setLoading(false);
    setResult(null);
    onClose();
  };

  const downloadTemplate = () => {
    const csv = [TEMPLATE_HEADER, ...TEMPLATE_ROWS].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_usuarios_internos.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validateFile = (file) => {
    if (!file) return 'Selecciona un archivo CSV o TXT para importar.';
    const extension = getExtension(file.name);
    if (!['csv', 'txt'].includes(extension)) {
      return 'El archivo debe tener extensión .csv o .txt.';
    }
    return '';
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setResult(null);
    setServerError('');
    setFieldError(validateFile(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setLoading(true);
    setFieldError('');
    setServerError('');
    setResult(null);

    try {
      const response = await usersService.importarUsuarios(selectedFile);
      const data = response.data || response;
      setResult(data);
      await onImported?.();
    } catch (error) {
      console.error(error);
      setServerError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="detail-modal-overlay importar-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="importar-usuarios-title">
      <div className="detail-modal importar-modal">
        <button type="button" className="detail-close" onClick={resetAndClose} aria-label="Cerrar modal">
          <X size={22} />
        </button>

        <div className="importar-modal-header">
          <div className="importar-icon">
            <FileUp size={26} />
          </div>
          <div>
            <h3 id="importar-usuarios-title">Importar usuarios internos</h3>
            <p>
              Sube un archivo CSV separado por punto y coma (;). Los usuarios importados serán creados con contraseña temporal y recibirán sus credenciales por correo.
            </p>
            <p className="importar-note">
              Los usuarios internos acceden con correo y contraseña temporal. No se genera registro académico.
            </p>
          </div>
        </div>

        <form className="importar-form" onSubmit={handleSubmit}>
          <div className="importar-actions">
            <button type="button" className="btn-secondary importar-template-btn" onClick={downloadTemplate}>
              <Download size={16} /> Descargar plantilla CSV
            </button>
          </div>

          <label className={`importar-file-box ${fieldError ? 'has-error' : ''}`}>
            <FileUp size={28} />
            <span>{selectedFile ? selectedFile.name : 'Seleccionar archivo CSV o TXT'}</span>
            <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={handleFileChange} disabled={loading} />
          </label>

          {fieldError && <div className="importar-error">{fieldError}</div>}
          {serverError && <div className="importar-error">{serverError}</div>}

          <div className="importar-footer">
            <button type="button" className="btn-secondary" onClick={resetAndClose} disabled={loading}>
              Cerrar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Importando usuarios...' : 'Importar'}
            </button>
          </div>
        </form>

        {result && (
          <div className="importar-results">
            <div className="importar-result-summary">
              <div>
                <span>Total filas</span>
                <strong>{resumen.total_filas ?? result.total_filas ?? 0}</strong>
              </div>
              <div>
                <span>Creados</span>
                <strong>{resumen.creados ?? result.creados_count ?? createdRows.length}</strong>
              </div>
              <div>
                <span>Omitidos</span>
                <strong>{resumen.omitidos ?? result.omitidos ?? errorRows.length}</strong>
              </div>
            </div>

            <div className="importar-result-section">
              <h4>Usuarios creados</h4>
              {createdRows.length ? (
                <div className="table-wrapper importar-table-wrapper">
                  <table className="usuarios-table importar-table">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Password temporal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createdRows.map((item, index) => (
                        <tr key={`${item.fila || index}-${item.correo || index}`}>
                          <td>{item.fila || '-'}</td>
                          <td>{item.nombre || item.nombres || item.nombre_completo || '-'}</td>
                          <td>{item.correo || '-'}</td>
                          <td>
                            <span className="importar-badge success">{item.rol || '-'}</span>
                          </td>
                          <td>{item.password_temporal || item.contrasena_temporal || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="importar-empty">No se crearon usuarios.</div>
              )}
            </div>

            <div className="importar-result-section">
              <h4>Errores</h4>
              {errorRows.length ? (
                <div className="table-wrapper importar-table-wrapper">
                  <table className="usuarios-table importar-table">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Correo</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorRows.map((item, index) => (
                        <tr key={`${item.fila || index}-${item.correo || index}`}>
                          <td>{item.fila || '-'}</td>
                          <td>{item.correo || '-'}</td>
                          <td>
                            <span className="importar-badge error">{item.error || item.mensaje || item.message || '-'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="importar-empty">No se reportaron errores.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
