const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

const regex = /const img = firstImageDataUrl\(finalArt\.bodyMarkdown\) \|\| finalArt\.coverMedia;/;
const replacement = `const img = firstImageDataUrl(finalArt.bodyMarkdown) || finalArt.coverMedia || (finalArt.inlineMedia && finalArt.inlineMedia[0]);`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/studio/Editor.tsx', code);
  console.log("Patched Editor embed logic");
} else {
  console.log("Embed logic not found");
}
