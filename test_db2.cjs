const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  await page.goto('http://localhost:3000/studio');
  await new Promise(r => setTimeout(r, 4000));
  const html = await page.content();
  console.log("Dashboard shows NO artifacts?", html.includes("No artifacts found"));
  await browser.close();
})();
