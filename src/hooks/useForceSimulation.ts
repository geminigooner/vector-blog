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

    if (nodesRef.current.length === 0) {
      nodesRef.current = artifacts.map((a, i) => {
        // Deterministic pseudo-random based on index for initial scatter
        const detX = ((i * 137.5) % 100) - 50;
        const detY = ((i * 193.1) % 100) - 50;
        return {
          artifact: a,
          id: a.id,
          targetX: 0, targetY: 0, relevance: 1,
          x: detX,
          y: detY
        };
      });
    }

    nodesRef.current.forEach((n, i) => {
      // Update artifact reference
      n.artifact = artifacts[i];
      n.relevance = n.artifact.searchRelevance ?? (searchQuery ? 0.05 : 1);

      if (viewMode === 'AUTHOR') {
        n.targetX = n.artifact.authorLocation.x;
        n.targetY = n.artifact.authorLocation.y;
      } else if (viewMode === 'MACHINE') {
        n.targetX = n.artifact.machineLocation.x;
        n.targetY = n.artifact.machineLocation.y;
      } else if (viewMode === 'VISUAL') {
        n.targetX = n.artifact.visualLocation?.x || 0;
        n.targetY = n.artifact.visualLocation?.y || 0;
      } else {
        // MISREAD
        n.targetX = (n.artifact.authorLocation.x + n.artifact.machineLocation.x) / 2;
        n.targetY = (n.artifact.authorLocation.y + n.artifact.machineLocation.y) / 2;
      }

      if (searchQuery) {
        if (n.relevance > 0.6) {
            n.targetX = 0; 
            n.targetY = 0;
        } else {
            n.targetX *= 1.8;
            n.targetY *= 1.8;
        }
      }
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
            if (searchQuery && d.relevance > 0.6) return 140; // Expand relevant
            if (searchQuery && d.relevance <= 0.6) return 40;  // Compress distant
            return 90; // Default spacing
        }).iterations(3));
       
    sim.alpha(1).restart();

  }, [artifacts, viewMode, searchQuery, width, height]);

  return nodes;
}
