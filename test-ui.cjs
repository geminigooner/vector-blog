const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));

  const content = await page.evaluate(() => {
    return document.body.innerHTML;
  });
  console.log("HTML:", content.substring(0, 1000));
  
  const nodes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.absolute')).map(n => n.className);
  });
  console.log("Nodes:", nodes);
  
  await browser.close();
})();
