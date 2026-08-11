const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.evaluate(() => {
    return document.querySelector('main')?.innerHTML;
  });
  console.log("Main HTML:", content?.substring(0, 500));
  
  await browser.close();
})();
