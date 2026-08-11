const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));

  const nodes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div'))
      .filter(n => n.className && n.className.includes('bg-graphite/90'))
      .map(n => {
         return {
           className: n.className,
           text: n.textContent,
           style: n.getAttribute('style')
         }
      });
  });
  console.log("Nodes detail:", nodes);
  
  await browser.close();
})();
