import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirebaseArtifact, ContentType } from '../types';
import { generateCoordinate, deleteArtifact } from '../lib/data';
import { Save, Eye, EyeOff, UploadCloud, ChevronLeft, Trash, FileText, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TurndownService from 'turndown';
import { embedArtifact, firstImageDataUrl, embedVisual } from '../lib/vectors';

const DEFAULT_TRACE = {
  artifactID: '',
  contentType: 'Essay' as ContentType,
  datePublished: new Date().toISOString(),
  authorIntent: '',
  machineCluster: '',
  machineCoordinate: { x: 0, y: 0 },
  authorCoordinate: { x: 0, y: 0 },
  semanticDisplacement: 0,
  nearestMachineNeighbors: [],
  nearestAuthorNeighbors: [],
  writingProvenance: 'Written and revised by Amanda',
  modelInvolvement: 'Gemini-assisted development and indexing',
  revisionCount: 1
};

export function Editor() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [artifact, setArtifact] = useState<Partial<FirebaseArtifact>>({
    id: `art-${Date.now()}`,
    type: 'Essay',
    status: 'draft',
    bodyMarkdown: '',
    title: '',
    slug: '',
    excerpt: '',
    traceMetadata: { ...DEFAULT_TRACE }
  });
  
  const [loading, setLoading] = useState(id !== undefined && id !== 'new');
  const [saving, setSaving] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ text: string, url: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'autosaving'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Auto-save logic
  useEffect(() => {
    // Only auto-save if we have an ID and it's not a new draft
    if (loading || id === 'new') return;
    
    const handler = setTimeout(() => {
      // Only auto-save if status is draft (don't want to accidentally publish)
      if (artifact.status === 'draft') {
        handleSave('draft');
      }
    }, 5000); // Wait 5 seconds after last edit to auto-save

    return () => clearTimeout(handler);
  }, [artifact.bodyMarkdown, artifact.title, artifact.slug, artifact.excerpt, artifact.type, artifact.authorCategory, artifact.authorIntent]);

  useEffect(() => {
    if (id && id !== 'new') {
      getDoc(doc(db, 'artifacts', id)).then(snap => {
        if (snap.exists()) {
          const data = snap.data() as FirebaseArtifact;
          
          // Cleanup legacy base64 in bodyMarkdown
          if (data.bodyMarkdown && data.bodyMarkdown.includes('data:')) {
            const inlineMedia = data.inlineMedia || [];
            const regex = /!\[(.*?)\]\((data:[^)]+)\)/g;
            data.bodyMarkdown = data.bodyMarkdown.replace(regex, (_full, alt, uri) => {
              let idx = inlineMedia.indexOf(uri);
              if (idx === -1) {
                idx = inlineMedia.length;
                inlineMedia.push(uri);
              }
              return `![${alt}](inline:${idx})`;
            });
            data.inlineMedia = inlineMedia;
          }
          
          setArtifact(data);
        }
        setLoading(false);
      }).catch(err => {
        console.error("Failed to load artifact", err);
        setLoading(false);
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setArtifact(prev => ({ ...prev, [name]: value }));
  };

  const handleTraceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setArtifact(prev => ({ 
      ...prev, 
      traceMetadata: { ...prev.traceMetadata, [name]: value } as any
    }));
  };


  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB limit for Gemini API
      alert("PDF file is too large. Max size is 20MB.");
      return;
    }
    
    setPdfUploading(true);
    let downloadUrl = "";
    
    try {
      // 1. Upload to storage
      const storageRef = ref(storage, `pdfs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
      await uploadBytes(storageRef, file);
      downloadUrl = await getDownloadURL(storageRef);
      
      // 2. Send storage URL to backend to bypass proxy size limits
      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadUrl })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'PDF parsing failed');
      }
      
      const data = await res.json();
      
      setPdfPreview({ text: data.markdown, url: downloadUrl });
      
    } catch (err: any) {
      console.error(err);
      alert("Failed to parse PDF: " + err.message);
    } finally {
      setPdfUploading(false);
      e.target.value = ''; // reset
    }
  };

  const handleAppendPdf = () => {
    if (!pdfPreview) return;
    const newMarkdown = (artifact.bodyMarkdown ? artifact.bodyMarkdown + '\n\n---\n\n' : '') 
      + pdfPreview.text
      + (pdfPreview.url ? `\n\n[Download original PDF](${pdfPreview.url})` : '');
        
    setArtifact(prev => ({
      ...prev,
      bodyMarkdown: newMarkdown
    }));
    setPdfPreview(null);
  };

  const handleDelete = async () => {
    if (!artifact.id || !window.confirm('Are you sure you want to delete this artifact? This cannot be undone.')) return;
    setSaving(true);
    try {
      await deleteArtifact(artifact.id);
      navigate('/studio');
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
      setSaveMessage('Failed to delete');
      alert("Delete failed: " + err.message);
      setSaving(false);
    }
  };

  const persistDataUri = async (dataUri: string, artifactId: string): Promise<string> => {
    const res = await fetch(dataUri);
    const blob = await res.blob();
    const ext = (blob.type.split('/')[1] || 'bin').split(';')[0];
    const path = `inline/${artifactId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const sref = ref(storage, path);
    await uploadBytes(sref, blob);
    return await getDownloadURL(sref);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!user) return;
    setSaving(true);
    setSaveStatus(status === 'draft' ? 'autosaving' : 'saving');
    
    // Auto-generate slug and coordinates if missing
    let finalSlug = artifact.slug || artifact.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let machineCoord = artifact.machineCoordinate || generateCoordinate(finalSlug || artifact.id!);
    let authorCoord = artifact.authorCoordinate || generateCoordinate((artifact.authorCategory || '') + (artifact.authorIntent || ''));

    const baseArt = {
      ...artifact,
      slug: finalSlug || artifact.id!,
      status,
      machineCoordinate: machineCoord,
      authorCoordinate: authorCoord,
      traceMetadata: {
        ...artifact.traceMetadata,
        artifactID: artifact.id,
        contentType: artifact.type,
      } as any,
      updatedAt: Date.now(),
      ownerUid: user.uid,
    };
    
    if (status === 'published' && !baseArt.publishedAt) {
      baseArt.publishedAt = Date.now();
    }
    if (!baseArt.createdAt) {
      baseArt.createdAt = Date.now();
    }

    // Clean up base64 in body before saving to avoid large docs
    let cleanedBody = baseArt.bodyMarkdown || '';
    const inlineMedia = [...(baseArt.inlineMedia || [])];
    
    if (cleanedBody.includes('data:')) {
      const regex = /!\[(.*?)\]\((data:[^)]+)\)/g;
      const matches = [...cleanedBody.matchAll(regex)];
      
      const uriMap = new Map<string, string>();
      for (const match of matches) {
        const dataUri = match[2];
        if (dataUri.startsWith('data:') && !uriMap.has(dataUri)) {
            try {
                const url = await persistDataUri(dataUri, baseArt.id!);
                uriMap.set(dataUri, url);
            } catch (err) {
                console.error("Failed to persist data URI:", err);
            }
        }
      }
      
      cleanedBody = cleanedBody.replace(regex, (_full, alt, uri) => {
        const url = uriMap.get(uri) || uri;
        let idx = inlineMedia.indexOf(url);
        if (idx === -1) {
          idx = inlineMedia.length;
          inlineMedia.push(url);
        }
        return `![${alt}](inline:${idx})`;
      });
    }
    baseArt.bodyMarkdown = cleanedBody;
    baseArt.inlineMedia = inlineMedia;

    // Firestore rejects undefined values, we must strip them deeply
    const finalArt = JSON.parse(JSON.stringify(baseArt)) as FirebaseArtifact;
    
    try {
      await setDoc(doc(db, 'artifacts', finalArt.id), finalArt);
      setArtifact(finalArt);
      
      if (status === 'published') {
        const ok = await embedArtifact(finalArt);
        if (ok) {
          setSaveStatus('success');
          setSaveMessage('Published & embedded successfully');
        } else {
          setSaveStatus('error');
          setSaveMessage('Published but embedding failed');
          alert("Published, but semantic embedding failed! This post will lack a vector representation.");
        }
        let img = firstImageDataUrl(finalArt.bodyMarkdown) || finalArt.coverMedia;
        if (!img && finalArt.inlineMedia) {
          const firstImage = finalArt.inlineMedia.find((m: string) => m.startsWith('data:image/'));
          if (firstImage) img = firstImage;
        }
        
        if (img) {
          embedVisual(finalArt.id, img).then((ok) => {
            if (!ok) console.warn('Published but not visually embedded.');
          });
        }
      } else {
        setSaveStatus('success');
        setSaveMessage('Draft saved successfully');
      }

      if (id === 'new') {
        navigate(`/studio/editor/${finalArt.id}`, { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
      setSaveMessage('Failed to save artifact');
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => {
        setSaveStatus(prev => prev === 'error' ? 'error' : 'idle');
      }, 4000);
    }
  };

  if (loading) return <div className="p-12 text-silver font-mono">Loading...</div>;

  return (
    <div className="flex flex-col h-full relative">
      {pdfPreview && (
        <div className="fixed inset-0 bg-void/95 z-50 flex items-center justify-center p-3 md:p-8 backdrop-blur-sm">
          <div className="bg-onyx border border-silver/30 w-full max-w-3xl flex flex-col max-h-full">
            <div className="border-b border-silver/20 p-4 flex justify-between items-center bg-onyx/50">
              <h3 className="text-ivory font-mono text-sm tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Parsed PDF Preview
              </h3>
              <div className="text-silver/70 text-xs font-mono">
                {pdfPreview.text.length.toLocaleString()} chars
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#0a0a0a]">
              <pre className="font-mono text-[11px] md:text-xs leading-relaxed text-ivory/75 whitespace-pre-wrap break-words">
                {pdfPreview.text}
              </pre>
            </div>
            <div className="border-t border-silver/20 p-4 flex justify-end gap-4 bg-onyx/50">
              <button 
                onClick={() => setPdfPreview(null)}
                className="px-4 py-2 text-xs font-mono tracking-widest uppercase text-silver hover:text-ivory transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleAppendPdf}
                className="px-4 py-2 bg-ivory text-void hover:bg-white text-xs font-mono tracking-widest uppercase transition-colors"
              >
                Append to Document
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Editor Header */}
      <div className="flex-none bg-carbon border-b border-silver/10 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/studio')} className="flex items-center gap-1 text-silver hover:text-ivory bg-silver/5 px-2 py-1 rounded-sm border border-silver/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Back</span>
          </button>
          <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
            {artifact.status === 'published' ? 'Editing Published' : 'Draft'}
          </span>
        </div>
        
        {saveStatus !== 'idle' && (
          <div className={`absolute left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest px-4 py-1 flex items-center transition-opacity ${saveStatus === 'success' ? 'text-indicator-green bg-indicator-green/10' : saveStatus === 'error' ? 'text-rose bg-rose/10' : 'text-silver bg-silver/10'}`}>
            {saveStatus === 'saving' ? 'SAVING...' : saveStatus === 'autosaving' ? 'AUTO-SAVING...' : saveMessage}
          </div>
        )}

        <div className="flex gap-2">
          <button 
            onClick={() => setPreview(!preview)}
            className="p-2 text-silver hover:text-ivory border border-transparent hover:border-silver/20"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {artifact.id && id !== 'new' && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="p-2 text-silver hover:text-rose border border-transparent hover:border-rose/20 transition-colors"
              title="Delete Artifact"
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-silver/20 text-[10px] font-mono uppercase tracking-widest hover:bg-silver/5"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button 
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-ivory text-carbon text-[10px] font-mono uppercase tracking-widest hover:bg-silver transition-colors"
          >
            <UploadCloud className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>

      {/* Main Editor Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row">
        
        {/* Left Column (Metadata) */}
        <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-silver/10 p-6 space-y-6 ${preview ? 'hidden' : 'block'}`}>
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60 mb-2">Type</label>
            <select 
              name="type" 
              value={artifact.type} 
              onChange={handleChange}
              className="w-full bg-graphite border border-silver/20 text-ivory p-2 text-xs font-mono focus:border-rose focus:outline-none"
            >
              <option value="Essay">Essay</option>
              <option value="Field note">Field note</option>
              <option value="Meme">Meme</option>
              <option value="Demo">Demo</option>
              <option value="Project">Project</option>
              <option value="Image artifact">Image artifact</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60 mb-2">Slug</label>
            <input 
              name="slug"
              value={artifact.slug || ''}
              onChange={handleChange}
              placeholder="auto-generated-if-empty"
              className="w-full bg-graphite border border-silver/20 text-ivory p-2 text-xs font-mono focus:border-rose focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60 mb-2">Machine Cluster</label>
            <input 
              name="machineCluster"
              value={artifact.machineCluster || ''}
              onChange={handleChange}
              className="w-full bg-graphite border border-silver/20 text-ivory p-2 text-xs font-mono focus:border-rose focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60 mb-2">Author Intent</label>
            <input 
              name="authorIntent"
              value={artifact.authorIntent || ''}
              onChange={handleChange}
              className="w-full bg-graphite border border-silver/20 text-ivory p-2 text-xs font-mono focus:border-rose focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-silver/10">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-mono text-ivory mb-4">Trace Metadata</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60 mb-1">Writing Provenance</label>
                <input 
                  name="writingProvenance"
                  value={artifact.traceMetadata?.writingProvenance || ''}
                  onChange={handleTraceChange}
                  className="w-full bg-graphite border border-silver/20 text-ivory p-2 text-xs font-mono focus:border-rose focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60 mb-1">Model Involvement</label>
                <input 
                  name="modelInvolvement"
                  value={artifact.traceMetadata?.modelInvolvement || ''}
                  onChange={handleTraceChange}
                  className="w-full bg-graphite border border-silver/20 text-ivory p-2 text-xs font-mono focus:border-rose focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Content) */}
        <div className="flex-1 p-6 md:p-12 max-w-3xl mx-auto w-full">
          {preview ? (
            <div className="markdown-body">
              <h1 className="text-4xl md:text-5xl font-serif text-ivory mb-4">{artifact.title}</h1>
              {artifact.subtitle && <h2 className="text-xl md:text-2xl font-serif text-silver italic mb-8">{artifact.subtitle}</h2>}
              <Markdown 
                      remarkPlugins={[remarkGfm]}
                      urlTransform={(url) => url}
                      components={{
                        img: ({node, src, alt, ...props}) => {
                          let actualSrc = src;
                          if (src?.startsWith('inline:')) {
                            const idx = parseInt(src.split(':')[1]);
                            actualSrc = artifact.inlineMedia?.[idx] || src;
                          }
                          if (actualSrc && actualSrc.startsWith('data:video/')) {
                            return <video src={actualSrc} controls preload="metadata" style={{ maxWidth: '100%' }} />
                          }
                          return <img src={actualSrc} alt={alt} {...props} />
                        }
                      }}
                    >
                      {artifact.bodyMarkdown || ''}
                    </Markdown>
            </div>
          ) : (
            <div className="space-y-6">
              <input 
                name="title"
                value={artifact.title || ''}
                onChange={handleChange}
                placeholder="Artifact Title"
                className="w-full bg-transparent text-4xl md:text-5xl font-serif text-ivory placeholder-silver/20 border-none focus:outline-none focus:ring-0"
              />
              <input 
                name="subtitle"
                value={artifact.subtitle || ''}
                onChange={handleChange}
                placeholder="Optional subtitle"
                className="w-full bg-transparent text-xl md:text-2xl font-serif text-silver italic placeholder-silver/20 border-none focus:outline-none focus:ring-0"
              />
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60 mb-2 mt-8">Excerpt</label>
                <textarea 
                  name="excerpt"
                  value={artifact.excerpt || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-graphite border border-silver/20 text-ivory p-3 text-sm font-serif focus:border-rose focus:outline-none resize-none"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2 mt-4">
                  <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60">Body (Markdown)</label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2 bg-silver/10 hover:bg-silver/20 text-ivory px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-colors">
                      {pdfUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                      {pdfUploading ? "Parsing..." : "Upload PDF"}
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        disabled={pdfUploading}
                        onChange={handlePdfUpload}
                      />
                    </label>
                    {(artifact.type === 'Image artifact' || artifact.type === 'Meme') && (
                      <label className="cursor-pointer flex items-center gap-2 bg-silver/10 hover:bg-silver/20 text-ivory px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-colors">
                      <UploadCloud className="w-3 h-3" /> Upload Media
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (!e.target.files || !e.target.files.length) return;
                          const file = e.target.files[0];
                          
                          if (file.type.startsWith('video/')) {
                            if (file.size > 800000) {
                              alert("Video file is too large. Max size is 800KB for base64 storage.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = async (event) => {
                              const base64String = event.target?.result as string;
                              
                              // Extract frame
                              const video = document.createElement('video');
                              video.src = base64String;
                              video.muted = true;
                              video.playsInline = true;
                              video.onloadeddata = () => {
                                video.currentTime = Math.min(1, video.duration / 2 || 0);
                              };
                              video.onseeked = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const frameBase64 = canvas.toDataURL('image/jpeg', 0.8);
                                
                                setArtifact(prev => ({
                                  ...prev,
                                  coverMedia: frameBase64,
                                  inlineMedia: [...(prev.inlineMedia || []), base64String],
                                  bodyMarkdown: (prev.bodyMarkdown || '') + `\n\n![video](inline:${(prev.inlineMedia || []).length})`
                                }));
                              };
                            };
                            return;
                          }

                          const reader = new FileReader();
                          reader.readAsDataURL(file);
                          reader.onload = async (event) => {
                            const img = new Image();
                            img.src = event.target?.result as string;
                            img.onload = () => {
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
                              
                              setArtifact(prev => ({
                                ...prev,
                                inlineMedia: [...(prev.inlineMedia || []), base64String],
                                bodyMarkdown: (prev.bodyMarkdown || '') + `\n\n![image](inline:${(prev.inlineMedia || []).length})`
                              }));
                            };
                          };
                        }} 
                      />
                    </label>
                  )}
                  </div>
                  <div className="flex flex-wrap gap-1 pb-1">
                    {['#', '##', '###', '**', '_', '[]()', '>', '-', '1.', '---', '![alt]()', '✦', '✧', '✺', '※', '—'].map(char => (
                      <button 
                        key={char} 
                        type="button"
                        onClick={() => setArtifact(prev => ({ ...prev, bodyMarkdown: (prev.bodyMarkdown || '') + char }))}
                        className="p-1 px-2 border border-silver/10 text-silver hover:text-ivory hover:bg-silver/5 text-xs font-mono shrink-0"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea 
                  name="bodyMarkdown"
                  value={artifact.bodyMarkdown || ''}
                  onChange={handleChange}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    let hasImage = false;
                    let htmlItem = null;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        hasImage = true;
                        e.preventDefault();
                        const file = items[i].getAsFile();
                        if (!file) continue;
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = async (event) => {
                          const img = new Image();
                          img.src = event.target?.result as string;
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let { width, height } = img;
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
                            setArtifact(prev => ({
                              ...prev,
                              inlineMedia: [...(prev.inlineMedia || []), base64String],
                              bodyMarkdown: (prev.bodyMarkdown || '') + `\n\n![image](inline:${(prev.inlineMedia || []).length})`
                            }));
                          };
                        };
                      } else if (items[i].type === 'text/html') {
                        htmlItem = items[i];
                      }
                    }
                    if (!hasImage && htmlItem) {
                      e.preventDefault();
                      htmlItem.getAsString((html) => {
                        const turndownService = new TurndownService({
                          headingStyle: 'atx',
                          bulletListMarker: '-',
                          hr: '---'
                        });
                        const markdown = turndownService.turndown(html);
                        const textarea = e.target as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newValue = (artifact.bodyMarkdown || '').substring(0, start) + markdown + (artifact.bodyMarkdown || '').substring(end);
                        setArtifact(prev => ({ ...prev, bodyMarkdown: newValue }));
                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + markdown.length;
                        }, 0);
                      });
                    }
                  }}
                  rows={15}
                  className="w-full bg-graphite border border-silver/20 text-ivory p-4 text-sm font-mono focus:border-rose focus:outline-none resize-y"
                  placeholder="# Heading..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
