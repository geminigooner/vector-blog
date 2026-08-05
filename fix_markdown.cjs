const fs = require('fs');

function patchMarkdown(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  const regex = /img: \(\{node, src, alt, \.\.\.props\}\) => \{[\s\S]*?return <img src=\{src\} alt=\{alt\} \{\.\.\.props\} \/>\s*\}/;
  
  const replacement = `img: ({node, src, alt, ...props}) => {
                          let actualSrc = src;
                          if (src?.startsWith('inline:')) {
                            const idx = parseInt(src.split(':')[1]);
                            actualSrc = artifact.inlineMedia?.[idx] || src;
                          }
                          if (actualSrc && actualSrc.startsWith('data:video/')) {
                            return <video src={actualSrc} controls preload="metadata" style={{ maxWidth: '100%' }} />
                          }
                          return <img src={actualSrc} alt={alt} {...props} />
                        }`;
                        
  if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(file, code);
    console.log("Patched " + file);
  } else {
    console.log("Not found in " + file);
  }
}

patchMarkdown('src/studio/Editor.tsx');
patchMarkdown('src/components/ArtifactDrawer.tsx');

