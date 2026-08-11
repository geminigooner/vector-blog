const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=1280,800'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     // Check if the simulation nodes are actually rendering anything inside
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.length;
  });
  console.log("Nodes count field:", content);
  
  await page.evaluate(() => {
     const rackBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('RACK') || b.innerText.includes('List View'));
     if(rackBtn) rackBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const content2 = await page.evaluate(() => {
     const nodes = Array.from(document.querySelectorAll('.bg-graphite\\/90'));
     return nodes.length;
  });
  console.log("Nodes count rack:", content2);
  
  await browser.close();
})();
