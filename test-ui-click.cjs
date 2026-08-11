const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const nodes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('div'))
      .filter(n => n.className && n.className.includes('bg-graphite/90'));
  });
  
  console.log("Nodes count:", nodes.length);
  
  if (nodes.length > 0) {
    // Click the first one via DOM
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('div')).filter(n => n.className && n.className.includes('bg-graphite/90'))[0];
      if (el) {
        el.click();
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const isDrawerOpen = await page.evaluate(() => {
       return document.body.innerHTML.includes('Close');
    });
    console.log("Drawer open?", isDrawerOpen);
  }
  
  await browser.close();
})();
