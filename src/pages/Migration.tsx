import React, { useState } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { FirebaseArtifact } from '../types';

export function Migration() {
  const [status, setStatus] = useState<string>('Ready to migrate');
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const persistDataUri = async (dataUri: string, artifactId: string): Promise<string> => {
    const res = await fetch(dataUri);
    const blob = await res.blob();
    const ext = (blob.type.split('/')[1] || 'bin').split(';')[0];
    const path = `inline/${artifactId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const sref = ref(storage, path);
    await uploadBytes(sref, blob);
    return await getDownloadURL(sref);
  };

  const runMigration = async () => {
    try {
      setStatus('Fetching artifacts...');
      const snapshot = await getDocs(collection(db, 'artifacts'));
      const artifacts = snapshot.docs.map(d => d.data() as FirebaseArtifact);
      setTotal(artifacts.length);
      
      let count = 0;
      for (const artifact of artifacts) {
        let changed = false;
        
        // 1. Process inlineMedia array
        const newInlineMedia = [...(artifact.inlineMedia || [])];
        for (let i = 0; i < newInlineMedia.length; i++) {
          const media = newInlineMedia[i];
          if (media.startsWith('data:')) {
            try {
              setStatus(`Uploading media for ${artifact.id}...`);
              const url = await persistDataUri(media, artifact.id!);
              newInlineMedia[i] = url;
              changed = true;
            } catch (err) {
              console.error(`Failed to upload media for ${artifact.id}`, err);
            }
          }
        }
        
        // 2. Process bodyMarkdown if it contains data: URIs
        let cleanedBody = artifact.bodyMarkdown || '';
        if (cleanedBody.includes('data:')) {
          const regex = /!\[(.*?)\]\((data:[^)]+)\)/g;
          const matches = [...cleanedBody.matchAll(regex)];
          
          const uriMap = new Map<string, string>();
          for (const match of matches) {
            const dataUri = match[2];
            if (dataUri.startsWith('data:') && !uriMap.has(dataUri)) {
                try {
                    setStatus(`Uploading embedded media for ${artifact.id}...`);
                    const url = await persistDataUri(dataUri, artifact.id!);
                    uriMap.set(dataUri, url);
                    changed = true;
                } catch (err) {
                    console.error("Failed to persist data URI:", err);
                }
            }
          }
          
          cleanedBody = cleanedBody.replace(regex, (_full, alt, uri) => {
            const url = uriMap.get(uri) || uri;
            let idx = newInlineMedia.indexOf(url);
            if (idx === -1) {
              idx = newInlineMedia.length;
              newInlineMedia.push(url);
            }
            return `![${alt}](inline:${idx})`;
          });
        }

        if (changed) {
          setStatus(`Saving ${artifact.id}...`);
          const updatedArt = {
            ...artifact,
            inlineMedia: newInlineMedia,
            bodyMarkdown: cleanedBody
          };
          await setDoc(doc(db, 'artifacts', artifact.id!), updatedArt);
        }
        
        count++;
        setProgress(count);
      }
      
      setStatus('Migration complete!');
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-8 font-mono text-ivory max-w-2xl mx-auto">
      <h1 className="text-2xl mb-4">Database Migration</h1>
      <p className="mb-4 text-silver">This will convert all base64 data URIs in artifacts to Firebase Storage URLs.</p>
      
      <button 
        onClick={runMigration}
        className="px-4 py-2 bg-rose text-ivory rounded mb-8"
      >
        Run Migration
      </button>
      
      <div className="p-4 bg-graphite rounded">
        <div className="mb-2">Status: {status}</div>
        {total > 0 && (
          <div>Progress: {progress} / {total}</div>
        )}
      </div>
    </div>
  );
}
