const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  await page.screenshot({ path: 'screenshot2.png' });
  console.log("Screenshot saved to screenshot2.png");
  
  const content = await page.evaluate(() => {
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.map(n => n.innerText);
  });
  console.log("Nodes text:", content);
  
  await browser.close();
})();
