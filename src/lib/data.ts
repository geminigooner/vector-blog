import { collection, doc, getDocs, getDoc, setDoc, query, where, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, OWNER_EMAIL } from './firebase';
import { Artifact, FirebaseArtifact, ArtifactStatus } from '../types';
import { mockArtifacts } from '../data/artifacts';

// Convert FirebaseArtifact to the shape expected by the visual components (Artifact)
export function mapFirebaseToArtifact(fa: FirebaseArtifact): Artifact {
  return {
    id: fa.id,
    title: fa.title,
    subtitle: fa.subtitle,
    date: new Date(fa.publishedAt || fa.createdAt || Date.now()).toLocaleDateString(),
    type: fa.type,
    excerpt: fa.excerpt,
    bodyMarkdown: fa.bodyMarkdown || fa.markdownBody,
    inlineMedia: fa.inlineMedia,
    coverMedia: fa.coverMedia,
    authorIntent: fa.authorIntent || 'Unsorted',
    machineCluster: fa.machineCluster || 'Unsorted',
    authorLocation: fa.authorCoordinate || { x: 0, y: 0 },
    machineLocation: fa.machineCoordinate || { x: 0, y: 0 },
    trace: fa.traceMetadata,
    status: fa.status,
  };
}

export function getFirstImage(artifact: Artifact): string | undefined {
  if (artifact.coverMedia && typeof artifact.coverMedia === 'string') return artifact.coverMedia;
  if (Array.isArray(artifact.inlineMedia)) {
    const img = artifact.inlineMedia.find(m => typeof m === 'string' && (m.startsWith('data:image/') || m.startsWith('http')));
    if (img) return img;
  }
  if (artifact.bodyMarkdown && typeof artifact.bodyMarkdown === 'string') {
    const match = artifact.bodyMarkdown.match(/!\[.*?\]\((.*?)\)/);
    if (match && match[1] && !match[1].startsWith('inline:')) {
      return match[1];
    }
  }
  return undefined;
}

export async function getPublishedArtifacts(): Promise<Artifact[]> {
  try {
    const q = query(
      collection(db, 'artifacts'),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    const results: Artifact[] = [];
    snap.forEach((doc) => {
      results.push(mapFirebaseToArtifact(doc.data() as FirebaseArtifact));
    });
     
    
    return results;

  } catch (err) {
    console.error("Failed to load artifacts", err);
    return [];
  }
}

export async function getPublishedFirebaseArtifacts(): Promise<FirebaseArtifact[]> {
  try {
    const q = query(
      collection(db, 'artifacts'),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    const results: FirebaseArtifact[] = [];
    snap.forEach((doc) => {
      results.push(doc.data() as FirebaseArtifact);
    });
    return results;
  } catch (err) {
    console.error("Failed to load artifacts", err);
    return [];
  }
}

export async function getStudioArtifacts(): Promise<FirebaseArtifact[]> {
  try {
    const q = query(collection(db, 'artifacts')); // sorted by client since missing index possibly
    const snap = await getDocs(q);
    const results: FirebaseArtifact[] = [];
    snap.forEach((doc) => {
      results.push(doc.data() as FirebaseArtifact);
    });
    // Sort descending by updated at
    results.sort((a, b) => b.updatedAt - a.updatedAt);
    return results;
  } catch (err) {
    console.error("Failed to load studio artifacts", err);
    return [];
  }
}

export async function saveArtifact(data: FirebaseArtifact) {
  await setDoc(doc(db, 'artifacts', data.id), data);
}

export async function deleteArtifact(id: string) {
  try {
    await deleteDoc(doc(db, 'artifacts', id));
    await deleteDoc(doc(db, 'embeddings', id));
    await deleteDoc(doc(db, 'visualEmbeddings', id));
  } catch (err) {
    console.error("Failed to delete artifact fully:", err);
    throw err;
  }
}

// Generate simple hash-based coords for temporary atlas layout
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function generateCoordinate(input: string): { x: number, y: number } {
  const h = Math.abs(hashString(input));
  const x = ((h % 100) - 50) * 1.5;
  const y = (((h / 100) % 100) - 50) * 1.5;
  return { x, y };
}

export async function importDemoArchive(uid: string) {
  for (const mock of mockArtifacts) {
    const existing = await getDoc(doc(db, 'artifacts', mock.id));
    if (!existing.exists()) {
      const fbArtifact: FirebaseArtifact = {
        id: mock.id,
        slug: mock.id,
        title: mock.title,
        subtitle: mock.subtitle || '',
        excerpt: mock.excerpt,
        bodyMarkdown: mock.bodyMarkdown,
        type: mock.type,
        status: 'published',
        featured: false,
        inlineMedia: [],
        authorIntent: mock.authorIntent,
        topics: [],
        keywords: [],
        authorCategory: mock.authorIntent,
        machineCluster: mock.machineCluster,
        machineCoordinate: mock.machineLocation,
        authorCoordinate: mock.authorLocation,
        coordinatesProvisional: true,
        relatedArtifactIds: [],
        traceMetadata: mock.trace,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        publishedAt: Date.now(),
        revisionCount: 1,
        ownerUid: uid
      };
      await setDoc(doc(db, 'artifacts', mock.id), fbArtifact);
    }
  }
}
