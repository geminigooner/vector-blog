const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=390,844'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     // Check if the simulation nodes are actually rendering anything inside
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.map(n => {
        const r = n.getBoundingClientRect();
        return {
           rect: { x: r.x, y: r.y, w: r.width, h: r.height },
           computedTransform: window.getComputedStyle(n).transform,
           display: window.getComputedStyle(n).display
        };
     });
  });
  console.log("Nodes Mobile:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
