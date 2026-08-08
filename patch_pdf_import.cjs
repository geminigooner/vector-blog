const fs = require('fs');
let code = fs.readFileSync('server/semantic-api.ts', 'utf8');

code = code.replace("import express from 'express';\n\nsemanticRouter", "semanticRouter");

if (!code.startsWith("import express from 'express';")) {
  code = "import express from 'express';\n" + code;
}

fs.writeFileSync('server/semantic-api.ts', code);
