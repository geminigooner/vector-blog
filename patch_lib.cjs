const fs = require('fs');
let code = fs.readFileSync('src/lib/vectors.ts', 'utf8');

code = code.replace(/export function firstImageDataUrl\(markdown: string\): string \| null \{/g, 
  "export function firstImageDataUrl(markdown: string): string | null {\n  if (!markdown) return null;");

fs.writeFileSync('src/lib/vectors.ts', code);
console.log("Patched vectors");
