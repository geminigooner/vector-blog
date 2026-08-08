const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

// Add import for remarkGfm
if (!code.includes("import remarkGfm")) {
  code = code.replace("import Markdown from 'react-markdown';", "import Markdown from 'react-markdown';\nimport remarkGfm from 'remark-gfm';");
}

const oldImgStr = `img: ({node, src, alt, ...props}) => {
                          let actualSrc = src;
                          if (src?.startsWith('inline:')) {
                            const idx = parseInt(src.split(':')[1]);
                            actualSrc = artifact.inlineMedia?.[idx] || src;
                          }
                          if (actualSrc && actualSrc.startsWith('data:video/')) {
                            return <video src={actualSrc} controls preload="metadata" style={{ maxWidth: '100%', height: 'auto' }} />
                          }
                          return <img src={actualSrc} alt={alt} style={{ maxWidth: '100%', height: 'auto' }} {...props} />
                        }`;

const newImgStr = `img: ({node, src, alt, ...props}) => {
                          let actualSrc = src;
                          if (src?.startsWith('inline:')) {
                            const idx = parseInt(src.split(':')[1]);
                            actualSrc = artifact.inlineMedia?.[idx] || src;
                          }
                          
                          const mediaElement = (actualSrc && actualSrc.startsWith('data:video/'))
                            ? <video src={actualSrc} controls preload="metadata" className="w-full h-auto rounded-sm" />
                            : <img src={actualSrc} alt={alt} className="w-full h-auto rounded-sm" {...props} />;
                            
                          return (
                            <figure className="my-12">
                              {mediaElement}
                              {(alt && alt !== 'image' && alt !== 'video') && (
                                <figcaption className="mt-4 text-center text-silver/60 text-xs font-mono uppercase tracking-widest">{alt}</figcaption>
                              )}
                            </figure>
                          );
                        },
                        table: ({node, ...props}) => (
                          <div className="w-full overflow-x-auto custom-scrollbar my-12">
                            <table {...props} />
                          </div>
                        )`;

if (code.includes(oldImgStr)) {
  code = code.replace(oldImgStr, newImgStr);
}

if (!code.includes("remarkPlugins={[remarkGfm]}")) {
  code = code.replace("<Markdown ", "<Markdown \n                      remarkPlugins={[remarkGfm]}");
}

fs.writeFileSync('src/studio/Editor.tsx', code);
