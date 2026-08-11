const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));

  const bounds = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div'))
      .filter(n => n.className && n.className.includes('bg-graphite/90'))
      .map(n => {
         const rect = n.getBoundingClientRect();
         return {
           text: n.textContent,
           rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
         }
      });
  });
  console.log("Nodes bounds:", bounds);
  
  await browser.close();
})();
