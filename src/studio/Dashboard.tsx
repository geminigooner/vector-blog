import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStudioArtifacts, importDemoArchive, deleteArtifact } from '../lib/data';
import { FirebaseArtifact } from '../types';
import { MoreVertical, Copy, Trash, ExternalLink, Edit } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artifacts, setArtifacts] = useState<FirebaseArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getStudioArtifacts();
    setArtifacts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImport = async () => {
    if (!user) return;
    setImporting(true);
    await importDemoArchive(user.uid);
    await loadData();
    setImporting(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this artifact? This cannot be undone.')) {
      await deleteArtifact(id);
      await loadData();
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(artifacts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `latent-affairs-archive-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ivory">Artifacts</h2>
          <p className="text-silver font-mono text-[10px] uppercase tracking-widest mt-1">Manage your collection</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleImport}
            disabled={importing}
            className="border border-silver/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest hover:bg-silver/5 disabled:opacity-50"
          >
            {importing ? 'IMPORTING...' : 'IMPORT DEMO ARCHIVE'}
          </button>
          <button 
            onClick={handleExport}
            className="border border-silver/20 px-4 py-2 text-[10px] font-mono uppercase tracking-widest hover:bg-silver/5"
          >
            EXPORT ARCHIVE
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-silver font-mono text-xs">Loading...</div>
      ) : (
        <div className="space-y-4">
          {artifacts.map(art => (
            <div key={art.id} className="bg-carbon border border-silver/10 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[9px] uppercase tracking-widest font-mono px-2 py-0.5 ${art.status === 'published' ? 'bg-indicator-green/20 text-indicator-green' : 'bg-silver/10 text-silver'}`}>
                    {art.status}
                  </span>
                  <span className="text-[10px] font-mono text-silver">{art.type}</span>
                </div>
                <h3 className="font-serif text-lg text-ivory truncate">{art.title}</h3>
                <p className="text-xs text-silver/60 mt-1">Last edited: {new Date(art.updatedAt).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Link to={`/studio/editor/${art.id}`} className="p-2 text-silver hover:text-ivory bg-silver/5">
                  <Edit className="w-4 h-4" />
                </Link>
                {art.status === 'published' && (
                  <a href={`/?artifact=${art.id}`} target="_blank" rel="noreferrer" className="p-2 text-silver hover:text-ivory bg-silver/5">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                
                <button onClick={() => handleDelete(art.id)} className="p-2 text-silver hover:text-rose bg-silver/5 ml-2">
                  <Trash className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
          {artifacts.length === 0 && (
            <div className="text-silver/60 font-serif italic py-12 text-center">No artifacts found. Create one or import the demo archive.</div>
          )}
        </div>
      )}
    </div>
  );
}
