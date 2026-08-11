const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/studio');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.evaluate(() => {
    return document.body.innerHTML;
  });
  console.log("Studio HTML length:", content?.length);
  console.log("Studio HTML:", content?.substring(0, 1000));
  
  await browser.close();
})();
