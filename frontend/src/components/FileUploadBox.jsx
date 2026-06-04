const acceptedExtensions = '.pdf,.jpg,.jpeg,.png';

export default function FileUploadBox({ label, file, onChange, error, required = false }) {
  return (
    <div className="field-group">
      <label>{label} {required && <span style={{ color: '#dc2626' }}>*</span>}</label>
      <label className="file-upload-box">
        <input
          type="file"
          accept={acceptedExtensions}
          onChange={(event) => {
            const selected = event.target.files?.[0] || null;
            console.log('FileUploadBox selected', selected, selected instanceof File);
            onChange(selected);
          }}
        />
        <div className="file-upload-preview">
          <span>{file ? file.name : 'Seleccionar archivo'}</span>
          <small>PDF, JPG, JPEG o PNG | Máx. 5MB</small>
        </div>
      </label>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
