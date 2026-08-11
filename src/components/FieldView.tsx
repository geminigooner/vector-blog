import React, { useRef, useState, useEffect } from 'react';
import useMeasure from 'react-use-measure';
import { motion, AnimatePresence } from 'motion/react';
import { Artifact, ViewMode, SearchVector } from '../types';
import { getFirstImage } from '../lib/data';
import { useForceSimulation } from '../hooks/useForceSimulation';
import { cn } from '../utils/cn';
import { LocateFixed } from 'lucide-react';

interface FieldViewProps {
  artifacts: Artifact[];
  viewMode: ViewMode;
  queryVector: SearchVector | null;
  onSelect: (artifact: Artifact) => void;
  selectedId: string | null;
}

// clip a center-to-center segment at the target card's rect
function trimToRect(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, w: number, h: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const hw = w / 2, hh = h / 2;
  const tx = dx ? hw / Math.abs(dx) : Infinity;
  const ty = dy ? hh / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty, 1); // fraction of the segment inside the card
  return { x: cx - dx * t, y: cy - dy * t };
}

export function FieldView({ artifacts, viewMode, queryVector, onSelect, selectedId }: FieldViewProps) {
  const [ref, bounds] = useMeasure();
  const nodes = useForceSimulation(artifacts, viewMode, queryVector?.query || '', bounds.width, bounds.height);
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPan.current.x;
    const dy = e.clientY - lastPan.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPan.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      ref={ref}
      className="relative w-full h-full overflow-hidden bg-carbon cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(var(--color-silver) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      <div 
        className="absolute top-1/2 left-1/2"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >

        <AnimatePresence>
          {queryVector && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none z-10"
              style={{ x: queryVector.location.x, y: queryVector.location.y }}
            >
              <div className="flex items-center gap-2 px-2 py-1 bg-rose/10 border border-rose/30 text-rose text-[9px] font-mono uppercase tracking-widest backdrop-blur-sm">
                <LocateFixed className="w-3 h-3" />
                QUERY VECTOR: {queryVector.query}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {nodes.map(node => {
          if (!node || !node.artifact) return null;
          const isSelected = selectedId === node.id;
          let isRelevant = queryVector ? node.relevance > 0.6 : true;
          let opacity = queryVector ? Math.max(0.3, node.relevance) : (selectedId && !isSelected ? 0.3 : 1);
          
          if (viewMode === 'VISUAL' && !node.artifact.visualLocation) {
            isRelevant = false;
            opacity = 0.15;
          }

          const scale = isSelected ? 1.05 : (queryVector ? Math.max(0.7, node.relevance) : 1);
          
          return (
            <motion.div
              key={node.id}
              className="absolute z-10"
              style={{
                width: isRelevant ? 240 : 140,
              }}
              animate={{
                x: node.x || 0,
                y: node.y || 0,
                scale,
                opacity,
              }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            >
              <div
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 p-4 transition-colors w-full",
                  "bg-graphite/90 backdrop-blur-sm border border-silver/20 hover:border-ivory/50 cursor-pointer shadow-2xl",
                  !isRelevant && "pointer-events-none"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(node.artifact);
                }}
              >
                <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-silver/10 pb-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-silver/60 font-mono">{node.artifact.id.replace('art-', '#')}</span>
                    <span className={cn(
                      "text-[9px] uppercase tracking-widest font-mono",
                      isRelevant ? "text-silver" : "text-silver/50"
                    )}>
                      {node.artifact.type}
                    </span>
                  </div>
                  {isRelevant && node.artifact.type === 'Demo' && <div className="w-1.5 h-1.5 bg-indicator-yellow" />}
                  {isRelevant && node.artifact.type === 'Meme' && <div className="w-1.5 h-1.5 bg-indicator-green" />}
                  {isRelevant && node.artifact.type === 'Project' && <div className="w-1.5 h-1.5 bg-indicator-blue" />}
                  {isRelevant && node.artifact.type === 'Essay' && <div className="w-1.5 h-1.5 bg-rose" />}
                </div>                
                {isRelevant && getFirstImage(node.artifact) && (
                  <div className="w-full aspect-square mt-2 mb-2 bg-carbon/50 overflow-hidden border border-silver/10 rounded-sm">
                    {getFirstImage(node.artifact)?.startsWith('data:video/') ? (
                      <video 
                        src={getFirstImage(node.artifact)} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <img 
                        src={getFirstImage(node.artifact)} 
                        alt="Thumbnail" 
                        loading="lazy"
                        className="w-full h-full object-cover" 
                        draggable={false}
                      />
                    )}
                  </div>
                )}
                
                {(node.artifact.title || node.artifact.excerpt || !getFirstImage(node.artifact)) && (
                  <h3 className={cn(
                    "font-serif leading-tight",
                    isRelevant ? "text-lg text-ivory" : "text-sm text-ivory/70 line-clamp-2"
                  )}>
                    {node.artifact.title || 'Untitled Artifact'}
                  </h3>
                )}
                
                {isRelevant && node.artifact.excerpt && (
                  <p className="text-xs text-silver line-clamp-3 mt-2 leading-relaxed">
                    {node.artifact.excerpt}
                  </p>
                )}
              </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
