const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  // Set localStorage to simulate login for Firebase?
  // We can't easily do that without actual auth. 
  // Let's just visit /studio and see if it crashes.
  await page.goto('http://localhost:3000/studio');
  await new Promise(r => setTimeout(r, 4000));
  const html = await page.content();
  console.log("Studio HTML length:", html.length);
  await browser.close();
})();
