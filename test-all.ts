import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';
const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);
const auth = getAuth(app);
async function run() {
  await signInWithEmailAndPassword(auth, 'ahatley094@gmail.com', 'password123');
  const snap = await getDocs(query(collection(db, 'artifacts')));
  console.log("Total docs:", snap.docs.length);
  snap.forEach(d => console.log(d.id, d.data().status));
  process.exit(0);
}
run();
