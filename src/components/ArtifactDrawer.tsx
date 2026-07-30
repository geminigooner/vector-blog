import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Hash } from 'lucide-react';
import Markdown from 'react-markdown';
import { Artifact } from '../types';
import { cn } from '../utils/cn';

interface ArtifactDrawerProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export function ArtifactDrawer({ artifact, onClose }: ArtifactDrawerProps) {
  return (
    <AnimatePresence>
      {artifact && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-carbon/60 backdrop-blur-sm z-40 transition-opacity"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full md:w-[85vw] lg:w-[70vw] h-full bg-graphite border-l border-silver/20 shadow-2xl z-50 overflow-y-auto custom-scrollbar flex flex-col md:flex-row"
          >
            {/* Close Button (Mobile) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-carbon border border-silver/20 text-silver hover:text-ivory z-50 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Reading Experience */}
            <div className="flex-1 p-6 md:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-silver/10 overflow-y-auto custom-scrollbar bg-graphite">
              
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-[10px] font-mono text-silver/60 bg-carbon px-2 py-1 border border-silver/10">
                    {artifact.id.replace('art-', '#')}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-silver">
                    {artifact.type}
                  </span>
                  <span className="text-[10px] font-mono text-silver/40">
                    {artifact.date}
                  </span>
                </div>

                <h1 className="font-serif text-3xl md:text-5xl text-ivory leading-tight mb-4">
                  {artifact.title}
                </h1>
                
                {artifact.subtitle && (
                  <h2 className="font-serif text-xl md:text-2xl text-silver italic mb-8">
                    {artifact.subtitle}
                  </h2>
                )}

                <div className="mt-12 text-lg">
                  <div className="markdown-body">
                    <Markdown>{artifact.markdownBody}</Markdown>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Right Column: Trace Metadata */}
            <div className="w-full md:w-80 lg:w-96 p-6 md:p-8 bg-carbon/50 overflow-y-auto custom-scrollbar shrink-0">
              
              {/* Close Button (Desktop) */}
              <div className="hidden md:flex justify-end mb-8">
                <button
                  onClick={onClose}
                  className="p-2 border border-silver/20 text-silver hover:text-ivory bg-graphite hover:bg-silver/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-8">
                
                <div>
                  <h4 className="text-[9px] uppercase tracking-[0.2em] font-mono text-silver/60 mb-4 border-b border-silver/10 pb-2">
                    Semantic Displacement
                  </h4>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-mono text-ivory">{artifact.trace.semanticDisplacement.toFixed(1)}</span>
                    <span className="text-[10px] font-mono text-silver/60 mb-1">units</span>
                  </div>
                  <p className="text-xs text-silver font-serif italic">
                    The distance between the author's intended meaning and the machine's geometric interpretation.
                  </p>
                </div>

                <div>
                  <h4 className="text-[9px] uppercase tracking-[0.2em] font-mono text-silver/60 mb-4 border-b border-silver/10 pb-2">
                    Trace Record
                  </h4>
                  <dl className="space-y-3 text-[10px] font-mono">
                    
                    <div className="flex flex-col">
                      <dt className="text-silver/40 uppercase">Author Intent</dt>
                      <dd className="text-silver break-words mt-0.5">{artifact.trace.authorIntent}</dd>
                    </div>
                    
                    <div className="flex flex-col">
                      <dt className="text-silver/40 uppercase">Machine Cluster</dt>
                      <dd className="text-silver break-words mt-0.5">[{artifact.trace.machineCluster}]</dd>
                    </div>

                    <div className="flex justify-between items-start pt-2">
                      <div className="flex flex-col">
                        <dt className="text-silver/40 uppercase">Auth. Coordinate</dt>
                        <dd className="text-silver mt-0.5">
                          {artifact.trace.authorCoordinate.x.toFixed(1)}, {artifact.trace.authorCoordinate.y.toFixed(1)}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-silver/40 uppercase">Mach. Coordinate</dt>
                        <dd className="text-silver mt-0.5">
                          {artifact.trace.machineCoordinate.x.toFixed(1)}, {artifact.trace.machineCoordinate.y.toFixed(1)}
                        </dd>
                      </div>
                    </div>

                  </dl>
                </div>

                <div>
                  <h4 className="text-[9px] uppercase tracking-[0.2em] font-mono text-silver/60 mb-4 border-b border-silver/10 pb-2">
                    Provenance
                  </h4>
                  <dl className="space-y-3 text-[10px] font-mono">
                    {artifact.trace.writingProvenance && (
                      <div className="flex flex-col">
                        <dt className="text-silver/40 uppercase">Writing</dt>
                        <dd className="text-silver mt-0.5">{artifact.trace.writingProvenance}</dd>
                      </div>
                    )}
                    {artifact.trace.imageProvenance && (
                      <div className="flex flex-col">
                        <dt className="text-silver/40 uppercase">Imagery</dt>
                        <dd className="text-silver mt-0.5">{artifact.trace.imageProvenance}</dd>
                      </div>
                    )}
                    {artifact.trace.modelInvolvement && (
                      <div className="flex flex-col">
                        <dt className="text-silver/40 uppercase">Model Involvement</dt>
                        <dd className="text-silver mt-0.5">{artifact.trace.modelInvolvement}</dd>
                      </div>
                    )}
                    {artifact.trace.revisionCount !== undefined && (
                      <div className="flex flex-col">
                        <dt className="text-silver/40 uppercase">Revisions</dt>
                        <dd className="text-silver mt-0.5">{artifact.trace.revisionCount}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h4 className="text-[9px] uppercase tracking-[0.2em] font-mono text-silver/60 mb-4 border-b border-silver/10 pb-2">
                    Nearest Neighbors
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono text-silver/40 uppercase mb-2 block">Machine Space</span>
                      {artifact.trace.nearestMachineNeighbors.map(n => (
                        <div key={n.neighborId} className="flex justify-between items-center text-[10px] font-mono mt-1">
                          <span className="text-silver">{n.neighborId.replace('art-', '#')}</span>
                          <span className="text-silver/60">{n.distance.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-ivory/40 uppercase mb-2 block">Author Space</span>
                      {artifact.trace.nearestAuthorNeighbors.map(n => (
                        <div key={n.neighborId} className="flex justify-between items-center text-[10px] font-mono mt-1">
                          <span className="text-ivory/80">{n.neighborId.replace('art-', '#')}</span>
                          <span className="text-ivory/40">{n.distance.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
