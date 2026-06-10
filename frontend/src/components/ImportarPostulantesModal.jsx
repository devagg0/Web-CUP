import { useMemo, useState } from 'react';
import { Download, FileUp, X } from 'lucide-react';
import * as preinscripcionService from '../services/preinscripcion';

const TEMPLATE_HEADER = 'ci;nombres;apellidos;fecha_nacimiento;sexo;direccion;telefono;correo;colegio_procedencia;ciudad;primera_carrera_id;segunda_carrera_id;estado';
const TEMPLATE_ROWS = [
  '1234567;Juan Carlos;Perez Roca;2006-04-15;MASCULINO;Av. Banzer #123;70000001;juan@gmail.com;Colegio Nacional Florida;Santa Cruz;1;2;INSCRITO',
  '7654321;Maria Fernanda;Vargas Soliz;2006-08-22;FEMENINO;Av. Busch #456;70000002;maria@gmail.com;Colegio Tecnico Santa Cruz;Santa Cruz;2;1;INSCRITO',
];

const getExtension = (fileName = '') => fileName.split('.').pop()?.toLowerCase() || '';

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  return data?.message || data?.error || 'No se pudo completar la importación. Revisa el archivo e intenta nuevamente.';
};

export default function ImportarPostulantesModal({ open, onClose, onImported }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const createdRows = useMemo(() => (Array.isArray(result?.postulantes_creados) ? result.postulantes_creados : []), [result]);
  const omittedRows = useMemo(() => (Array.isArray(result?.postulantes_omitidos) ? result.postulantes_omitidos : []), [result]);
  const errorRows = useMemo(() => (Array.isArray(result?.errores_detalle) ? result.errores_detalle : []), [result]);

  const handlePrintPDF = () => {
    if (!createdRows.length) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes (pop-ups) para descargar el PDF.');
      return;
    }

    const rowsHtml = createdRows.map(item => `
      <tr>
        <td>${item.ci || '-'}</td>
        <td>${item.correo || '-'}</td>
        <td>${item.registro || '-'}</td>
        <td><code>${item.password_temporal || item.contrasena_temporal || '-'}</code></td>
      </tr>
    `).join('');

    const fechaActual = new Date().toLocaleString();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Credenciales generadas por carga masiva CUP</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 40px;
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
          }
          .title {
            font-size: 18px;
            font-weight: 700;
            color: #003b73;
            margin: 0 0 5px 0;
          }
          .subtitle {
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            margin: 0 0 10px 0;
          }
          .date {
            font-size: 11px;
            color: #64748b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #f8fafc;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 2px solid #cbd5e1;
            font-size: 11px;
            text-transform: uppercase;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            word-break: break-all;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          code {
            font-family: monospace;
            font-size: 12px;
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          @media print {
            body {
              margin: 20px;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Credenciales generadas por carga masiva CUP</h1>
          <div class="subtitle">Sistema de Admisión CUP FICCT - UAGRM</div>
          <div class="date">Fecha de generación: ${fechaActual}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>CI</th>
              <th>Correo</th>
              <th>Registro</th>
              <th>Contraseña temporal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <div class="footer">
          Estas credenciales fueron generadas por carga masiva. No se enviaron correos SMTP.
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

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
    link.download = 'plantilla_postulantes_inscritos.csv';
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
      const response = await preinscripcionService.importarPostulantes(selectedFile);
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
    <div className="detail-modal-overlay importar-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="importar-postulantes-title">
      <div className="detail-modal importar-modal">
        <button type="button" className="detail-close" onClick={resetAndClose} aria-label="Cerrar modal">
          <X size={22} />
        </button>

        <div className="importar-modal-header">
          <div className="importar-icon">
            <FileUp size={26} />
          </div>
          <div>
            <h3 id="importar-postulantes-title">Importar postulantes inscritos</h3>
            <p>
              Sube un archivo CSV separado por punto y coma (;). Los postulantes importados serán registrados directamente como INSCRITO. Por seguridad y rendimiento, no se enviarán correos automáticos; descargue el PDF de credenciales al finalizar.
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
              {loading ? 'Importando postulantes...' : 'Importar'}
            </button>
          </div>
        </form>

        {result && (
          <div className="importar-results">
            <div className="importar-result-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' }}>
              <div>
                <span>Total filas</span>
                <strong>{result?.total_filas ?? 0}</strong>
              </div>
              <div>
                <span>Creados</span>
                <strong>{result?.creados ?? 0}</strong>
              </div>
              <div>
                <span>Omitidos</span>
                <strong>{result?.omitidos ?? 0}</strong>
              </div>
              <div>
                <span>Errores</span>
                <strong>{result?.errores ?? 0}</strong>
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', background: '#f0f7ff', border: '1px solid #c7dff7', color: '#003b73', fontWeight: '500', fontSize: '0.9rem' }}>
              En carga masiva no se envían correos. Descargue las credenciales generadas.
            </div>

            <div className="importar-result-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0 }}>Postulantes creados</h4>
                {createdRows.length > 0 && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePrintPDF}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', padding: '8px 14px' }}
                  >
                    <Download size={14} /> Descargar credenciales PDF
                  </button>
                )}
              </div>

              {createdRows.length ? (
                <>
                  {createdRows.length > 100 && (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0', marginBottom: '10px' }}>
                      Mostrando los primeros 100 registros. Descargue el PDF para obtener el listado completo de los {createdRows.length} postulantes creados.
                    </p>
                  )}
                  <div className="table-wrapper importar-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="preinscripciones-table importar-table" style={{ position: 'relative' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#fafbff' }}>
                        <tr>
                          <th>CI</th>
                          <th>Correo</th>
                          <th>Registro</th>
                          <th>Contraseña temporal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdRows.slice(0, 100).map((item, index) => (
                          <tr key={`${item.ci || item.correo || index}`}>
                            <td>{item.ci || '-'}</td>
                            <td>{item.correo || '-'}</td>
                            <td>{item.registro || '-'}</td>
                            <td>{item.password_temporal || item.contrasena_temporal || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="importar-empty">No se crearon postulantes.</div>
              )}
            </div>

            {omittedRows.length > 0 && (
              <div className="importar-result-section">
                <h4>Postulantes omitidos (Ya registrados o duplicados)</h4>
                <div className="table-wrapper importar-table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="preinscripciones-table importar-table">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>CI</th>
                        <th>Correo</th>
                        <th>Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {omittedRows.map((item, index) => (
                        <tr key={`${item.fila || index}-${item.ci || item.correo || index}`}>
                          <td>{item.fila || '-'}</td>
                          <td>{item.ci || '-'}</td>
                          <td>{item.correo || '-'}</td>
                          <td>{item.motivo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {errorRows.length > 0 && (
              <div className="importar-result-section">
                <h4>Errores de validación/procesamiento</h4>
                <div className="table-wrapper importar-table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="preinscripciones-table importar-table">
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>CI / Correo</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorRows.map((item, index) => (
                        <tr key={`${item.fila || index}-${item.ci || item.correo || index}`}>
                          <td>{item.fila || '-'}</td>
                          <td>{item.ci || '-'}</td>
                          <td>{item.error || item.mensaje || item.message || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
