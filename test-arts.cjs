const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({ projectId: "ai-studio-latentaffairs-e0a53ccd-a805-44a7-a9c4-952e0d7539f9" });
const db = getFirestore(app);
async function run() {
  const snap = await db.collection('artifacts').get();
  snap.docs.forEach(d => {
    console.log(d.id, d.data().title);
  });
}
run();
