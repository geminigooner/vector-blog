const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function test() {
  const artifacts = await db.collection('artifacts').where('status', '==', 'published').get();
  console.log("Published artifacts count: ", artifacts.docs.length);
}

test().catch(console.error);
