const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 4000));
  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('List View') || b.textContent.includes('RACK'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  console.log("Images found:", (html.match(/<img[^>]+>/g) || []).length);
  await browser.close();
})();
