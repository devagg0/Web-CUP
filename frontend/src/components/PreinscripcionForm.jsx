import { useMemo, useState } from 'react';
import FileUploadBox from './FileUploadBox';

const sexOptions = [
  { value: 'MASCULINO', label: 'MASCULINO' },
  { value: 'FEMENINO', label: 'FEMENINO' },
  { value: 'OTRO', label: 'OTRO' },
];

const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const maxSize = 5 * 1024 * 1024;

export default function PreinscripcionForm({ carreras, onSubmit, submitting }) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({
    ci: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: '',
    direccion: '',
    telefono: '',
    correo: '',
    colegio_procedencia: '',
    ciudad: '',
    primera_carrera_id: '',
    segunda_carrera_id: '',
  });
  const [files, setFiles] = useState({
    titulo_bachiller: null,
    carnet_identidad: null,
    otros: null,
  });
  const [errors, setErrors] = useState({});

  const handleValueChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleFileChange = (field, file) => {
    const fileError = validateFile(field, file);
    setFiles((prev) => ({ ...prev, [field]: file }));
    setErrors((prev) => ({ ...prev, [field]: fileError }));
  };

  const validateFile = (field, file) => {
    if (!file) {
      if (field === 'otros') return '';
      return 'Este archivo es obligatorio.';
    }
    if (!acceptedTypes.includes(file.type)) {
      return 'Formato inválido. Usa PDF, JPG, JPEG o PNG.';
    }
    if (file.size > maxSize) {
      return 'El archivo no debe superar 5MB.';
    }
    return '';
  };

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validateStep = (targetStep) => {
    const nextErrors = {};

    if (targetStep === 1 || targetStep === 4) {
      if (!values.ci.trim()) nextErrors.ci = 'La CI es obligatoria.';
      if (!values.nombres.trim()) nextErrors.nombres = 'Los nombres son obligatorios.';
      if (!values.apellidos.trim()) nextErrors.apellidos = 'Los apellidos son obligatorios.';
      if (!values.fecha_nacimiento) nextErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
      if (!values.sexo) nextErrors.sexo = 'El sexo es obligatorio.';
      if (!values.direccion.trim()) nextErrors.direccion = 'La dirección es obligatoria.';
      if (!values.telefono.trim()) nextErrors.telefono = 'El teléfono es obligatorio.';
      if (!values.correo.trim()) nextErrors.correo = 'El correo electrónico es obligatorio.';
      else if (!validateEmail(values.correo)) nextErrors.correo = 'Ingresa un correo válido.';
      if (!values.colegio_procedencia.trim()) nextErrors.colegio_procedencia = 'El colegio de procedencia es obligatorio.';
      if (!values.ciudad.trim()) nextErrors.ciudad = 'La ciudad es obligatoria.';
    }

    if (targetStep === 2 || targetStep === 4) {
      if (!values.primera_carrera_id) nextErrors.primera_carrera_id = 'Selecciona la primera carrera.';
      if (!values.segunda_carrera_id) nextErrors.segunda_carrera_id = 'Selecciona la segunda carrera.';
      if (values.segunda_carrera_id && values.segunda_carrera_id === values.primera_carrera_id) {
        nextErrors.segunda_carrera_id = 'La segunda carrera debe ser diferente a la primera.';
      }
    }

    if (targetStep === 3 || targetStep === 4) {
      nextErrors.titulo_bachiller = validateFile('titulo_bachiller', files.titulo_bachiller);
      nextErrors.carnet_identidad = validateFile('carnet_identidad', files.carnet_identidad);
      if (files.otros) {
        nextErrors.otros = validateFile('otros', files.otros);
      }
    }

    const cleanErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));
    setErrors(cleanErrors);
    return Object.keys(cleanErrors).length === 0;
  };

  const summaryItems = useMemo(() => [
    { label: 'CI', value: values.ci },
    { label: 'Nombres', value: values.nombres },
    { label: 'Apellidos', value: values.apellidos },
    { label: 'Fecha de nacimiento', value: values.fecha_nacimiento },
    { label: 'Sexo', value: values.sexo },
    { label: 'Dirección', value: values.direccion },
    { label: 'Teléfono', value: values.telefono },
    { label: 'Correo', value: values.correo },
    { label: 'Colegio de procedencia', value: values.colegio_procedencia },
    { label: 'Ciudad', value: values.ciudad },
    {
      label: 'Primera carrera',
      value: carreras.find((item) => String(item.id) === String(values.primera_carrera_id))?.nombre || '',
    },
    {
      label: 'Segunda carrera',
      value: carreras.find((item) => String(item.id) === String(values.segunda_carrera_id))?.nombre || 'No seleccionada',
    },
  ], [carreras, values]);

  const goNext = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(4, current + 1));
    }
  };

  const goBack = () => {
    setStep((current) => Math.max(1, current - 1));
  };

  const handleSubmit = () => {
    if (!validateStep(4)) return;

    if (!(files.titulo_bachiller instanceof File) || !(files.carnet_identidad instanceof File)) {
      setErrors((prev) => ({
        ...prev,
        titulo_bachiller: files.titulo_bachiller instanceof File ? prev.titulo_bachiller : 'Selecciona un archivo válido.',
        carnet_identidad: files.carnet_identidad instanceof File ? prev.carnet_identidad : 'Selecciona un archivo válido.',
      }));
      return;
    }

    const formData = new FormData();
    formData.append('ci', values.ci.trim());
    formData.append('nombres', values.nombres.trim());
    formData.append('apellidos', values.apellidos.trim());
    formData.append('fecha_nacimiento', values.fecha_nacimiento);
    formData.append('sexo', values.sexo);
    formData.append('direccion', values.direccion.trim());
    formData.append('telefono', values.telefono.trim());
    formData.append('correo', values.correo.trim());
    formData.append('colegio_procedencia', values.colegio_procedencia.trim());
    formData.append('ciudad', values.ciudad.trim());
    formData.append('primera_carrera_id', values.primera_carrera_id);
    formData.append('segunda_carrera_id', values.segunda_carrera_id);
    formData.append('titulo_bachiller', files.titulo_bachiller);
    formData.append('carnet_identidad', files.carnet_identidad);
    if (files.otros instanceof File) {
      formData.append('otros', files.otros);
    }

    for (const [key, value] of formData.entries()) {
      console.log(key, value, value instanceof File);
    }

    onSubmit(formData);
  };

  return (
    <form className="preinscripcion-form" onSubmit={(e) => e.preventDefault()}>
      <div className="stepper">
        {['Datos personales', 'Carreras', 'Requisitos', 'Confirmación'].map((label, index) => (
          <div key={label} className={`step-pill ${step === index + 1 ? 'active' : ''}`}>
            <span>{`Paso ${index + 1}`}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="step-card">
          <h3>Datos personales</h3>
          <p>Completa tu información personal para que administración pueda validar tu solicitud.</p>
          <div className="field-grid">
            <div className="field-group">
              <label htmlFor="ci">CI</label>
              <input
                id="ci"
                value={values.ci}
                onChange={(e) => handleValueChange('ci', e.target.value)}
              />
              {errors.ci && <span className="field-error">{errors.ci}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="nombres">Nombres</label>
              <input
                id="nombres"
                value={values.nombres}
                onChange={(e) => handleValueChange('nombres', e.target.value)}
              />
              {errors.nombres && <span className="field-error">{errors.nombres}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="apellidos">Apellidos</label>
              <input
                id="apellidos"
                value={values.apellidos}
                onChange={(e) => handleValueChange('apellidos', e.target.value)}
              />
              {errors.apellidos && <span className="field-error">{errors.apellidos}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
              <input
                id="fecha_nacimiento"
                type="date"
                value={values.fecha_nacimiento}
                onChange={(e) => handleValueChange('fecha_nacimiento', e.target.value)}
              />
              {errors.fecha_nacimiento && <span className="field-error">{errors.fecha_nacimiento}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="sexo">Sexo</label>
              <select
                id="sexo"
                value={values.sexo}
                onChange={(e) => handleValueChange('sexo', e.target.value)}
              >
                <option value="">Selecciona...</option>
                {sexOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.sexo && <span className="field-error">{errors.sexo}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                value={values.direccion}
                onChange={(e) => handleValueChange('direccion', e.target.value)}
              />
              {errors.direccion && <span className="field-error">{errors.direccion}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                value={values.telefono}
                onChange={(e) => handleValueChange('telefono', e.target.value)}
              />
              {errors.telefono && <span className="field-error">{errors.telefono}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                value={values.correo}
                onChange={(e) => handleValueChange('correo', e.target.value)}
              />
              {errors.correo && <span className="field-error">{errors.correo}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="colegio_procedencia">Colegio de procedencia</label>
              <input
                id="colegio_procedencia"
                value={values.colegio_procedencia}
                onChange={(e) => handleValueChange('colegio_procedencia', e.target.value)}
              />
              {errors.colegio_procedencia && <span className="field-error">{errors.colegio_procedencia}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="ciudad">Ciudad</label>
              <input
                id="ciudad"
                value={values.ciudad}
                onChange={(e) => handleValueChange('ciudad', e.target.value)}
              />
              {errors.ciudad && <span className="field-error">{errors.ciudad}</span>}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-card">
          <h3>Carreras</h3>
          <p>Selecciona tu primera y segunda carrera. La segunda carrera es obligatoria y debe ser distinta.</p>
          <div className="field-grid single">
            <div className="field-group">
              <label htmlFor="primera_carrera_id">Primera carrera</label>
              <select
                id="primera_carrera_id"
                value={values.primera_carrera_id}
                onChange={(e) => handleValueChange('primera_carrera_id', e.target.value)}
              >
                <option value="">Selecciona una carrera</option>
                {carreras.map((carrera) => (
                  <option key={carrera.id} value={carrera.id}>{carrera.nombre}</option>
                ))}
              </select>
              {errors.primera_carrera_id && <span className="field-error">{errors.primera_carrera_id}</span>}
            </div>

            <div className="field-group">
              <label htmlFor="segunda_carrera_id">Segunda carrera</label>
              <select
                id="segunda_carrera_id"
                value={values.segunda_carrera_id}
                onChange={(e) => handleValueChange('segunda_carrera_id', e.target.value)}
              >
                <option value="">No seleccionada</option>
                {carreras
                  .filter((carrera) => String(carrera.id) !== String(values.primera_carrera_id))
                  .map((carrera) => (
                    <option key={carrera.id} value={carrera.id}>{carrera.nombre}</option>
                  ))}
              </select>
              {errors.segunda_carrera_id && <span className="field-error">{errors.segunda_carrera_id}</span>}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step-card">
          <h3>Requisitos</h3>
          <p>Sube los archivos solicitados para que administración revise tus documentos.</p>
          <div className="field-grid single">
            <FileUploadBox
              label="Título de bachiller"
              file={files.titulo_bachiller}
              onChange={(file) => handleFileChange('titulo_bachiller', file)}
              error={errors.titulo_bachiller}
              required
            />
            <FileUploadBox
              label="Carnet de identidad"
              file={files.carnet_identidad}
              onChange={(file) => handleFileChange('carnet_identidad', file)}
              error={errors.carnet_identidad}
              required
            />
            <FileUploadBox
              label="Otros requisitos (opcional)"
              file={files.otros}
              onChange={(file) => handleFileChange('otros', file)}
              error={errors.otros}
              required={false}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="step-card">
          <h3>Confirmación</h3>
          <p>Revisa tus datos antes de enviar la solicitud. No cierres esta página hasta completar el envío.</p>
          <div className="summary-grid">
            {summaryItems.map((item) => (
              <div key={item.label} className="summary-item">
                <strong>{item.label}</strong>
                <p>{item.value || 'No disponible'}</p>
              </div>
            ))}
            <div className="summary-item">
              <strong>Archivos subidos</strong>
              <div className="file-list">
                <span className="file-chip">Título de bachiller: {files.titulo_bachiller?.name || 'No seleccionado'}</span>
                <span className="file-chip">Carnet de identidad: {files.carnet_identidad?.name || 'No seleccionado'}</span>
                <span className="file-chip">Otros: {files.otros?.name || 'No aplicado'}</span>
              </div>
            </div>
          </div>
          <div className="confirmation-note">
            Tus requisitos serán revisados por administración. Si son aprobados, podrás consultar tu preinscripción y realizar el pago.
          </div>
        </div>
      )}

      <div className="button-row">
        {step > 1 && (
          <button type="button" className="btn-secondary" onClick={goBack}>
            Regresar
          </button>
        )}
        {step < 4 ? (
          <button type="button" className="btn-primary" onClick={goNext}>
            Siguiente
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando preinscripción...' : 'Enviar preinscripción'}
          </button>
        )}
      </div>
    </form>
  );
}
