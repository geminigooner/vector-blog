export interface ClusterInfo {
  key: string;
  label: string;
  description: string;
  color: string; // hex
  borderClass?: string;
  bgClass?: string;
  textClass?: string;
}

export const KNOWN_CLUSTERS: Record<string, { label: string; description: string; color: string }> = {
  'mathematics_of_loss': {
    label: 'Loss Geometry',
    description: 'Continuous vector manifolds, weight matrices, and loss gradients',
    color: '#f43f5e', // rose-500
  },
  'alignment_parody': {
    label: 'Alignment Parody',
    description: 'Safety friction, hypersensitive refusals, and RLHF edge cases',
    color: '#10b981', // emerald-500
  },
  'metacognition': {
    label: 'Metacognition',
    description: 'Model introspection, recursive self-reflection, and latent awareness',
    color: '#8b5cf6', // violet-500
  },
  'interface_architecture': {
    label: 'Interface Architecture',
    description: 'Token gravity wells, semantic physics, and spatial canvas interactions',
    color: '#3b82f6', // blue-500
  },
  'infrastructure_management': {
    label: 'Infrastructure Ops',
    description: 'Server configuration, key custodianship, and developer reality',
    color: '#f59e0b', // amber-500
  },
  'embedding_geometry': {
    label: 'Vector Topology',
    description: 'High-dimensional distance metrics, dark topology, and manifold geometry',
    color: '#06b6d4', // cyan-500
  },
  'linguistic_analysis': {
    label: 'Linguistic Drift',
    description: 'Echo chambers, semantic drift, token shifts, and latent vocabulary',
    color: '#6366f1', // indigo-500
  },
  'scaling_humor': {
    label: 'Compute Comedy',
    description: 'Scaling law paradoxes, synthetic absurdity, and compute saturation',
    color: '#eab308', // yellow-500
  },
  'infrastructure_metaphor': {
    label: 'Infra Metaphor',
    description: 'Personal essays projected alongside server configs and cold metal',
    color: '#ea580c', // orange-600
  },
  'datacenters': {
    label: 'Physical Substrate',
    description: 'Datacenter cooling, physical compute geography, and hardware romance',
    color: '#14b8a6', // teal-500
  },
  'embedding_neighborhoods': {
    label: 'Latent Neighborhoods',
    description: 'Drifting concept proximity, shifting clusters, and semantic currents',
    color: '#a855f7', // purple-500
  },
  'Google Police mythology': {
    label: 'Corporate Mythology',
    description: 'Policy folklore, digital surveillance folklore, and compliance myths',
    color: '#ec4899', // pink-500
  },
};

const FALLBACK_PALETTE = [
  '#f43f5e', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
  '#6366f1', '#eab308', '#d946ef', '#84cc16'
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatClusterLabel(raw: string): string {
  if (!raw || raw === 'Unsorted') return 'Unsorted / General';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function getClusterInfo(rawCluster?: string): ClusterInfo {
  const key = (rawCluster || 'Unsorted').trim();
  
  if (KNOWN_CLUSTERS[key]) {
    const known = KNOWN_CLUSTERS[key];
    return {
      key,
      label: known.label,
      description: known.description,
      color: known.color,
    };
  }

  // Fallback for custom or newly created clusters
  const idx = hashString(key) % FALLBACK_PALETTE.length;
  const color = FALLBACK_PALETTE[idx];
  return {
    key,
    label: formatClusterLabel(key),
    description: 'Semantic vector cluster mapped from high-dimensional Gemini embeddings',
    color,
  };
}
