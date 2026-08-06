const fs = require('fs');
let code = fs.readFileSync('src/lib/data.ts', 'utf8');
code = code.replace(/export async function getPublishedArtifacts\(\): Promise<Artifact\[\]> \{/, "export async function getPublishedArtifacts(): Promise<Artifact[]> { console.log('getPublishedArtifacts called');");
code = code.replace(/if \(results.length === 0\) return mockArtifacts;/, "if (results.length === 0) { console.log('returning mock data'); return mockArtifacts; } console.log('returning results:', results.length);");
fs.writeFileSync('src/lib/data.ts', code);
