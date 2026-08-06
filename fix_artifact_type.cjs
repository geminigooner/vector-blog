const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(/export interface Artifact \{[\s\S]*?bodyMarkdown: string;/m, (match) => {
  return match + "\n  inlineMedia?: string[];\n  coverMedia?: string;";
});
fs.writeFileSync('src/types.ts', code);
console.log("Updated Artifact interface");
