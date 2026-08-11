const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     const p = document.querySelector('.bg-graphite\\/90');
     if(!p) return null;
     
     // climb to see opacity
     let node = p;
     const chain = [];
     while(node && node !== document.body) {
        const style = window.getComputedStyle(node);
        chain.push({
          tag: node.tagName,
          className: node.className,
          opacity: style.opacity,
          display: style.display,
          visibility: style.visibility,
          transform: style.transform,
          rect: node.getBoundingClientRect()
        });
        node = node.parentNode;
     }
     return chain;
  });
  console.log("Render tree:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
