const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 4000));
  const html = await page.content();
  console.log(html.substring(0, 500));
  console.log("...");
  console.log(html.substring(html.length - 1000));
  await browser.close();
})();
