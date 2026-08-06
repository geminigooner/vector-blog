const fs = require('fs');
let code = fs.readFileSync('src/lib/data.ts', 'utf8');
code = code.replace(/return \[\.\.\.mockArtifacts, \.\.\.results\];/, `
    const all = [...mockArtifacts, ...results];
    const unique = [];
    const seen = new Set();
    for (const a of all) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        unique.push(a);
      }
    }
    return unique;
`);
fs.writeFileSync('src/lib/data.ts', code);
