const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

const targetStr = `<div className="flex justify-between items-center mb-2 mt-4">
                  <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60">Body (Markdown)</label>
                  {(artifact.type === 'Image artifact' || artifact.type === 'Meme') && (
                    <label className="cursor-pointer flex items-center gap-2 bg-silver/10 hover:bg-silver/20 text-ivory px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-colors">`;

const newStr = `<div className="flex justify-between items-center mb-2 mt-4">
                  <label className="block text-[9px] uppercase tracking-widest font-mono text-silver/60">Body (Markdown)</label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2 bg-silver/10 hover:bg-silver/20 text-ivory px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-colors">
                      {pdfUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                      {pdfUploading ? "Parsing..." : "Upload PDF"}
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        disabled={pdfUploading}
                        onChange={handlePdfUpload}
                      />
                    </label>
                    {(artifact.type === 'Image artifact' || artifact.type === 'Meme') && (
                      <label className="cursor-pointer flex items-center gap-2 bg-silver/10 hover:bg-silver/20 text-ivory px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-colors">`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
}

// Add the closing tag for the new flex container!
const targetStrClose = `                        }
                      />
                    </label>
                  )}
                  <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">`;

const newStrClose = `                        }
                      />
                    </label>
                  )}
                  </div>
                  <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">`;

if (code.includes(targetStrClose)) {
  code = code.replace(targetStrClose, newStrClose);
}

fs.writeFileSync('src/studio/Editor.tsx', code);
