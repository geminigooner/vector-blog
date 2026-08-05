import React, { useState, useEffect } from 'react';
import { Search, Orbit, Columns3, PanelRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ViewMode, LayoutMode, Artifact, SearchVector } from './types';
import { getPublishedArtifacts, getPublishedFirebaseArtifacts } from './lib/data';
import { buildAtlas, semanticSearch, Projection, Vec } from './lib/semantic';
import { loadVectors, embedQuery, loadVisualVectors } from './lib/vectors';
import { FieldView } from './components/FieldView';
import { RackView } from './components/RackView';
import { ArtifactDrawer } from './components/ArtifactDrawer';
import { cn } from './utils/cn';

function deterministicSearch(artifacts: Artifact[], query: string): { results: Artifact[], queryVector: SearchVector | null } {
  if (!query) return { results: artifacts.map(a => ({ ...a, searchRelevance: 1 })), queryVector: null };
  
  const q = query.toLowerCase();
  const hash = q.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const qLoc = { x: (hash % 400) - 200, y: ((hash * 7) % 400) - 200 };

  const results = artifacts.map(a => {
    const text = `${a.title} ${a.subtitle || ''} ${a.excerpt} ${a.authorIntent} ${a.machineCluster}`.toLowerCase();
    let relevance = 0.05;
    if (text.includes(q)) relevance = 1.0;
    else {
      const words = q.split(' ').filter(w => w.length > 3);
      if (words.some(w => text.includes(w))) relevance = 0.6;
    }
    return { ...a, searchRelevance: relevance };
  });

  return { results, queryVector: { query, location: qLoc, isActive: true } };
}

export function PublicApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('MISREAD');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FIELD');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [baseArtifacts, setBaseArtifacts] = useState<Artifact[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [queryVector, setQueryVector] = useState<SearchVector | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [projection, setProjection] = useState<Projection | null>(null);
  const [vectors, setVectors] = useState<Record<string, Vec>>({});

  useEffect(() => {
    Promise.all([getPublishedArtifacts(), loadVectors(), loadVisualVectors(), getPublishedFirebaseArtifacts()])
      .then(([posts, vecs, vVecs, raw]) => {
        // topics/keywords drive AUTHOR space; embeddings drive MACHINE space
        const tagsById: Record<string, string[]> = {};
        const categoryById: Record<string, string> = {};
        for (const r of raw) {
          tagsById[r.id] = [...((r as any).topics || []), ...((r as any).keywords || [])];
          categoryById[r.id] = r.authorCategory || r.authorIntent || 'Unsorted';
        }

        const { artifacts: laid, projection: proj } = buildAtlas(posts, vecs, tagsById, categoryById, vVecs);

        setVectors(vecs);
        setProjection(proj);
        setBaseArtifacts(laid as any);
        setArtifacts(laid as any);
      });
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;

    if (!debouncedQuery) {
      setArtifacts(baseArtifacts.map((a) => ({ ...a, searchRelevance: 1 })));
      setQueryVector(null);
      return;
    }

    embedQuery(debouncedQuery).then((qvec) => {
      if (cancelled) return;
      if (!qvec) {
        // Server unreachable - fall back to substring matching so search still does *something*.
        const { results, queryVector: qv } = deterministicSearch(baseArtifacts, debouncedQuery);
        setArtifacts(results);
        setQueryVector(qv);
        return;
      }
      
      const { results, location } = semanticSearch(baseArtifacts, vectors, qvec, projection);
      setArtifacts(results);
      setQueryVector({ query: debouncedQuery, location: location || { x: 0, y: 0 }, isActive: true });
    });

    return () => { cancelled = true; };
  }, [debouncedQuery, baseArtifacts, vectors, projection]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-carbon flex flex-col font-sans text-ivory">
      
      {/* HEADER */}
      <header className="flex-none px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-start justify-between z-30 pointer-events-none absolute top-0 left-0 w-full">
        <div className="flex flex-col mb-4 md:mb-0 pointer-events-auto max-w-[300px]">
          <h1 className="font-serif text-2xl text-ivory tracking-wide leading-none">LATENT AFFAIRS</h1>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver/80 mt-2">
            field notes from the residual stream
          </span>
          <p className="font-serif text-sm text-silver/60 mt-4 leading-snug transition-opacity duration-1000 opacity-100">
            An archive arranged twice: once by the machine, once by its author.
          </p>
          {viewMode === 'VISUAL' && (
            <div className="font-mono text-[10px] uppercase tracking-widest text-ivory mt-4">
              ARRANGED BY IMAGE — SigLIP2, 768d
            </div>
          )}
          <div className="mt-4 flex gap-4 text-[10px] uppercase font-mono tracking-widest">
            <Link to="/studio" className="text-silver hover:text-ivory transition-colors border border-silver/20 px-2 py-1 bg-carbon">STUDIO</Link>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          
          {/* Desktop Search */}
          <div className="hidden md:flex relative group items-center">
            <Search className="absolute left-3 w-4 h-4 text-silver group-focus-within:text-rose transition-colors" />
            <input 
              type="text"
              placeholder="Inject search vector..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-48 focus:w-64 transition-all duration-500 bg-graphite/80 backdrop-blur border border-silver/20 rounded-none py-1.5 pl-9 pr-8 text-xs font-mono text-ivory focus:outline-none focus:border-rose/50 placeholder:text-silver/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-1 text-silver hover:text-ivory"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex p-1 bg-graphite/80 backdrop-blur rounded-none border border-silver/20 overflow-x-auto custom-scrollbar">
            {(['MACHINE', 'AUTHOR', 'MISREAD', 'VISUAL'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all",
                  viewMode === mode ? "bg-silver/10 text-ivory" : "text-silver hover:text-ivory hover:bg-white/5"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="hidden md:flex p-1 bg-graphite/80 backdrop-blur rounded-none border border-silver/20">
            <button
              onClick={() => setLayoutMode('FIELD')}
              className={cn(
                "px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-2",
                layoutMode === 'FIELD' ? "bg-silver/10 text-ivory" : "text-silver hover:text-ivory hover:bg-white/5"
              )}
            >
              <Orbit className="w-3 h-3" /> FIELD
            </button>
            <button
              onClick={() => setLayoutMode('RACK')}
              className={cn(
                "px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-2",
                layoutMode === 'RACK' ? "bg-silver/10 text-ivory" : "text-silver hover:text-ivory hover:bg-white/5"
              )}
            >
              <Columns3 className="w-3 h-3" /> RACK
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-hidden bg-carbon">
        {layoutMode === 'FIELD' ? (
          <FieldView 
            artifacts={artifacts} 
            viewMode={viewMode}
            queryVector={queryVector}
            onSelect={setSelectedArtifact}
            selectedId={selectedArtifact?.id || null}
          />
        ) : (
          <RackView 
            artifacts={artifacts} 
            viewMode={viewMode}
            queryVector={queryVector}
            onSelect={setSelectedArtifact}
            selectedId={selectedArtifact?.id || null}
          />
        )}
      </main>

      <ArtifactDrawer 
        artifact={selectedArtifact} 
        onClose={() => setSelectedArtifact(null)} 
      />

      {/* MOBILE PERSISTENT BOTTOM BAR */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 px-4 z-30 pointer-events-none flex flex-col items-center gap-4">
        
        {/* Mobile Search Input Expansion */}
        {isSearchOpen && (
          <div className="w-full relative pointer-events-auto shadow-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver" />
            <input 
              type="text"
              autoFocus
              placeholder="Inject search vector..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-graphite/95 backdrop-blur border border-silver/30 py-3 pl-10 pr-10 text-xs font-mono text-ivory focus:outline-none focus:border-rose/50"
            />
            <button 
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-silver hover:text-ivory"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-2 pointer-events-auto">
          {!isSearchOpen && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 bg-graphite/90 backdrop-blur border border-silver/30 shadow-2xl px-5 py-3 rounded-none text-[10px] font-mono tracking-widest uppercase text-ivory active:scale-95 transition-transform"
            >
              <Search className="w-4 h-4"/>
              Search
            </button>
          )}

          <button
            onClick={() => setLayoutMode(layoutMode === 'FIELD' ? 'RACK' : 'FIELD')}
            className="flex items-center gap-2 bg-graphite/90 backdrop-blur border border-silver/30 shadow-2xl px-5 py-3 rounded-none text-[10px] font-mono tracking-widest uppercase text-ivory active:scale-95 transition-transform"
          >
            {layoutMode === 'FIELD' ? <Columns3 className="w-4 h-4"/> : <Orbit className="w-4 h-4"/>}
            {layoutMode === 'FIELD' ? 'List View' : 'Map View'}
          </button>
        </div>
      </div>
    </div>
  );
}
