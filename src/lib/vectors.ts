import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function embedArtifact(artifact: any): Promise<boolean> {
  try {
    const res = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifact })
    });
    return res.ok;
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
