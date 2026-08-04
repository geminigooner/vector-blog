export type Vec = number[];

export type Projection = {
  mean: Vec;
  components: [Vec, Vec];
  scale?: number;
};

export function cosine(a: Vec, b: Vec): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fixed LCG for deterministic layout
function lcg(seed: number) {
  let state = seed;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  }
}

export function fitProjection(vectors: Vec[]): Projection | null {
  if (vectors.length < 2) return null;
  const d = vectors[0].length;
  const n = vectors.length;
  
  const mean = new Array(d).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < d; i++) mean[i] += v[i] / n;
  }
  
  const centered = vectors.map(v => v.map((val, i) => val - mean[i]));
  const rand = lcg(42);
  
  let v1 = new Array(d).fill(0).map(() => rand() - 0.5);
  for (let iter = 0; iter < 20; iter++) {
    let nextV = new Array(d).fill(0);
    for (const x of centered) {
      let dot = 0;
      for (let i = 0; i < d; i++) dot += x[i] * v1[i];
      for (let i = 0; i < d; i++) nextV[i] += dot * x[i];
    }
    let norm = 0;
    for (let i = 0; i < d; i++) norm += nextV[i] * nextV[i];
    norm = Math.sqrt(norm);
    if (norm > 0) v1 = nextV.map(val => val / norm);
  }
  
  const deflated = centered.map(x => {
    let dot = 0;
    for (let i = 0; i < d; i++) dot += x[i] * v1[i];
    return x.map((val, i) => val - dot * v1[i]);
  });
  
  let v2 = new Array(d).fill(0).map(() => rand() - 0.5);
  for (let iter = 0; iter < 20; iter++) {
    let nextV = new Array(d).fill(0);
    for (const x of deflated) {
      let dot = 0;
      for (let i = 0; i < d; i++) dot += x[i] * v2[i];
      for (let i = 0; i < d; i++) nextV[i] += dot * x[i];
    }
    let norm = 0;
    for (let i = 0; i < d; i++) norm += nextV[i] * nextV[i];
    norm = Math.sqrt(norm);
    if (norm > 0) v2 = nextV.map(val => val / norm);
  }
  
  return { mean, components: [v1, v2] };
}

export function project(vec: Vec, projection: Projection) {
  const { mean, components, scale = 1 } = projection;
  let x = 0;
  let y = 0;
  for (let i = 0; i < vec.length; i++) {
    const centered = vec[i] - mean[i];
    x += centered * components[0][i];
    y += centered * components[1][i];
  }
  return { x: x * scale, y: y * scale };
}

export function machineNeighbors(id: string, vectors: Record<string, Vec>, k = 3) {
  const myVec = vectors[id];
  if (!myVec) return [];
  
  return Object.keys(vectors)
    .filter(otherId => otherId !== id && vectors[otherId])
    .map(otherId => ({
      neighborId: otherId,
      distance: 1 - cosine(myVec, vectors[otherId])
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

export function authorNeighbors(id: string, tagsById: Record<string, string[]>, k = 3) {
  const myTags = tagsById[id] || [];
  if (myTags.length === 0) return [];
  
  return Object.keys(tagsById)
    .filter(otherId => otherId !== id)
    .map(otherId => {
      const theirTags = tagsById[otherId] || [];
      const intersection = myTags.filter(t => theirTags.includes(t)).length;
      const union = new Set([...myTags, ...theirTags]).size;
      const jaccard = union === 0 ? 0 : intersection / union;
      return { neighborId: otherId, distance: 1 - jaccard };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);
}

export function buildAtlas(
  posts: any[],
  vecs: Record<string, Vec>,
  tagsById: Record<string, string[]>,
  categoryById: Record<string, string>
) {
  const postVecs = posts.map(p => vecs[p.id]).filter(Boolean);
  const projection = fitProjection(postVecs);
  
  let rawProjections: Record<string, {x: number, y: number}> = {};
  let maxX = 0;
  let maxY = 0;

  if (projection) {
    posts.forEach(post => {
      if (vecs[post.id]) {
        const raw = project(vecs[post.id], projection);
        rawProjections[post.id] = raw;
        if (Math.abs(raw.x) > maxX) maxX = Math.abs(raw.x);
        if (Math.abs(raw.y) > maxY) maxY = Math.abs(raw.y);
      }
    });
    
    const maxAxis = Math.max(maxX, maxY, 0.0001);
    projection.scale = 400 / maxAxis;
  }

  const artifacts = posts.map(post => {
    let machineLocation = { x: 0, y: 0 };
    if (rawProjections[post.id] && projection?.scale) {
      machineLocation = {
        x: rawProjections[post.id].x * projection.scale,
        y: rawProjections[post.id].y * projection.scale,
      };
    } else if (post.machineLocation) {
      machineLocation = post.machineLocation;
    }
    
    // authorLocation could be simple cluster packing or physics based on categories/tags.
    let authorLocation = { x: 0, y: 0 }; 
    const nearestMachineNeighbors = machineNeighbors(post.id, vecs, 3);
    const nearestAuthorNeighbors = authorNeighbors(post.id, tagsById, 3);

    const semanticDisplacement = Math.sqrt(
      Math.pow(machineLocation.x - authorLocation.x, 2) + 
      Math.pow(machineLocation.y - authorLocation.y, 2)
    );

    return {
      ...post,
      machineLocation,
      authorLocation,
      trace: {
        ...(post.trace || {}),
        nearestMachineNeighbors,
        nearestAuthorNeighbors: nearestAuthorNeighbors.length ? nearestAuthorNeighbors : nearestMachineNeighbors,
        semanticDisplacement
      }
    };
  });
  
  return { artifacts, projection };
}

export function semanticSearch(baseArtifacts: any[], vectors: Record<string, Vec>, qvec: Vec, projection: Projection | null) {
  const results = baseArtifacts.map(a => {
    const v = vectors[a.id];
    let sim = 0;
    if (v) sim = cosine(v, qvec);
    const searchRelevance = Math.max(0, Math.min(1, (sim - 0.3) / 0.5));
    return { ...a, searchRelevance };
  });
  
  let location = null;
  if (projection) {
    location = project(qvec, projection);
  }
  
  return { results, location };
}
