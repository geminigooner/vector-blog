const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     // Check if the simulation nodes are actually rendering anything inside
     const nodes = Array.from(document.querySelectorAll('.absolute.-translate-x-1\\/2.-translate-y-1\\/2'));
     return nodes.map(n => {
        const r = n.getBoundingClientRect();
        return {
           rect: { x: r.x, y: r.y, w: r.width, h: r.height },
           computedTransform: window.getComputedStyle(n).transform,
           display: window.getComputedStyle(n).display
        };
     });
  });
  console.log("Nodes:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
