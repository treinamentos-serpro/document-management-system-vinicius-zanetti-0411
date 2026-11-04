import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (isDownloading) return;
    setError('');
    setIsDownloading(true);
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="download-control">
      <button
        type="button"
        className="icon-button"
        disabled={isDownloading}
        onClick={handleDownload}
        aria-label={`Baixar ${document.originalName}`}
        title={isDownloading ? 'Baixando documento' : `Baixar ${document.originalName}`}
      >
        {isDownloading ? <LoaderCircle className="spinning" size={18} /> : <Download size={18} />}
      </button>
      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  );
}