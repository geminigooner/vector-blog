const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));

  const content = await page.evaluate(() => {
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     if(nodes.length === 0) return "No nodes found";
     
     const n = nodes[0];
     
     let el = n;
     let opacity = 1;
     while(el && el !== document.body) {
        const style = window.getComputedStyle(el);
        opacity *= parseFloat(style.opacity || 1);
        el = el.parentNode;
     }
     
     return {
        html: n.innerHTML,
        className: n.className,
        computedOpacity: opacity,
        styleOpacity: n.style.opacity,
        rect: n.getBoundingClientRect()
     };
  });
  console.log("First Node info:", JSON.stringify(content, null, 2));
  
  await browser.close();
})();
