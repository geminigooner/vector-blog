const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     // Get the title text explicitly
     const h3s = Array.from(document.querySelectorAll('h3'));
     return h3s.map(h => h.innerText);
  });
  console.log("h3s:", content);
  
  await browser.close();
})();
