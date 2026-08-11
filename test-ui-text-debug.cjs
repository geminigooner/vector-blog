const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     const n = document.querySelector('.bg-graphite\\/90');
     if (!n) return null;
     const rect = n.getBoundingClientRect();
     return {
        className: n.className,
        rect,
        style: n.getAttribute('style'),
        computedOpacity: window.getComputedStyle(n).opacity,
        visibility: window.getComputedStyle(n).visibility,
        display: window.getComputedStyle(n).display,
        zIndex: window.getComputedStyle(n).zIndex,
        text: n.innerText
     };
  });
  console.log("Single Node Debug:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
