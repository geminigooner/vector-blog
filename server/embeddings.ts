import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { mockArtifacts } from '../src/data/artifacts';
import { Artifact } from '../src/types';

// Cache file location
const CACHE_FILE = path.join(process.cwd(), 'data', 'embeddings.json');

let cachedArtifacts: Artifact[] = [];
let ai: GoogleGenAI | null = null;

function getAi() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate embeddings for all artifacts that don't have them
export async function initEmbeddings() {
  let cache: Record<string, number[]> = {};
  
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch (e) {
      console.error("Failed to read embeddings cache:", e);
    }
  }

  let needsSave = false;
  let aiClient: GoogleGenAI | null = null;
  try {
    aiClient = getAi();
  } catch (e) {
    console.warn("Skipping embedding generation: " + (e as Error).message);
  }
  
  cachedArtifacts = [...mockArtifacts];

  for (const artifact of cachedArtifacts) {
    if (!cache[artifact.id]) {
      if (!aiClient) {
        console.warn(`No API key available, skipping embedding for ${artifact.id}`);
        continue;
      }
      console.log(`Generating embedding for artifact ${artifact.id}...`);
      // Combine title, content, type, intent for embedding
      const textToEmbed = `${artifact.title}\n\nType: ${artifact.type}\nIntent: ${artifact.authorIntent}\n\n${artifact.markdownBody}`;
      
      const response = await aiClient.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: textToEmbed,
      });
      
      if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
        cache[artifact.id] = response.embeddings[0].values;
        needsSave = true;
      }
      
      // small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (needsSave) {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  }

  // Calculate nearest neighbors and assign machine locations based on PCA/first 2 components of embeddings
  // We'll just use the first two dimensions, scaled up, for machine locations
  // to give deterministic results.
  for (const artifact of cachedArtifacts) {
    const vecA = cache[artifact.id];
    if (vecA) {
      // Use first two components for machine location
      // Embeddings are typically small values, scale them up to fit the field [-400, 400]
      artifact.machineLocation = {
        x: vecA[0] * 5000,
        y: vecA[1] * 5000,
      };

      let maxSim = -1;
      let nearestNeighborId = '';
      
      for (const other of cachedArtifacts) {
        if (other.id !== artifact.id && cache[other.id]) {
          const sim = calculateCosineSimilarity(vecA, cache[other.id]);
          if (sim > maxSim) {
            maxSim = sim;
            nearestNeighborId = other.id;
          }
        }
      }
      
      artifact.trace.nearestMachineNeighbors = [{ neighborId: nearestNeighborId, distance: 1 - maxSim }];
      artifact.trace.nearestAuthorNeighbors = [{ neighborId: nearestNeighborId, distance: 1 - maxSim }];
    }
  }
}

export async function getArtifacts(query?: string) {
  if (cachedArtifacts.length === 0) {
    await initEmbeddings();
  }

  if (!query) {
    // Return base artifacts
    return cachedArtifacts.map(a => ({
      ...a,
      searchRelevance: 1 // default
    }));
  }

  let aiClient: GoogleGenAI | null = null;
  try {
    aiClient = getAi();
  } catch (e) {
    console.warn("Skipping query embedding: " + (e as Error).message);
    return cachedArtifacts.map(a => ({ ...a, searchRelevance: 0.1 }));
  }

  console.log(`Generating embedding for query: "${query}"...`);
  const response = await aiClient.models.embedContent({
    model: 'gemini-embedding-2-preview',
    contents: query,
  });

  const queryVec = response.embeddings?.[0]?.values;
  
  if (!queryVec) {
    return cachedArtifacts.map(a => ({ ...a, searchRelevance: 0.1 }));
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));

  return cachedArtifacts.map(artifact => {
    const vecA = cache[artifact.id];
    let sim = 0;
    if (vecA) {
      sim = calculateCosineSimilarity(queryVec, vecA);
    }
    
    // Convert similarity (-1 to 1) to a relevance score (0 to 1) for the UI
    // Normally cosine sim is between 0.3 and 0.9 for text.
    // We'll normalize roughly:
    const searchRelevance = Math.max(0, Math.min(1, (sim - 0.3) / 0.5));
    
    return {
      ...artifact,
      searchRelevance,
    };
  });
}
