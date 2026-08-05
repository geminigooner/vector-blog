const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

code = code.replace(/const replacement = \`!\\\[\\\$\\{alt\\}\\\]\\(\\\$\\{isVideo \? 'video' : 'image'\\} inline:\\\$\\{idx\\}\\)\`;/g, 
  "const replacement = `![${alt}](inline:${idx})`;");

fs.writeFileSync('src/studio/Editor.tsx', code);
console.log("Fixed image markdown regex");
