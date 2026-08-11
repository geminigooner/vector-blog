const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.map(n => n.innerText);
  });
  console.log("Nodes text:", content);
  
  const root = await page.evaluate(() => document.body.innerHTML);
  
  // Is the main container missing height?
  const main = await page.evaluate(() => {
     const m = document.querySelector('main');
     if(!m) return "No main";
     const r = m.getBoundingClientRect();
     return { w: r.width, h: r.height };
  });
  console.log("Main bounds:", main);
  
  await browser.close();
})();
