const fs = require('fs');
let code = fs.readFileSync('src/lib/data.ts', 'utf8');
code = code.replace(/export function getFirstImage.*?return undefined;\n\}/s, `export function getFirstImage(artifact: Artifact): string | undefined {
  if (artifact.coverMedia && typeof artifact.coverMedia === 'string') return artifact.coverMedia;
  if (Array.isArray(artifact.inlineMedia)) {
    const img = artifact.inlineMedia.find(m => typeof m === 'string' && (m.startsWith('data:image/') || m.startsWith('http')));
    if (img) return img;
  }
  if (artifact.bodyMarkdown && typeof artifact.bodyMarkdown === 'string') {
    const match = artifact.bodyMarkdown.match(/!\\[.*?\\]\\((.*?)\\)/);
    if (match && match[1] && !match[1].startsWith('inline:')) {
      return match[1];
    }
  }
  return undefined;
}`);
fs.writeFileSync('src/lib/data.ts', code);
