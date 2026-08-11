const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     const p = document.querySelector('.absolute.top-1\\/2.left-1\\/2');
     if(!p) return null;
     const rect = p.getBoundingClientRect();
     return {
        className: p.className,
        transform: p.style.transform,
        display: window.getComputedStyle(p).display,
        visibility: window.getComputedStyle(p).visibility,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
     };
  });
  console.log("Parent Info:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
