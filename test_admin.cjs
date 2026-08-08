const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({
  projectId: "gen-lang-client-0376397936"
});
try {
  const db = getFirestore(app, "ai-studio-latentaffairs-e0a53ccd-a805-44a7-a9c4-952e0d7539f9");
  console.log("Success with getFirestore args");
} catch(e) {
  console.log("Error:", e.message);
}
