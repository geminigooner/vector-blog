const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     // Get imgs
     const imgs = Array.from(document.querySelectorAll('img'));
     return imgs.map(i => i.src);
  });
  console.log("imgs:", content);
  
  await browser.close();
})();
