const fs = require('fs');
let code = fs.readFileSync('src/lib/data.ts', 'utf8');

// Replace the unique tracking and mock fallback with just returning the results
code = code.replace(/const all = \[\.\.\.mockArtifacts, \.\.\.results\];[\s\S]*?return unique;/, 'return results;');
code = code.replace(/\/\/ Fallback to mock data if firebase not setup or empty\n\s*return mockArtifacts;/, 'return [];');

fs.writeFileSync('src/lib/data.ts', code);
