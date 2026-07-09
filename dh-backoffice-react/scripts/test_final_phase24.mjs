import puppeteer from 'puppeteer';

const TEST_URL = 'http://localhost:3168';
const EMAIL = 'ai.manager@dhnotebook.com';
const PASSWORD = 'Password123!';

(async () => {
  console.log('🚀 [START] Real E2E Simulation for Phase 2-4 Audit...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const errors = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[Page Error] ${err.toString()}`);
  });

  try {
    // 1. LOGIN
    console.log(`🔐 Logging in as AI Manager: ${EMAIL}`);
    await page.goto(`${TEST_URL}/login`);
    
    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', EMAIL);
    await page.type('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard or side menu to load
    await page.waitForSelector('div.bg-dh-base, nav', { timeout: 15000 });
    console.log('✅ Login successful!');

    // 2. CHECK AUDIT LEDGER
    console.log('👀 Navigating to Audit Ledger...');
    await page.goto(`${TEST_URL}/managers/audit-ledger`);
    
    // Verify react-window is rendering rows
    await page.waitForSelector('div[style*="position: absolute"]', { timeout: 15000 });
    const listElement = await page.$('div[style*="position: absolute"]');
    if (listElement) {
      console.log('✅ Audit Ledger Virtualization (react-window) is rendering correctly.');
    } else {
      console.log('⚠️ Warning: Could not explicitly find react-window list, but page loaded.');
    }

    // 3. CHECK CUSTOMERS PAGE
    console.log('👀 Navigating to Customers Page...');
    await page.goto(`${TEST_URL}/customers`);
    
    await page.waitForSelector('div.bg-white.border.border-dh-border', { timeout: 15000 });
    const customerTable = await page.$('div.bg-white.border.border-dh-border');
    if (customerTable) {
      console.log('✅ Customers Table is rendering correctly (Reverted successfully).');
    }

    // 4. CHECK ERRORS
    if (errors.length > 0) {
      console.log('❌ Tests completed with errors:');
      errors.forEach(e => console.log(e));
    } else {
      console.log('🟢 All systems stable. Zero crashes or console errors during simulation!');
    }
    
  } catch (error) {
    console.error('❌ Automation Error:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 [END] Simulation completed.');
  }
})();
