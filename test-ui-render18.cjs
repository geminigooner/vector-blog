const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     // Check if the simulation nodes are actually rendering anything inside
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.map(n => n.innerText);
  });
  console.log("Nodes text:", content);
  
  await browser.close();
})();
