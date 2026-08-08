const { buildAtlas } = require('./dist/server.cjs');
try {
  const posts = [ { id: '1', machineLocation: { x: 0, y: 0 }, authorLocation: { x: 0, y: 0 } } ];
  const vecs = {};
  const tagsById = { '1': [] };
  const categoryById = { '1': 'test' };
  const visualVecs = {};
  const result = buildAtlas(posts, vecs, tagsById, categoryById, visualVecs);
  console.log("Success!", result.artifacts.length);
} catch(e) {
  console.log("Error:", e.stack);
}
