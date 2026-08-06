const fs = require('fs');
let code = fs.readFileSync('src/PublicApp.tsx', 'utf8');
code = code.replace(/export function PublicApp\(\) \{/, "export function PublicApp() { console.log('PublicApp rendering!');");
fs.writeFileSync('src/PublicApp.tsx', code);
