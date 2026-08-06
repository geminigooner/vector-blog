const fs = require('fs');
let code = fs.readFileSync('src/lib/data.ts', 'utf8');
code = code.replace(/return results;\n\s*\} catch/, `if (results.length === 0) return mockArtifacts;\n    return results;\n  } catch`);
fs.writeFileSync('src/lib/data.ts', code);
