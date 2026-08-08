const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');
code = code.replace('export const app = initializeApp(firebaseConfig);', 'export const app = initializeApp(firebaseConfig, "LatentAffairsV2");');
fs.writeFileSync('src/lib/firebase.ts', code);
