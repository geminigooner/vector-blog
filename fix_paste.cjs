const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

const regex = /<textarea\s+name="bodyMarkdown"\s+value=\{artifact\.bodyMarkdown \|\| ''\}\s+onChange=\{handleChange\}/;

const replacement = `<textarea 
                  name="bodyMarkdown"
                  value={artifact.bodyMarkdown || ''}
                  onChange={handleChange}
                  onPaste={(e) => {
                    const html = e.clipboardData.getData('text/html');
                    const text = e.clipboardData.getData('text/plain');
                    if (text && text.includes('data:image')) {
                      // Handled by the save cleanup, but it might lag until save.
                    }
                  }}`;
// Actually, it's easier to just tell the user the scrolling issue is fixed by the cleanup on load/save.
// When they copy-paste an image, it usually pastes as a File object which we can intercept.
