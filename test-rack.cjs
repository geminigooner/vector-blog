const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Rack View button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const rackBtn = btns.find(b => b.textContent.includes('RACK'));
    if(rackBtn) rackBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));

  const content = await page.evaluate(() => {
    return document.querySelector('main')?.innerHTML;
  });
  console.log("Rack HTML:", content?.substring(0, 1000));
  
  await browser.close();
})();
