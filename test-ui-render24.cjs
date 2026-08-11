const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--window-size=390,844'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const content = await page.evaluate(() => {
     return window.localStorage.getItem('debug_target') || 'nothing';
  });
  console.log("Targets:", content);
  
  await browser.close();
})();
