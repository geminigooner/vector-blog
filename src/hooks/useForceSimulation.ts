import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import { Artifact, ViewMode } from '../types';

export interface SimNode extends d3.SimulationNodeDatum {
  artifact: Artifact;
  targetX: number;
  targetY: number;
  relevance: number;
  id: string;
}

export function useForceSimulation(
  artifacts: Artifact[],
  viewMode: ViewMode,
  searchQuery: string,
  width: number,
  height: number
) {
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const simRef = useRef<d3.Simulation<SimNode, undefined> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);

  useEffect(() => {
    if (!width || !height) return;

    const prev = new Map(nodesRef.current.map(n => [n.id, n]));
    nodesRef.current = artifacts.map((a, i) => {
      const existing = prev.get(a.id);
      if (existing) {
        existing.artifact = a;
        return existing;
      }
      return {
        artifact: a,
        id: a.id,
        targetX: 0, targetY: 0, relevance: 1,
        x: ((i * 137.5) % 100) - 50,
        y: ((i * 193.1) % 100) - 50,
      };
    });

    nodesRef.current.forEach((n) => {
      n.relevance = n.artifact.searchRelevance ?? (searchQuery ? 0.05 : 1);

      let tx = 0;
      let ty = 0;

      if (viewMode === 'AUTHOR') {
        tx = n.artifact.authorLocation?.x ?? 0;
        ty = n.artifact.authorLocation?.y ?? 0;
      } else if (viewMode === 'MACHINE') {
        tx = n.artifact.machineLocation?.x ?? 0;
        ty = n.artifact.machineLocation?.y ?? 0;
      } else if (viewMode === 'VISUAL') {
        tx = n.artifact.visualLocation?.x || 0;
        ty = n.artifact.visualLocation?.y || 0;
      } else {
        // MISREAD
        tx = ((n.artifact.authorLocation?.x ?? 0) + (n.artifact.machineLocation?.x ?? 0)) / 2;
        ty = ((n.artifact.authorLocation?.y ?? 0) + (n.artifact.machineLocation?.y ?? 0)) / 2;
      }

      n.targetX = isNaN(tx) ? 0 : tx;
      n.targetY = isNaN(ty) ? 0 : ty;

      if (searchQuery) {
        if (n.relevance > 0.6) {
            n.targetX = 0; 
            n.targetY = 0;
        } else {
            n.targetX *= 1.8;
            n.targetY *= 1.8;
        }
      }

      if (isNaN(n.x)) n.x = 0;
      if (isNaN(n.y)) n.y = 0;
      if (isNaN(n.vx!)) n.vx = 0;
      if (isNaN(n.vy!)) n.vy = 0;
    });

    if (!simRef.current) {
      simRef.current = d3.forceSimulation<SimNode>(nodesRef.current)
        .force('charge', d3.forceManyBody().strength(-20))
        .alphaTarget(0.002) // minimal drift
        .on('tick', () => {
          setNodes([...nodesRef.current]);
        });
    }

    const sim = simRef.current;
    // Update nodes data in simulation in case artifacts changed
    sim.nodes(nodesRef.current);
    
    sim.force('x', d3.forceX<SimNode>(d => d.targetX).strength(d => (searchQuery && d.relevance > 0.6 ? 0.1 : 0.04)))
       .force('y', d3.forceY<SimNode>(d => d.targetY).strength(d => (searchQuery && d.relevance > 0.6 ? 0.1 : 0.04)))
       .force('collide', d3.forceCollide<SimNode>().radius(d => {
            const w = (searchQuery && d.relevance <= 0.6) ? 140 : 240;
            const h = (searchQuery && d.relevance <= 0.6) ? 120 : 300;
            return Math.hypot(w, h) / 2 + 12;   // half-diagonal + margin
        }).iterations(4));
       
    sim.alpha(1).restart();

  }, [artifacts, viewMode, searchQuery, width, height]);

  return nodes;
}
