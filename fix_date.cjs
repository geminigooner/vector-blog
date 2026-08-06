const fs = require('fs');
let code = fs.readFileSync('src/lib/data.ts', 'utf8');
code = code.replace(/date: new Date\(fa\.publishedAt \|\| fa\.createdAt\)\.toLocaleDateString\(\),/, 
  "date: new Date(fa.publishedAt || fa.createdAt || Date.now()).toLocaleDateString(),");
fs.writeFileSync('src/lib/data.ts', code);
console.log("Fixed date parsing");
