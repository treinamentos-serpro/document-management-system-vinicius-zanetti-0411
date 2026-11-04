import { useEffect, useState } from 'react';
import { Files } from 'lucide-react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');
    listDocuments({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setDocuments(items);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [refreshVersion]);

  function refreshDocuments() {
    setRefreshVersion((version) => version + 1);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <Files size={28} aria-hidden="true" />
        <h1>Document Management System</h1>
      </header>
      <UploadComponent onUploaded={refreshDocuments} />
      <DocumentList documents={documents} isLoading={isLoading} error={error} onRefresh={refreshDocuments} />
    </main>
  );
}
