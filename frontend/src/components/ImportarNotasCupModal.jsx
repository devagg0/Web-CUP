import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

const template = [
  'ci;materia;parcial_1;parcial_2;parcial_3;grupo_id;docente_id',
  '9101001;Computacion;80;85;90;1;1',
  '',
  'postulante_id;materia_id;parcial_1;parcial_2;parcial_3;grupo_id;docente_id',
  '1;1;80;85;90;1;1',
].join('\n');

const normalizeImportErrors = (result) => {
  const errors = result?.errores || result?.errors || result?.fallidos || [];
  if (Array.isArray(errors)) return errors;
  if (typeof errors === 'object') return Object.values(errors).flat();
  return [];
};

export default function ImportarNotasCupModal({ open, onClose, onImport, importing = false, error = '', result }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  if (!open) return null;

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  const handleDownload = () => {
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-notas-cup.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('archivo', file);
    onImport?.(formData);
  };

  const importErrors = normalizeImportErrors(result);

  return (
    <div className="detail-modal-overlay examenes-modal-overlay" onClick={onClose}>
      <form className="detail-modal importar-modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-title-row">
          <div>
            <h3>Importar notas CSV/TXT</h3>
            <p>Carga notas por CI o por ID del postulante.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {error && <div className="message error">{error}</div>}

        <div
          className={`drop-zone ${dragging ? 'active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet size={36} />
          <strong>{file ? file.name : 'Selecciona o arrastra un archivo CSV/TXT'}</strong>
          <span>El archivo debe incluir parciales 1, 2 y 3 con notas entre 0 y 100.</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            hidden
          />
        </div>

        <div className="csv-format-box">
          <strong>Formato aceptado</strong>
          <code>ci;materia;parcial_1;parcial_2;parcial_3;grupo_id;docente_id</code>
          <code>9101001;Computacion;80;85;90;1;1</code>
          <code>postulante_id;materia_id;parcial_1;parcial_2;parcial_3;grupo_id;docente_id</code>
          <code>1;1;80;85;90;1;1</code>
        </div>

        {result && (
          <div className="import-result">
            <strong>Resultado de importacion</strong>
            <div className="import-result-grid">
              <span>Importados: {result.importados ?? result.registros_importados ?? result.creados ?? 0}</span>
              <span>Actualizados: {result.actualizados ?? result.registros_actualizados ?? 0}</span>
            </div>
            {importErrors.length > 0 && (
              <div className="import-errors">
                {importErrors.map((item, index) => (
                  <p key={`${index}-${String(item).slice(0, 12)}`}>
                    {item?.fila ? `Fila ${item.fila}: ` : ''}{item?.mensaje || item?.error || String(item)}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary btn-inline" type="button" onClick={handleDownload}>
            <Download size={16} /> Descargar plantilla
          </button>
          <button className="btn-primary btn-inline" type="submit" disabled={!file || importing}>
            <Upload size={16} /> {importing ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </form>
    </div>
  );
}
