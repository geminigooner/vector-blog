const d3 = require('d3');
const artifacts = [
  { id: '1', searchRelevance: 1, machineLocation: {x: 0, y: 0}, authorLocation: {x: 0, y: 0} }
];
let nodes = artifacts.map(art => ({
  id: art.id,
  targetX: 0,
  targetY: 0,
  x: 0,
  y: 0,
  radius: 120,
  relevance: art.searchRelevance || 1,
  artifact: art
}));

const sim = d3.forceSimulation(nodes)
  .force("x", d3.forceX(d => d.targetX).strength(0.1))
  .force("y", d3.forceY(d => d.targetY).strength(0.1))
  .force("collide", d3.forceCollide(d => d.radius + 10).iterations(2))
  .stop();

sim.tick(100);
console.log(nodes[0].x, nodes[0].y);
