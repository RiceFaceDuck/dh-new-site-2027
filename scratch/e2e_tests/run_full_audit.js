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
  await page.setViewport({ width: 1440, height: 900 });
  
  // 1. LOGIN
  console.log("Navigating to http://localhost:5173/login ...");
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'ai.manager@dhnotebook.com', { delay: 10 });
  await page.type('input[type="password"]', 'Password123!', { delay: 10 });
  
  await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {})
  ]);
  await new Promise(r => setTimeout(r, 5000));

  // 2. NAVIGATE TO BILLING TO EXTRACT AN ORDER ID
  console.log("Navigating to /billing to verify functional test and extract Order ID...");
  await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 8000)); // wait for Firestore data to load
  
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_billing_dashboard.png') });
  
  // Try to find the first order ID in the table
  let orderIdToTest = 'DH-1234'; // Fallback
  try {
      const orderCells = await page.$$('td');
      for (const cell of orderCells) {
          const text = await page.evaluate(el => el.textContent, cell);
          if (text.includes('BLL-') || text.includes('ORD-') || (text.includes('-') && text.length > 8)) {
              // Usually Order IDs have a specific format, we will just grab the first valid looking one
              // Actually let's just grab text that looks like BLL-xxxx or ORD-xxxx
              const match = text.match(/(BLL-[A-Z0-9]+|ORD-[A-Z0-9]+|[A-Z0-9]{8,})/);
              if (match) {
                  orderIdToTest = match[0];
                  console.log("Found Order ID to test:", orderIdToTest);
                  break;
              }
          }
      }
  } catch (e) {
      console.log("Could not extract Order ID automatically.");
  }

  // 3. NAVIGATE TO CLAIMS TO TEST WARRANTY MODAL
  console.log("Navigating to /claims to test Warranty Check...");
  await page.goto('http://localhost:5173/claims', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  // Click "ตรวจสอบประกัน"
  const buttons = await page.$$('button');
  for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('ตรวจสอบประกัน')) {
          await btn.click();
          console.log("Clicked 'ตรวจสอบประกัน' button.");
          break;
      }
  }

  await new Promise(r => setTimeout(r, 2000));
  
  // Type the extracted Order ID
  const inputs = await page.$$('input[type="text"]');
  for (const input of inputs) {
      const ph = await page.evaluate(el => el.placeholder, input);
      if (ph && (ph.includes('DH-') || ph.includes('ค้นหา') || ph.includes('Search'))) {
          await input.type(orderIdToTest, { delay: 50 });
          await page.keyboard.press('Enter');
          console.log(`Searched for Order ID: ${orderIdToTest}`);
          break;
      }
  }

  await new Promise(r => setTimeout(r, 5000)); // wait for Firestore query to resolve
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_warranty_check_verified.png') });

  // 4. TEST INVENTORY TO VERIFY DATA FLOW
  console.log("Navigating to /inventory...");
  await page.goto('http://localhost:5173/inventory', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_inventory_verified.png') });

  console.log("Test Completed. Closing browser.");
  await browser.close();
}

runTest();
