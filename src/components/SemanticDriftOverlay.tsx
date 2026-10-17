import React, { useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import { Artifact, ViewMode } from '../types';
import { SimNode } from '../hooks/useForceSimulation';
import { Play, Pause, RotateCcw, Route, Calendar, X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SemanticDriftOverlayProps {
  nodes: SimNode[];
  viewMode: ViewMode;
  onSelect: (artifact: Artifact) => void;
  selectedId: string | null;
  compact?: boolean;
  pan: { x: number; y: number };
  width: number;
  height: number;
  onClose?: () => void;
}

export function parseArtifactDate(artifact: Artifact): number {
  if (artifact.trace?.datePublished) {
    const t = Date.parse(artifact.trace.datePublished);
    if (!isNaN(t)) return t;
  }
  if (artifact.date) {
    const t = Date.parse(artifact.date);
    if (!isNaN(t)) return t;
  }
  const num = parseInt(artifact.id.replace(/\D/g, ''), 10);
  return isNaN(num) ? 0 : num * 86400000;
}

export function formatEpochDate(timestamp: number): string {
  if (!timestamp) return 'Undated';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

interface TemporalEpoch {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  nodes: SimNode[];
  centroid: { x: number; y: number };
  radius: number;
}

export function SemanticDriftOverlay({
  nodes,
  viewMode,
  onSelect,
  selectedId,
  compact = false,
  pan,
  width,
  height,
  onClose,
}: SemanticDriftOverlayProps) {
  // Sort nodes chronologically
  const sortedNodes = useMemo(() => {
    return [...nodes]
      .filter((n) => n.artifact && !isNaN(n.x ?? 0) && !isNaN(n.y ?? 0))
      .sort((a, b) => parseArtifactDate(a.artifact) - parseArtifactDate(b.artifact));
  }, [nodes]);

  const [stepIndex, setStepIndex] = useState<number>(() => Math.max(0, sortedNodes.length - 1));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1200); // ms per step
  const [driftMode, setDriftMode] = useState<'PATH' | 'CENTROIDS' | 'BOTH'>('BOTH');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(compact);

  // Keep stepIndex bounded when sortedNodes length changes
  useEffect(() => {
    if (sortedNodes.length > 0 && stepIndex >= sortedNodes.length) {
      setStepIndex(sortedNodes.length - 1);
    }
  }, [sortedNodes.length, stepIndex]);

  // Autoplay loop
  useEffect(() => {
    if (!isPlaying || sortedNodes.length <= 1) return;

    const interval = setInterval(() => {
      setStepIndex((curr) => {
        if (curr >= sortedNodes.length - 1) {
          setIsPlaying(false);
          return curr;
        }
        return curr + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, sortedNodes.length, playbackSpeed]);

  // Active subset of nodes based on scrubber
  const activeNodes = useMemo(() => {
    if (sortedNodes.length === 0) return [];
    return sortedNodes.slice(0, stepIndex + 1);
  }, [sortedNodes, stepIndex]);

  // Chronological trajectory path through all visible steps
  const { pathData, totalDisplacement } = useMemo(() => {
    if (activeNodes.length < 2) {
      return { pathData: '', totalDisplacement: 0 };
    }

    const lineGenerator = d3
      .line<SimNode>()
      .x((d) => d.x ?? 0)
      .y((d) => d.y ?? 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    const fullPath = lineGenerator(activeNodes) || '';

    // Calculate pairwise segments and displacement
    let accumDist = 0;
    for (let i = 1; i < activeNodes.length; i++) {
      const prev = activeNodes[i - 1];
      const curr = activeNodes[i];
      const dx = (curr.x ?? 0) - (prev.x ?? 0);
      const dy = (curr.y ?? 0) - (prev.y ?? 0);
      accumDist += Math.hypot(dx, dy);
    }

    return { pathData: fullPath, totalDisplacement: Math.round(accumDist) };
  }, [activeNodes]);

  // Group nodes into chronological epochs (e.g. months / quarters)
  const epochs = useMemo<TemporalEpoch[]>(() => {
    if (sortedNodes.length === 0) return [];

    const epochMap = new Map<string, SimNode[]>();
    for (const node of activeNodes) {
      const time = parseArtifactDate(node.artifact);
      const key = formatShortDate(time) || 'Undated';
      if (!epochMap.has(key)) epochMap.set(key, []);
      epochMap.get(key)!.push(node);
    }

    const result: TemporalEpoch[] = [];
    for (const [key, epNodes] of epochMap.entries()) {
      const xs = epNodes.map((n) => n.x ?? 0);
      const ys = epNodes.map((n) => n.y ?? 0);
      const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
      const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;

      // Calculate radius of dispersion
      const maxDist = epNodes.reduce((max, n) => {
        return Math.max(max, Math.hypot((n.x ?? 0) - avgX, (n.y ?? 0) - avgY));
      }, 30);

      const times = epNodes.map((n) => parseArtifactDate(n.artifact)).filter(Boolean);
      result.push({
        id: key,
        label: key,
        startTime: times.length ? Math.min(...times) : 0,
        endTime: times.length ? Math.max(...times) : 0,
        nodes: epNodes,
        centroid: { x: avgX, y: avgY },
        radius: Math.max(maxDist + 24, 45),
      });
    }

    return result;
  }, [activeNodes, sortedNodes.length]);

  // Centroid drift line generator
  const centroidPathData = useMemo(() => {
    if (epochs.length < 2) return '';
    const gen = d3
      .line<TemporalEpoch>()
      .x((d) => d.centroid.x)
      .y((d) => d.centroid.y)
      .curve(d3.curveMonotoneX);
    return gen(epochs) || '';
  }, [epochs]);

  const activeNode = sortedNodes[stepIndex];
  const firstDate = sortedNodes[0] ? parseArtifactDate(sortedNodes[0].artifact) : 0;
  const lastDate = sortedNodes[sortedNodes.length - 1]
    ? parseArtifactDate(sortedNodes[sortedNodes.length - 1].artifact)
    : 0;

  // Origin point corresponding to card container center
  const originX = width / 2 + pan.x;
  const originY = height / 2 + pan.y;

  return (
    <>
      {/* SVG Canvas Layer (aligned 1:1 with card coordinates) */}
      <svg
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10"
      >
        <defs>
          <filter id="drift-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="drift-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#71717a" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#e4e4e7" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="centroid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.8" />
          </linearGradient>

          <marker
            id="drift-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#f43f5e" fillOpacity="0.9" />
          </marker>

          <marker
            id="centroid-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" fillOpacity="0.8" />
          </marker>
        </defs>

        <g transform={`translate(${originX}, ${originY})`}>
          {/* 1. Epoch Dispersion Fields (Centroid Mode or Both) */}
          {(driftMode === 'CENTROIDS' || driftMode === 'BOTH') && (
            <g className="epochs-layer">
              {epochs.map((ep, idx) => {
                const isCurrent = idx === epochs.length - 1;
                return (
                  <g key={ep.id} className="transition-all duration-700">
                    {/* Dispersion bubble */}
                    <circle
                      cx={ep.centroid.x}
                      cy={ep.centroid.y}
                      r={ep.radius}
                      fill={isCurrent ? 'rgba(244, 63, 94, 0.05)' : 'rgba(255, 255, 255, 0.02)'}
                      stroke={isCurrent ? 'rgba(244, 63, 94, 0.35)' : 'rgba(161, 161, 170, 0.15)'}
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    {/* Centroid core dot */}
                    <circle
                      cx={ep.centroid.x}
                      cy={ep.centroid.y}
                      r={isCurrent ? 6 : 4}
                      fill={isCurrent ? '#f43f5e' : '#a1a1aa'}
                      filter="url(#drift-glow)"
                      opacity={isCurrent ? 0.9 : 0.6}
                    />
                    {/* Epoch label */}
                    <text
                      x={ep.centroid.x}
                      y={ep.centroid.y - ep.radius - 8}
                      textAnchor="middle"
                      className="font-mono text-[9px] uppercase tracking-widest select-none fill-silver/70 font-semibold"
                    >
                      ERA {idx + 1}: {ep.label} ({ep.nodes.length})
                    </text>
                  </g>
                );
              })}

              {/* Centroid macro-trajectory vector */}
              {centroidPathData && (
                <path
                  d={centroidPathData}
                  fill="none"
                  stroke="url(#centroid-gradient)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  filter="url(#drift-glow)"
                  markerEnd="url(#centroid-arrow)"
                  className="transition-all duration-500"
                />
              )}
            </g>
          )}

          {/* 2. Granular Node-to-Node Chronological Spline (Path Mode or Both) */}
          {(driftMode === 'PATH' || driftMode === 'BOTH') && pathData && (
            <g className="trajectory-layer">
              {/* Ambient background glow path */}
              <path
                d={pathData}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="5"
                strokeOpacity="0.25"
                filter="url(#drift-glow)"
              />

              {/* Main trajectory spline */}
              <path
                d={pathData}
                fill="none"
                stroke="url(#drift-gradient)"
                strokeWidth="2"
                markerEnd="url(#drift-arrow)"
              />

              {/* Directional animated flow dashed path */}
              <path
                d={pathData}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeOpacity="0.45"
                strokeDasharray="4 12"
                className="animate-pulse"
              />
            </g>
          )}

          {/* 3. Milestone Nodes & Step Markers */}
          <g className="milestones-layer pointer-events-auto">
            {activeNodes.map((node, i) => {
              const isLatest = i === activeNodes.length - 1;
              const isSelected = selectedId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const dateStr = formatEpochDate(parseArtifactDate(node.artifact));

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x || 0}, ${node.y || 0})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(node.artifact);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-125"
                >
                  {/* Halo for current active step or selected */}
                  {(isLatest || isSelected || isHovered) && (
                    <circle
                      r={isLatest ? 18 : 14}
                      fill="none"
                      stroke={isLatest ? '#f43f5e' : '#ffffff'}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="animate-spin"
                      style={{ animationDuration: '6s' }}
                    />
                  )}

                  {/* Milestone Node Disc */}
                  <circle
                    r={isLatest ? 7 : 5}
                    fill={isLatest ? '#f43f5e' : isSelected ? '#ffffff' : '#18181b'}
                    stroke={isLatest ? '#ffffff' : '#71717a'}
                    strokeWidth="1.5"
                    filter={isLatest ? 'url(#drift-glow)' : undefined}
                  />

                  {/* Step index badge */}
                  <text
                    y={isLatest ? -13 : -10}
                    textAnchor="middle"
                    className={cn(
                      "font-mono text-[8px] font-bold select-none",
                      isLatest ? "fill-rose font-mono" : "fill-silver/80"
                    )}
                  >
                    #{i + 1}
                  </text>

                  {/* Interactive Tooltip on hover */}
                  {isHovered && (
                    <g transform="translate(0, -28)" className="pointer-events-none z-50">
                      <rect
                        x="-80"
                        y="-26"
                        width="160"
                        height="26"
                        fill="#09090b"
                        stroke="#f43f5e"
                        strokeWidth="1"
                        rx="2"
                        opacity="0.95"
                      />
                      <text
                        x="0"
                        y="-14"
                        textAnchor="middle"
                        fill="#fafafa"
                        className="font-serif text-[10px] font-medium select-none truncate max-w-[150px]"
                      >
                        {node.artifact.title || 'Untitled'}
                      </text>
                      <text
                        x="0"
                        y="-4"
                        textAnchor="middle"
                        fill="#a1a1aa"
                        className="font-mono text-[8px] select-none"
                      >
                        {dateStr}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Floating HUD Controller (Viewport-fixed overlay inside FieldView) */}
      <div 
        className={cn(
          "absolute z-30 pointer-events-auto select-none",
          compact ? "bottom-24 left-4 right-4" : "bottom-6 left-6 w-80 md:w-88"
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="bg-graphite/95 backdrop-blur-md border border-silver/20 shadow-2xl p-4 text-ivory">
          
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-silver/10 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Route className="w-3.5 h-3.5 text-rose animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ivory font-semibold">
                SEMANTIC DRIFT
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-silver/60">
                {stepIndex + 1}/{sortedNodes.length}
              </span>
              <button
                onClick={() => setIsHudMinimized(!isHudMinimized)}
                className="text-[9px] font-mono text-silver hover:text-ivory px-1.5 py-0.5 border border-silver/10 hover:border-silver/30"
                title={isHudMinimized ? 'Expand HUD' : 'Collapse HUD'}
              >
                {isHudMinimized ? '+' : '−'}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-silver hover:text-rose p-0.5 ml-0.5 transition-colors"
                  title="Close Drift Overlay"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {!isHudMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-3"
            >
              {/* Active Item Snapshot */}
              {activeNode && (
                <div className="bg-carbon/80 border border-silver/10 p-2.5">
                  <div className="flex items-center justify-between text-[9px] font-mono text-silver/70 mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-rose" />
                      {formatEpochDate(parseArtifactDate(activeNode.artifact))}
                    </span>
                    <span className="text-rose font-semibold uppercase">
                      {activeNode.artifact.type}
                    </span>
                  </div>
                  <h4 
                    className="font-serif text-xs text-ivory line-clamp-1 cursor-pointer hover:text-rose transition-colors"
                    onClick={() => onSelect(activeNode.artifact)}
                  >
                    {activeNode.artifact.title || 'Untitled Artifact'}
                  </h4>
                  {activeNode.artifact.authorIntent && (
                    <p className="text-[9px] text-silver/50 font-mono mt-1 truncate">
                      Intent: {activeNode.artifact.authorIntent}
                    </p>
                  )}
                </div>
              )}

              {/* Scrubber slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[9px] font-mono text-silver/60">
                  <span>{formatShortDate(firstDate)}</span>
                  <span className="text-rose font-semibold">Timeline Scrubber</span>
                  <span>{formatShortDate(lastDate)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, sortedNodes.length - 1)}
                  value={stepIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setStepIndex(parseInt(e.target.value, 10));
                  }}
                  className="w-full accent-rose cursor-pointer h-1.5 bg-silver/20 rounded-none focus:outline-none"
                />
              </div>

              {/* Playback Controls & Mode Switches */}
              <div className="flex items-center justify-between pt-1 border-t border-silver/10">
                {/* Play/Pause/Reset */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (stepIndex >= sortedNodes.length - 1) setStepIndex(0);
                      setIsPlaying(!isPlaying);
                    }}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 border transition-colors",
                      isPlaying
                        ? "bg-rose/20 border-rose/50 text-rose"
                        : "bg-silver/10 border-silver/20 text-ivory hover:bg-white/10"
                    )}
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIndex(0);
                    }}
                    className="p-1 text-silver hover:text-ivory border border-silver/10 hover:border-silver/30"
                    title="Reset to beginning"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  {/* Playback speed toggle */}
                  <button
                    onClick={() => setPlaybackSpeed((s) => (s === 1200 ? 600 : s === 600 ? 300 : 1200))}
                    className="px-1.5 py-1 text-[8px] font-mono text-silver/80 border border-silver/10 hover:text-ivory"
                    title="Playback Speed"
                  >
                    {playbackSpeed === 1200 ? '1x' : playbackSpeed === 600 ? '2x' : '4x'}
                  </button>
                </div>

                {/* View Mode Pills (PATH vs CENTROIDS) */}
                <div className="flex items-center gap-1">
                  {(['PATH', 'CENTROIDS', 'BOTH'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDriftMode(mode)}
                      className={cn(
                        "px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider transition-colors border",
                        driftMode === mode
                          ? "bg-silver/20 border-silver/40 text-ivory"
                          : "border-transparent text-silver/50 hover:text-silver"
                      )}
                    >
                      {mode === 'CENTROIDS' ? 'ERA' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drift Metrics Footer */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-silver/10 text-[8px] font-mono text-silver/60">
                <div>
                  <span className="block text-[7px] text-silver/40 uppercase">Total Displacement</span>
                  <span className="text-ivory font-semibold">{totalDisplacement} px</span>
                </div>
                <div>
                  <span className="block text-[7px] text-silver/40 uppercase">Corpus Eras</span>
                  <span className="text-ivory font-semibold">{epochs.length} epochs</span>
                </div>
              </div>
            </motion.div>
          )}

          {isHudMinimized && activeNode && (
            <div className="flex items-center justify-between text-[9px] font-mono text-silver/80 pt-1">
              <span className="truncate max-w-[170px] text-ivory">
                {activeNode.artifact.title}
              </span>
              <button
                onClick={() => {
                  if (stepIndex >= sortedNodes.length - 1) setStepIndex(0);
                  setIsPlaying(!isPlaying);
                }}
                className="text-rose hover:underline"
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
