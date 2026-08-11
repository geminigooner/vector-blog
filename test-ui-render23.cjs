const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=390,844'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.map(n => n.parentElement.style.transform);
  });
  console.log("Transforms:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
