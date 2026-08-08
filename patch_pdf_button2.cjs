const fs = require('fs');
let code = fs.readFileSync('src/studio/Editor.tsx', 'utf8');

const targetStrClose = `                        }} 
                      />
                    </label>
                  )}
                  <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">`;

const newStrClose = `                        }} 
                      />
                    </label>
                  )}
                  </div>
                  <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">`;

if (code.includes(targetStrClose)) {
  code = code.replace(targetStrClose, newStrClose);
}

fs.writeFileSync('src/studio/Editor.tsx', code);
