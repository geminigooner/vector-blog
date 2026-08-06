const fs = require('fs');

// Fix PublicApp.tsx
let pCode = fs.readFileSync('src/PublicApp.tsx', 'utf8');
pCode = pCode.replace("export function PublicApp() { console.log('PublicApp rendering!');", "export function PublicApp() {");
pCode = pCode.replace("console.log('Artifacts loaded:', laid.length); setArtifacts(laid as any);", "setArtifacts(laid as any);");
pCode = pCode.replace("getPublishedArtifacts().then(r => { console.log('getPublishedArtifacts resolved:', r.length); return r; })", "getPublishedArtifacts()");
fs.writeFileSync('src/PublicApp.tsx', pCode);

// Fix data.ts
let dCode = fs.readFileSync('src/lib/data.ts', 'utf8');
dCode = dCode.replace("export async function getPublishedArtifacts(): Promise<Artifact[]> { console.log('getPublishedArtifacts called');", "export async function getPublishedArtifacts(): Promise<Artifact[]> {");
dCode = dCode.replace("console.log('returning results:', results.length);", "");
fs.writeFileSync('src/lib/data.ts', dCode);

// Fix vectors.ts
let vCode = fs.readFileSync('src/lib/vectors.ts', 'utf8');
vCode = vCode.replace("export async function loadVectors(): Promise<Record<string, number[]>> { console.log('loadVectors called');", "export async function loadVectors(): Promise<Record<string, number[]>> {");
vCode = vCode.replace("export async function loadVisualVectors(): Promise<Record<string, number[]>> { console.log('loadVisualVectors called');", "export async function loadVisualVectors(): Promise<Record<string, number[]>> {");
fs.writeFileSync('src/lib/vectors.ts', vCode);
