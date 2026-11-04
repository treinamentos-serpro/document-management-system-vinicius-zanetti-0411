import { FileText, RefreshCw } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${sizeFormatter.format(size / 1024)} KB`;
  return `${sizeFormatter.format(size / 1024 ** 2)} MB`;
}

export default function DocumentList({ documents, isLoading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title" aria-busy={isLoading}>
      <div className="section-heading">
        <h2 id="documents-title">Documentos <span className="document-count">{documents.length}</span></h2>
        <button type="button" className="icon-button" onClick={onRefresh} disabled={isLoading} title="Atualizar documentos" aria-label="Atualizar documentos">
          <RefreshCw size={18} className={isLoading ? 'spinning' : undefined} />
        </button>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {isLoading && <p className="list-status" role="status">Carregando documentos…</p>}
      {!isLoading && !error && documents.length === 0 && <p className="list-status">Nenhum documento enviado.</p>}
      {documents.length > 0 && (
        <ul className="document-list">
          {documents.map((document) => (
            <li key={document.id} className="document-row">
              <FileText size={22} className="document-icon" aria-hidden="true" />
              <div className="document-details">
                <h3>{document.originalName}</h3>
                <div className="document-meta">
                  <span>{formatSize(document.size)}</span>
                  <time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time>
                </div>
              </div>
              <DownloadButton document={document} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}