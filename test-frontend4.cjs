const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 3000));
  
  const content = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.absolute.-translate-x-1\\/2.-translate-y-1\\/2.p-4.transition-colors.z-10')).map(n => n.style.transform);
  });
  console.log("Transforms:", content);
  
  await browser.close();
})();
