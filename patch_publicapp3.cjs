const fs = require('fs');
let code = fs.readFileSync('src/PublicApp.tsx', 'utf8');
code = code.replace(/getPublishedArtifacts\(\),/, "getPublishedArtifacts().then(r => { console.log('getPublishedArtifacts resolved:', r.length); return r; }),");
fs.writeFileSync('src/PublicApp.tsx', code);
