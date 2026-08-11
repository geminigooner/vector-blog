import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const fbConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(fbConfig);
const db = getFirestore(app);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'artifacts'));
    console.log("Total count:", snap.size);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
