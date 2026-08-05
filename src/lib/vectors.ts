import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function embedArtifact(artifact: any): Promise<boolean> {
  try {
    const res = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifact })
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.values && data.values.length > 0) {
      await setDoc(doc(db, 'embeddings', artifact.id), { values: data.values });
      return true;
    }
    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function embedQuery(query: string): Promise<number[] | null> {
  try {
    const res = await fetch('/api/embed-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.values;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function loadVectors(): Promise<Record<string, number[]>> {
  const vecs: Record<string, number[]> = {};
  try {
    const snap = await getDocs(collection(db, 'embeddings'));
    snap.forEach(doc => {
      vecs[doc.id] = doc.data().values;
    });
  } catch (err) {
    console.error("Failed to load vectors", err);
  }
  return vecs;
}

export async function loadVisualVectors(): Promise<Record<string, number[]>> {
  const vecs: Record<string, number[]> = {};
  try {
    const snap = await getDocs(collection(db, 'visualEmbeddings'));
    snap.forEach(doc => {
      vecs[doc.id] = doc.data().vector;
    });
  } catch (err) {
    console.error("Failed to load visual vectors", err);
  }
  return vecs;
}

export function firstImageDataUrl(markdown: string): string | null {
  if (!markdown) return null;
  const match = markdown.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
  if (match) {
    return match[1];
  }
  return null;
}

export async function embedVisual(artifactId: string, imageDataUrl: string): Promise<boolean> {
  try {
    const res = await fetch('/api/embed-visual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifactId, imageDataUrl })
    });
    return res.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}
