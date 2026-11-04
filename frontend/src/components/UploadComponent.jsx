import { useRef, useState } from 'react';
import { LoaderCircle, Upload } from 'lucide-react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (isUploading) return;
    setError('');
    setSuccess('');
    if (!file || file.size === 0) {
      setError('Selecione um arquivo que não esteja vazio.');
      return;
    }
    setIsUploading(true);
    try {
      const document = await uploadDocument(file);
      onUploaded(document);
      setSuccess(`Documento "${document.originalName}" enviado.`);
      setFile(null);
      inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <div className="upload-controls">
          <label className="file-field">
            <span>Arquivo</span>
            <input
              ref={inputRef}
              type="file"
              disabled={isUploading}
              onChange={(event) => {
                setFile(event.target.files[0] || null);
                setError('');
                setSuccess('');
              }}
            />
          </label>
          <button className="primary-button" type="submit" disabled={!file || isUploading}>
            {isUploading ? <LoaderCircle className="spinning" size={18} /> : <Upload size={18} />}
            {isUploading ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        {success && <p className="success-message" role="status">{success}</p>}
      </form>
    </section>
  );
}