const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const app = initializeApp({
  projectId: "gen-lang-client-0376397936",
  appId: "1:477131639733:web:70e07f3e4cb647e364a7fc",
  apiKey: "AIzaSyC4R3mGscx0P77zlLmNf_2wkkxH7UvwdAs",
  authDomain: "gen-lang-client-0376397936.firebaseapp.com",
});
const db = getFirestore(app, "ai-studio-latentaffairs-e0a53ccd-a805-44a7-a9c4-952e0d7539f9");

function mapFirebaseToArtifact(fa) {
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

async function run() {
  try {
    const q = query(
      collection(db, 'artifacts'),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((doc) => {
      results.push(mapFirebaseToArtifact(doc.data()));
    });
    console.log(results.length);
  } catch(e) { console.error(e); }
  process.exit(0);
}
run();
