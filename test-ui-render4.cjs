const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.map(n => {
       const r = n.getBoundingClientRect();
       return {
          text: n.innerText,
          x: r.x, y: r.y, w: r.width, h: r.height,
          computedOpacity: window.getComputedStyle(n).opacity,
          computedZIndex: window.getComputedStyle(n).zIndex,
          transform: n.style.transform
       };
     });
  });
  console.log("Card Info:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
