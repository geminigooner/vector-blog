const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 4000));
  
  const html = await page.content();
  console.log("HTML length:", html.length);
  
  const hasAuthorText = html.includes("author");
  console.log("has author text?", hasAuthorText);
  
  const nodes = await page.$$eval('div', divs => divs.filter(d => d.style.opacity && d.style.opacity !== "").length);
  console.log("divs with opacity (nodes):", nodes);
  
  await browser.close();
})();
