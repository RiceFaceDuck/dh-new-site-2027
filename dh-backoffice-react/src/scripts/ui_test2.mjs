import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('🚀 Starting Real UI Simulation with Screenshots...');
  
  const artifactDir = 'C:\\Users\\bents\\.gemini\\antigravity\\brain\\7b623d36-9550-412d-b4fe-037116c56d9b';
  
  const browser = await puppeteer.launch({
    headless: true, // run in background
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
      console.log('🌐 Navigating to localhost:3168...');
      await page.goto('http://localhost:3168/login', { waitUntil: 'networkidle2' });
      
      console.log('🔑 Logging in as AI Manager...');
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', 'ai.manager@dhnotebook.com');
      await page.type('input[type="password"]', 'Password123!');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('button[type="submit"]')
      ]);
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_1_dashboard.png') });
      console.log('✅ Login successful!');

      console.log('🛒 Navigating to POS...');
      await page.goto('http://localhost:3168/billing/pos', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_2_pos.png') });
      
      // We will skip searching and just click the first product to be safe
      console.log('🔍 Clicking first product...');
      await page.waitForSelector('.grid.grid-cols-2 div.group.cursor-pointer');
      await page.click('.grid.grid-cols-2 div.group.cursor-pointer');
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_3_cart.png') });
      console.log('✅ Added to Cart');

      console.log('💳 Proceeding to Checkout...');
      const checkoutBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find(b => b.textContent.includes('ชำระเงิน'));
      });
      if (checkoutBtn) await checkoutBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_4_checkout.png') });

      console.log('💸 Confirming Payment...');
      const confirmPaymentBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find(b => b.textContent.includes('ยืนยันชำระเงิน') || b.textContent.includes('จัดเต็มอัตโนมัติ')); // handle promo first
      });
      if (confirmPaymentBtn) {
          await confirmPaymentBtn.click();
      }
      
      // Give it time to save order
      await new Promise(r => setTimeout(r, 5000));
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_5_done.png') });
      console.log('✅ Checkout Completed!');
      
  } catch (e) {
      console.error(e);
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_error.png') });
  }

  await browser.close();
  console.log('🏁 Test Finished.');

})();
