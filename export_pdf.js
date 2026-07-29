const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set A4 dimensions and wait for network
  await page.goto('file:///Users/ppooh/Downloads/portfolio/resume.html', {waitUntil: 'networkidle2'});
  await page.pdf({
    path: '/Users/ppooh/Downloads/portfolio/resume.pdf', 
    format: 'A4', 
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log("Exported resume.pdf");
  
  await page.goto('file:///Users/ppooh/Downloads/portfolio/resume-th.html', {waitUntil: 'networkidle2'});
  await page.pdf({
    path: '/Users/ppooh/Downloads/portfolio/resume-th.pdf', 
    format: 'A4', 
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log("Exported resume-th.pdf");
  
  await browser.close();
})();
