const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({
  projectId: "gen-lang-client-0376397936"
});
const db = getFirestore(app, "ai-studio-latentaffairs-e0a53ccd-a805-44a7-a9c4-952e0d7539f9");
async function run() {
  try {
    const snap = await db.collection('artifacts').limit(1).get();
    console.log("Docs:", snap.size);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
