const fs = require('fs');

function patchEditor() {
  let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

  const videoRegex = /coverMedia: frameBase64,\s*bodyMarkdown: \(prev\.bodyMarkdown \|\| ''\) \+ \`\\n\\n!\[video\]\(\$\{base64String\}\)\`/g;
  const videoReplacement = `coverMedia: frameBase64,
                                  inlineMedia: [...(prev.inlineMedia || []), base64String],
                                  bodyMarkdown: (prev.bodyMarkdown || '') + \`\\n\\n![video](inline:\${(prev.inlineMedia || []).length})\``;
  code = code.replace(videoRegex, videoReplacement);

  const imageRegex = /bodyMarkdown: \(prev\.bodyMarkdown \|\| ''\) \+ \`\\n\\n!\[image\]\(\$\{base64String\}\)\`/g;
  const imageReplacement = `inlineMedia: [...(prev.inlineMedia || []), base64String],
                                bodyMarkdown: (prev.bodyMarkdown || '') + \`\\n\\n![image](inline:\${(prev.inlineMedia || []).length})\``;
  code = code.replace(imageRegex, imageReplacement);

  const mdRegex = /img: \(\\{node, src, alt, \.\.\.props\\}\) => \\{([\\s\\S]*?)\\}/g;
  const mdReplacement = `img: ({node, src, alt, ...props}) => {
                          let actualSrc = src;
                          if (src?.startsWith('inline:')) {
                            const idx = parseInt(src.split(':')[1]);
                            actualSrc = artifact.inlineMedia?.[idx] || src;
                          }
                          if (actualSrc && actualSrc.startsWith('data:video/')) {
                            return <video src={actualSrc} controls style={{ maxWidth: '100%' }} />
                          }
                          return <img src={actualSrc} alt={alt} {...props} />
                        }`;
  code = code.replace(mdRegex, mdReplacement);

  fs.writeFileSync('src/studio/Editor.tsx', code);
  console.log("Patched Editor");
}

function patchDrawer() {
  let code = fs.readFileSync('src/components/ArtifactDrawer.tsx', 'utf8');

  const mdRegex = /img: \(\\{node, src, alt, \.\.\.props\\}\) => \\{([\\s\\S]*?)\\}/g;
  const mdReplacement = `img: ({node, src, alt, ...props}) => {
                          let actualSrc = src;
                          if (src?.startsWith('inline:')) {
                            const idx = parseInt(src.split(':')[1]);
                            actualSrc = artifact.inlineMedia?.[idx] || src;
                          }
                          if (actualSrc && actualSrc.startsWith('data:video/')) {
                            return <video src={actualSrc} controls style={{ maxWidth: '100%' }} />
                          }
                          return <img src={actualSrc} alt={alt} {...props} />
                        }`;
  code = code.replace(mdRegex, mdReplacement);
  
  fs.writeFileSync('src/components/ArtifactDrawer.tsx', code);
  console.log("Patched Drawer");
}

patchEditor();
patchDrawer();
