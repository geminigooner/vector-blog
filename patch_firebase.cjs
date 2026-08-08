const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');
code = code.replace('export const app = initializeApp(firebaseConfig);', 'export const app = initializeApp(firebaseConfig, "LatentAffairsV3");');
fs.writeFileSync('src/lib/firebase.ts', code);
