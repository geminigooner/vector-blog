const fs = require('fs');
let code = fs.readFileSync('src/lib/vectors.ts', 'utf8');
code = code.replace(/export async function loadVectors\(\): Promise<Record<string, number\[\]>> \{/, "export async function loadVectors(): Promise<Record<string, number[]>> { console.log('loadVectors called');");
code = code.replace(/export async function loadVisualVectors\(\): Promise<Record<string, number\[\]>> \{/, "export async function loadVisualVectors(): Promise<Record<string, number[]>> { console.log('loadVisualVectors called');");
fs.writeFileSync('src/lib/vectors.ts', code);
