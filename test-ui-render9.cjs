const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     const nodes = Array.from(document.querySelectorAll('.absolute.-translate-x-1\\/2.-translate-y-1\\/2'));
     return nodes.map(n => n.outerHTML.slice(0, 500));
  });
  console.log("Nodes:", content);
  
  await browser.close();
})();
