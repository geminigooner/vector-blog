const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

if (!code.includes("import TurndownService from 'turndown'")) {
  code = code.replace("import remarkGfm from 'remark-gfm';", "import remarkGfm from 'remark-gfm';\nimport TurndownService from 'turndown';");
}

const oldPaste = `                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        e.preventDefault();
                        const file = items[i].getAsFile();
                        if (!file) continue;
                        
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = async (event) => {
                          const img = new Image();
                          img.src = event.target?.result as string;
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let { width, height } = img;
                            const MAX_SIZE = 800;
                            if (width > height && width > MAX_SIZE) {
                              height *= MAX_SIZE / width;
                              width = MAX_SIZE;
                            } else if (height > MAX_SIZE) {
                              width *= MAX_SIZE / height;
                              height = MAX_SIZE;
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);
                            const base64String = canvas.toDataURL('image/jpeg', 0.8);
                            
                            setArtifact(prev => ({
                              ...prev,
                              inlineMedia: [...(prev.inlineMedia || []), base64String],
                              bodyMarkdown: (prev.bodyMarkdown || '') + \`\\n\\n![image](inline:\${(prev.inlineMedia || []).length})\`
                            }));
                          };
                        };
                      }
                    }
                  }}`;

const newPaste = `                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    let hasImage = false;
                    let htmlItem = null;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        hasImage = true;
                        e.preventDefault();
                        const file = items[i].getAsFile();
                        if (!file) continue;
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = async (event) => {
                          const img = new Image();
                          img.src = event.target?.result as string;
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let { width, height } = img;
                            const MAX_SIZE = 800;
                            if (width > height && width > MAX_SIZE) {
                              height *= MAX_SIZE / width;
                              width = MAX_SIZE;
                            } else if (height > MAX_SIZE) {
                              width *= MAX_SIZE / height;
                              height = MAX_SIZE;
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);
                            const base64String = canvas.toDataURL('image/jpeg', 0.8);
                            setArtifact(prev => ({
                              ...prev,
                              inlineMedia: [...(prev.inlineMedia || []), base64String],
                              bodyMarkdown: (prev.bodyMarkdown || '') + \`\\n\\n![image](inline:\${(prev.inlineMedia || []).length})\`
                            }));
                          };
                        };
                      } else if (items[i].type === 'text/html') {
                        htmlItem = items[i];
                      }
                    }
                    if (!hasImage && htmlItem) {
                      e.preventDefault();
                      htmlItem.getAsString((html) => {
                        const turndownService = new TurndownService({
                          headingStyle: 'atx',
                          bulletListMarker: '-',
                          hr: '---'
                        });
                        const markdown = turndownService.turndown(html);
                        const textarea = e.target;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newValue = (artifact.bodyMarkdown || '').substring(0, start) + markdown + (artifact.bodyMarkdown || '').substring(end);
                        setArtifact(prev => ({ ...prev, bodyMarkdown: newValue }));
                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = start + markdown.length;
                        }, 0);
                      });
                    }
                  }}`;

if (code.includes("onPaste={(e) => {")) {
  code = code.replace(oldPaste, newPaste);
}

fs.writeFileSync('src/studio/Editor.tsx', code);
