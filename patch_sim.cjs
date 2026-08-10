const fs = require('fs');
const file = 'src/hooks/useForceSimulation.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/if \(searchQuery && d.relevance > 0.6\) return 140;/g, 'if (searchQuery && d.relevance > 0.6) return 160;');
code = code.replace(/if \(searchQuery && d.relevance <= 0.6\) return 40;/g, 'if (searchQuery && d.relevance <= 0.6) return 60;');
code = code.replace(/return 90; \/\/ Default spacing/g, 'return 160; // Default spacing');

fs.writeFileSync(file, code);
