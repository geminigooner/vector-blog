const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 4000));
  // click List View
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const listBtn = btns.find(b => b.textContent.includes('List View') || b.textContent.includes('RACK'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  console.log("Mock artifact text present in RACK?", html.includes("To build a machine"));
  await browser.close();
})();
