import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, ChevronDown, ChevronUp, Sparkles, FilterX } from 'lucide-react';
import { Artifact } from '../types';
import { getClusterInfo, ClusterInfo } from '../lib/clusterColors';
import { cn } from '../utils/cn';

interface MachineClusterLegendProps {
  artifacts: Artifact[];
  activeCluster: string | null;
  onSelectCluster: (clusterKey: string | null) => void;
  hoveredCluster: string | null;
  onHoverCluster: (clusterKey: string | null) => void;
}

export function MachineClusterLegend({
  artifacts,
  activeCluster,
  onSelectCluster,
  hoveredCluster,
  onHoverCluster,
}: MachineClusterLegendProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Group and count artifacts by machine cluster
  const clustersData = useMemo(() => {
    const counts = new Map<string, number>();
    artifacts.forEach((art) => {
      const key = art.machineCluster || art.trace?.machineCluster || 'Unsorted';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    // Map each key to its ClusterInfo and sort by count descending
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        info: getClusterInfo(key),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [artifacts]);

  if (clustersData.length === 0) return null;

  return (
    <aside
      aria-label="Machine Cluster Legend"
      className="absolute bottom-20 left-4 md:bottom-6 md:left-6 z-20 pointer-events-auto select-none max-w-[calc(100vw-2rem)] md:max-w-sm"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-graphite/95 backdrop-blur-md border border-silver/20 shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Legend Header Bar */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center justify-between px-3.5 py-2.5 bg-carbon/70 border-b border-silver/10 cursor-pointer hover:bg-carbon/90 transition-colors"
          title={isExpanded ? "Collapse cluster legend" : "Expand cluster legend"}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-rose" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-ivory font-medium">
              Machine Space Clusters
            </span>
            <span className="text-[9px] font-mono text-silver/60 px-1 py-0.2 border border-silver/20 bg-void/50">
              {clustersData.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeCluster && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCluster(null);
                }}
                className="text-[9px] font-mono text-rose hover:text-ivory flex items-center gap-1 transition-colors px-1 py-0.5 bg-rose/10 border border-rose/30"
                title="Clear cluster filter"
              >
                <FilterX className="w-2.5 h-2.5" />
                CLEAR
              </button>
            )}
            <button
              type="button"
              className="text-silver hover:text-ivory p-0.5 transition-colors"
              aria-label={isExpanded ? "Collapse legend" : "Expand legend"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Legend Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3.5 py-2 border-b border-silver/10 bg-void/40">
                <p className="text-[10px] font-mono text-silver/70 leading-relaxed">
                  2D PCA projection of Gemini &amp; SigLIP embeddings. Colors designate latent neighborhoods:
                </p>
              </div>

              <div className="max-h-56 md:max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {clustersData.map(({ info, count }) => {
                  const isFiltered = activeCluster === info.key;
                  const isHovered = hoveredCluster === info.key;
                  const isDimmed =
                    (activeCluster && !isFiltered) ||
                    (hoveredCluster && !isHovered && !activeCluster);

                  return (
                    <div
                      key={info.key}
                      onClick={() =>
                        onSelectCluster(isFiltered ? null : info.key)
                      }
                      onMouseEnter={() => onHoverCluster(info.key)}
                      onMouseLeave={() => onHoverCluster(null)}
                      className={cn(
                        "group p-2 transition-all cursor-pointer border text-left",
                        isFiltered
                          ? "bg-silver/15 border-ivory/60 shadow-md"
                          : isHovered
                          ? "bg-silver/10 border-silver/40"
                          : "bg-carbon/40 border-transparent hover:border-silver/20",
                        isDimmed && "opacity-40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Color Swatch Dot */}
                          <span
                            className="w-2.5 h-2.5 rounded-none flex-shrink-0 shadow-sm"
                            style={{
                              backgroundColor: info.color,
                              boxShadow: `0 0 8px ${info.color}80`,
                            }}
                          />
                          <span className="text-[11px] font-mono text-ivory font-medium truncate">
                            {info.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[9px] font-mono text-silver/50 hidden sm:inline">
                            [{info.key}]
                          </span>
                          <span className="text-[9px] font-mono text-silver/80 px-1 bg-void/60 border border-silver/10">
                            {count}
                          </span>
                        </div>
                      </div>

                      {/* Cluster Meaning / Explanation */}
                      <p className="text-[10px] text-silver/70 mt-1 leading-snug line-clamp-2 pl-4">
                        {info.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Footer Tip */}
              <div className="px-3 py-1.5 bg-void/70 border-t border-silver/10 flex items-center justify-between text-[9px] font-mono text-silver/50">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-rose/70" />
                  Click cluster to isolate in space
                </span>
                {activeCluster && (
                  <span className="text-rose font-medium">FILTER ACTIVE</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
