const fs = require('fs');

let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

const regex = /<textarea\s+name="bodyMarkdown"\s+value=\{artifact\.bodyMarkdown \|\| ''\}\s+onChange=\{handleChange\}/;
const replacement = `<textarea 
                  name="bodyMarkdown"
                  value={artifact.bodyMarkdown || ''}
                  onChange={handleChange}
                  onPaste={(e) => {
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

code = code.replace(regex, replacement);

fs.writeFileSync('src/studio/Editor.tsx', code);
console.log("Updated onPaste handler");
