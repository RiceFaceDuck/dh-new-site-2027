const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\bents\\.gemini\\antigravity\\brain\\b509377e-468f-48c5-a5c3-3ec3428d49e0';

async function runTest() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log("Navigating to http://localhost:5173/login ...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 30000 });

  console.log("Filling login form...");
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'ai.manager@dhnotebook.com', { delay: 50 });
  
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', 'Password123!', { delay: 50 });
  
  console.log("Clicking login...");
  await Promise.all([
      page.click('button[type="submit"]'),
      // Wait for navigation or a dashboard element to appear
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => console.log('Navigation timeout, checking DOM...'))
  ]);

  // Wait a bit more just in case it's a SPA and didn't trigger navigation
  await new Promise(r => setTimeout(r, 5000));
  
  const currentUrl = page.url();
  console.log("Current URL:", currentUrl);
  
  if (currentUrl.includes('/login')) {
      console.log("Still on login page. Checking for error messages...");
      const html = await page.content();
      if (html.includes('auth/')) {
          console.log("Firebase Auth Error might have occurred.");
      }
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_error.png') });
      await browser.close();
      return;
  }

  console.log("Taking screenshot of Dashboard...");
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_dashboard_result_v2.png') });

  console.log("Testing Warranty Check Modal...");
  const dashBtns = await page.$$('button');
  for (const btn of dashBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('ตรวจสอบประกัน')) {
          await btn.click();
          break;
      }
  }

  await new Promise(r => setTimeout(r, 2000));
  
  const inputs = await page.$$('input[type="text"]');
  for (const input of inputs) {
      const ph = await page.evaluate(el => el.placeholder, input);
      if (ph && ph.includes('DH-')) {
          await input.type('DH-AI-TEST-1234', { delay: 50 });
          await page.keyboard.press('Enter');
          break;
      }
  }

  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_warranty_check_v2.png') });

  console.log("Test Completed. Closing browser.");
  await browser.close();
}

runTest();
