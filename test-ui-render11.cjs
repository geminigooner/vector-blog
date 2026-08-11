const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     // Check if the simulation nodes are actually rendering anything inside
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.map(n => ({
        id: n.id || "no-id",
        className: n.className,
        style: n.getAttribute('style'),
        html: n.innerHTML.slice(0, 300)
     }));
  });
  console.log("Nodes:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
