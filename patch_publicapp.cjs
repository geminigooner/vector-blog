const fs = require('fs');
let code = fs.readFileSync('src/PublicApp.tsx', 'utf8');
code = code.replace(/setArtifacts\(laid as any\);/g, "console.log('Artifacts loaded:', laid.length); setArtifacts(laid as any);");
fs.writeFileSync('src/PublicApp.tsx', code);
