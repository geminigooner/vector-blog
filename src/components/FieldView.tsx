import React, { useRef, useState, useEffect } from 'react';
import useMeasure from 'react-use-measure';
import { motion, AnimatePresence } from 'motion/react';
import { Artifact, ViewMode, SearchVector } from '../types';
import { getFirstImage } from '../lib/data';
import { useForceSimulation } from '../hooks/useForceSimulation';
import { cn } from '../utils/cn';
import { isCompactViewport } from '../lib/cardMetrics';
import { LocateFixed, Route } from 'lucide-react';
import { SemanticDriftOverlay } from './SemanticDriftOverlay';
import { MachineClusterLegend } from './MachineClusterLegend';
import { getClusterInfo } from '../lib/clusterColors';

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
  const compact = isCompactViewport(bounds.width);
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showDrift, setShowDrift] = useState(false);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const isDragging = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (viewMode !== 'MACHINE') {
      setActiveCluster(null);
      setHoveredCluster(null);
    }
  }, [viewMode]);

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

          const clusterKey = node.artifact.machineCluster || node.artifact.trace?.machineCluster || 'Unsorted';
          const clusterInfo = getClusterInfo(clusterKey);
          const isClusterHighlighted = viewMode === 'MACHINE' && (activeCluster === clusterKey || hoveredCluster === clusterKey);
          const isClusterDimmed = viewMode === 'MACHINE' && (
            (activeCluster && activeCluster !== clusterKey) ||
            (hoveredCluster && !activeCluster && hoveredCluster !== clusterKey)
          );

          if (isClusterDimmed) {
            opacity = Math.min(opacity, 0.2);
          } else if (isClusterHighlighted) {
            opacity = 1;
          }

          const baseScale = compact ? 0.625 : 1;
          const scale = ((isSelected ? 1.05 : (queryVector ? Math.max(0.7, node.relevance) : 1)) + (isClusterHighlighted ? 0.04 : 0)) * baseScale;
          
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
                  "absolute -translate-x-1/2 -translate-y-1/2 transition-colors w-full p-4",
                  "bg-graphite/90 backdrop-blur-sm border shadow-2xl cursor-pointer",
                  isClusterHighlighted
                    ? "border-ivory ring-1 ring-ivory/50"
                    : "border-silver/20 hover:border-ivory/50",
                  !isRelevant && "pointer-events-none"
                )}
                style={
                  isClusterHighlighted
                    ? { borderColor: clusterInfo.color, boxShadow: `0 0 25px ${clusterInfo.color}50` }
                    : undefined
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(node.artifact);
                }}
              >
                <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-silver/10 pb-2 mb-1 gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] text-silver/60 font-mono flex-shrink-0">{node.artifact.id.replace('art-', '#')}</span>
                    <span className={cn(
                      "text-[9px] uppercase tracking-widest font-mono truncate",
                      isRelevant ? "text-silver" : "text-silver/50"
                    )}>
                      {node.artifact.type}
                    </span>
                  </div>

                  {viewMode === 'MACHINE' ? (
                    <div 
                      className="flex items-center gap-1.5 flex-shrink-0"
                      title={`Cluster: ${clusterInfo.label} [${clusterKey}]`}
                    >
                      <span 
                        className="w-2 h-2 flex-shrink-0 transition-transform"
                        style={{
                          backgroundColor: clusterInfo.color,
                          boxShadow: `0 0 6px ${clusterInfo.color}`
                        }}
                      />
                      <span className="text-[8px] font-mono uppercase tracking-wider text-silver/60 hidden sm:inline truncate max-w-[85px]">
                        {clusterInfo.label}
                      </span>
                    </div>
                  ) : (
                    <>
                      {isRelevant && node.artifact.type === 'Demo' && <div className="w-1.5 h-1.5 bg-indicator-yellow flex-shrink-0" />}
                      {isRelevant && node.artifact.type === 'Meme' && <div className="w-1.5 h-1.5 bg-indicator-green flex-shrink-0" />}
                      {isRelevant && node.artifact.type === 'Project' && <div className="w-1.5 h-1.5 bg-indicator-blue flex-shrink-0" />}
                      {isRelevant && node.artifact.type === 'Essay' && <div className="w-1.5 h-1.5 bg-rose flex-shrink-0" />}
                    </>
                  )}
                </div>                
                {isRelevant && getFirstImage(node.artifact) && (
                  <div className="w-full mt-2 mb-2 bg-carbon/50 overflow-hidden border border-silver/10 rounded-sm aspect-square">
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

      {/* Persistent Machine Mode Cluster Legend */}
      {viewMode === 'MACHINE' && (
        <MachineClusterLegend
          artifacts={artifacts}
          activeCluster={activeCluster}
          onSelectCluster={setActiveCluster}
          hoveredCluster={hoveredCluster}
          onHoverCluster={setHoveredCluster}
        />
      )}

      {/* Toggleable Semantic Drift Overlay & HUD */}
      {showDrift && bounds.width > 0 && (
        <SemanticDriftOverlay
          nodes={nodes}
          viewMode={viewMode}
          onSelect={onSelect}
          selectedId={selectedId}
          compact={compact}
          pan={pan}
          width={bounds.width}
          height={bounds.height}
          onClose={() => setShowDrift(false)}
        />
      )}

      {/* Floating Drift Toggle Button */}
      <div 
        className="absolute bottom-24 right-4 md:bottom-6 md:right-6 z-20 pointer-events-auto flex items-center gap-2 select-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowDrift((s) => !s)}
          className={cn(
            "px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-all shadow-2xl backdrop-blur-md border",
            showDrift
              ? "bg-rose/20 border-rose text-rose font-semibold"
              : "bg-graphite/90 border-silver/20 text-silver hover:text-ivory hover:border-silver/40"
          )}
          title="Toggle Semantic Drift Trajectory Overlay"
        >
          <Route className={cn("w-3.5 h-3.5", showDrift ? "text-rose animate-pulse" : "text-silver")} />
          <span>DRIFT {showDrift ? 'ON' : 'OVERLAY'}</span>
        </button>
      </div>
    </div>
  );
}
