import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MediaRecord } from '../types';
import { Upload, Trash, Copy } from 'lucide-react';

export function Media() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    const q = query(collection(db, 'media'));
    const snap = await getDocs(q);
    const results: MediaRecord[] = [];
    snap.forEach(d => results.push(d.data() as MediaRecord));
    results.sort((a, b) => b.createdAt - a.createdAt);
    setMedia(results);
    setLoading(false);
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !user) return;
    const file = e.target.files[0];
    
    setUploading(true);
    const id = `img-${Date.now()}`;
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onerror = () => {
        alert("Failed to read file.");
        setUploading(false);
      };

      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onerror = () => {
          alert("Failed to load image.");
          setUploading(false);
        };

        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const MAX_SIZE = 800;
            if (width > height && width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const base64String = canvas.toDataURL('image/jpeg', 0.8);
            
            if (base64String.length > 800000) {
               alert("Image is too large even after compression. Please use a smaller image.");
               setUploading(false);
               return;
            }
            const record: MediaRecord = {
              id,
              storagePath: 'firestore-base64',
              downloadUrl: base64String,
              originalFilename: file.name,
              mimeType: 'image/jpeg',
              size: base64String.length,
              altText: '',
              createdAt: Date.now(),
              ownerUid: user.uid,
              usedByArtifactIds: []
            };
            await setDoc(doc(db, 'media', id), record);
            await loadMedia();
            setUploading(false);
          } catch (err: any) {
            console.error(err);
            alert(err.code || err.message || "Upload failed.");
            setUploading(false);
          }
        };
      };
      
    } catch (err: any) {
      console.error(err);
      alert("Upload failed.");
      setUploading(false);
    }
  };

  const handleDelete = async (m: MediaRecord) => {
    if (m.usedByArtifactIds.length > 0) {
      alert(`Cannot delete. Used by: ${m.usedByArtifactIds.join(', ')}`);
      return;
    }
    if (window.confirm("Delete this image?")) {
      await deleteDoc(doc(db, 'media', m.id));
      await loadMedia();
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(`![image](${url})`);
    alert("Markdown copied to clipboard!");
  };

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-serif text-3xl text-ivory">Media Library</h2>
          <p className="font-mono text-[9px] uppercase tracking-widest text-silver/60 mt-2">Images are downscaled and stored directly in database</p>
        </div>
        <div>
          <label className="cursor-pointer flex items-center gap-2 bg-ivory text-carbon px-4 py-2 text-xs font-mono uppercase tracking-widest hover:bg-silver transition-colors">
            <Upload className="w-4 h-4" />
            {uploading ? 'UPLOADING...' : 'UPLOAD'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-silver font-mono text-xs">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {media.map(m => (
            <div key={m.id} className="bg-carbon border border-silver/10 flex flex-col group">
              <div className="aspect-square bg-graphite relative overflow-hidden">
                <img src={m.downloadUrl} alt={m.altText} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyToClipboard(m.downloadUrl)} className="p-1.5 bg-carbon text-silver hover:text-ivory border border-silver/20" title="Copy Markdown">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(m)} className="p-1.5 bg-carbon text-silver hover:text-rose border border-silver/20" title="Delete">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-mono text-[9px] text-silver truncate mb-1" title={m.originalFilename}>{m.originalFilename}</p>
                <div className="flex justify-between text-[9px] text-silver/60 uppercase tracking-widest font-mono">
                  <span>{(m.size / 1024).toFixed(0)}KB</span>
                  <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
          {media.length === 0 && (
            <div className="col-span-full text-silver/60 font-serif italic py-12 text-center">No media found.</div>
          )}
        </div>
      )}
    </div>
  );
}
