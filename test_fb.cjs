const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 4000));
  const html = await page.content();
  console.log("Found images in PublicApp?", (html.match(/<img[^>]+>/g) || []).length);
  await browser.close();
})();
