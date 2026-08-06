const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function test() {
  const artifacts = await db.collection('artifacts').where('status', '==', 'published').get();
  for (const doc of artifacts.docs) {
    const data = doc.data();
    if (data.inlineMedia && data.inlineMedia.length > 0) {
       console.log(doc.id);
       console.log(data.inlineMedia.map(m => m.substring(0, 50)));
       console.log(data.bodyMarkdown.substring(0, 200));
    }
  }
}

test().catch(console.error);
