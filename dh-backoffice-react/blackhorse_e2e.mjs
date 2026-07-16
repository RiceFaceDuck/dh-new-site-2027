import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 1024 });

  console.log('Navigating to frontend (http://localhost:5173)...');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  } catch (err) {
    console.error('Failed to load frontend. Is the dev server running?', err.message);
    await browser.close();
    process.exit(1);
  }

  console.log('Navigating to login page...');
  await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle2' });

  console.log('Typing credentials...');
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', 'ai.manager@dhnotebook.com');
  await page.type('input[name="password"]', 'Password123!');
  
  console.log('Clicking login...');
  await page.click('button[type="submit"]');

  console.log('Waiting for login to complete...');
  // It might not trigger a navigation event if it's SPA and just re-renders the same path
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('Navigating to home page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  
  console.log('Scrolling down to trigger ScrollReveal...');
  // Scroll down multiple times to ensure ScrollReveal triggers
  for(let i=0; i<3; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('Waiting for products to load (waiting for skeleton loader to disappear)...');
  try {
    // Wait for at least one item to render
    await page.waitForSelector('.col-span-1', { timeout: 15000 });
    console.log('Product cards found in DOM!');
    // Wait an additional 3 seconds for images and animations to finish
    await new Promise(r => setTimeout(r, 3000));
  } catch (e) {
    console.log('Timeout waiting for products to load.');
  }
  
  console.log('Taking screenshot...');
  const artifactDir = 'C:\\Users\\bents\\.gemini\\antigravity\\brain\\4528923b-d53a-49ce-8cde-9150940cffb9';
  const screenshotPath = path.join(artifactDir, 'blackhorse_home.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`Screenshot saved to ${screenshotPath}`);
  await browser.close();
})();
