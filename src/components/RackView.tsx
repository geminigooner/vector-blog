import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Artifact, ViewMode, SearchVector } from '../types';
import { getFirstImage } from '../lib/data';
import { cn } from '../utils/cn';
import { LocateFixed } from 'lucide-react';

interface RackViewProps {
  artifacts: Artifact[];
  viewMode: ViewMode;
  queryVector: SearchVector | null;
  onSelect: (artifact: Artifact) => void;
  selectedId: string | null;
}

export function RackView({ artifacts, viewMode, queryVector, onSelect, selectedId }: RackViewProps) {
  // Sort primarily by relevance, then by cluster/intent
  const sorted = [...artifacts].sort((a, b) => {
    const relA = a.searchRelevance ?? 1;
    const relB = b.searchRelevance ?? 1;
    if (queryVector && relA !== relB) {
      return relB - relA;
    }
    if (viewMode === 'AUTHOR') return a.authorIntent.localeCompare(b.authorIntent);
    if (viewMode === 'MACHINE') return a.machineCluster.localeCompare(b.machineCluster);
    return 0;
  });

  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-12 pt-32 pb-12 bg-carbon custom-scrollbar">
      
      <AnimatePresence>
        {queryVector && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="max-w-6xl mx-auto mb-8 border-l-2 border-rose pl-4 py-1"
          >
            <div className="flex items-center gap-2 text-rose text-[9px] font-mono uppercase tracking-widest">
              <LocateFixed className="w-3 h-3" />
              QUERY VECTOR: {queryVector.query}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto flex flex-col gap-px bg-silver/20 border-x border-silver/20 relative">
        {/* Rack rail lines */}
        <div className="absolute top-0 bottom-0 left-4 w-px bg-silver/10 pointer-events-none hidden md:block" />
        <div className="absolute top-0 bottom-0 right-4 w-px bg-silver/10 pointer-events-none hidden md:block" />

        {sorted.map((artifact, idx) => {
          const isSelected = selectedId === artifact.id;
          const relevance = artifact.searchRelevance ?? 1;
          let isRelevant = queryVector ? relevance > 0.6 : true;
          let opacity = queryVector ? Math.max(0.3, relevance) : (selectedId && !isSelected ? 0.3 : 1);

          if (viewMode === 'VISUAL' && !artifact.visualLocation) {
            isRelevant = false;
            opacity = 0.15;
          }

          return (
            <motion.div
              layout
              key={artifact.id}
              className={cn(
                "relative transition-all cursor-pointer w-full bg-graphite hover:bg-silver/5",
                isRelevant ? "p-4 md:p-6" : "p-2 md:p-3 pointer-events-none",
                isSelected && "bg-silver/5"
              )}
              style={{ opacity }}
              onClick={() => onSelect(artifact)}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-8 ml-0 md:ml-8 mr-0 md:mr-8">
                
                {/* Meta column */}
                <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 w-full md:w-48 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-silver/60 bg-carbon px-1.5 py-0.5 border border-silver/10">
                      {artifact.id.replace('art-', '#')}
                    </span>
                    {isRelevant && artifact.type === 'Demo' && <div className="w-1.5 h-1.5 bg-indicator-yellow hidden md:block" />}
                    {isRelevant && artifact.type === 'Meme' && <div className="w-1.5 h-1.5 bg-indicator-green hidden md:block" />}
                    {isRelevant && artifact.type === 'Project' && <div className="w-1.5 h-1.5 bg-indicator-blue hidden md:block" />}
                    {isRelevant && artifact.type === 'Essay' && <div className="w-1.5 h-1.5 bg-rose hidden md:block" />}
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-mono text-silver hidden md:block mt-2">
                    {artifact.type}
                  </span>
                  <span className="text-[9px] font-mono text-silver/60 hidden md:block truncate w-full" title={artifact.machineCluster}>
                    [ {artifact.machineCluster} ]
                  </span>
                </div>

                {/* Content column */}
                <div className="flex-1 min-w-0">
                  {artifact.title && (
                    <h3 className={cn(
                      "font-serif leading-tight text-ivory truncate md:whitespace-normal",
                      isRelevant ? "text-lg md:text-xl" : "text-sm text-ivory/70"
                    )}>
                      {artifact.title}
                    </h3>
                  )}
                  
                  {isRelevant && artifact.excerpt && (
                    <p className="text-sm text-silver mt-2 leading-relaxed line-clamp-2 md:line-clamp-none max-w-2xl">
                      {artifact.excerpt}
                    </p>
                  )}
                </div>

                {isRelevant && getFirstImage(artifact) && (
                  <div className="w-24 h-24 shrink-0 bg-carbon/50 overflow-hidden border border-silver/10 rounded-sm ml-4">
                    <img 
                      src={getFirstImage(artifact)} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover" 
                      draggable={false}
                    />
                  </div>
                )}

              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
