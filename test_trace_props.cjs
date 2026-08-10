const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query } = require('firebase/firestore');
const app = initializeApp({
  projectId: "gen-lang-client-0376397936",
  appId: "1:477131639733:web:70e07f3e4cb647e364a7fc",
  apiKey: "AIzaSyC4R3mGscx0P77zlLmNf_2wkkxH7UvwdAs",
  authDomain: "gen-lang-client-0376397936.firebaseapp.com",
});
const db = getFirestore(app, "ai-studio-latentaffairs-e0a53ccd-a805-44a7-a9c4-952e0d7539f9");
async function run() {
  const snap = await getDocs(query(collection(db, 'artifacts')));
  snap.forEach((doc) => { 
    console.log(doc.id, doc.data().traceMetadata); 
  });
  process.exit(0);
}
run();
