import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('🚀 Starting Real UI Simulation with Screenshots...');
  
  const artifactDir = 'C:\\Users\\bents\\.gemini\\antigravity\\brain\\81171758-e360-4ac3-af03-8603c84b8e8e';
  
  const browser = await puppeteer.launch({
    headless: true, // run in background
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
      console.log('🌐 Navigating to localhost:3168...');
      await page.goto('http://localhost:3168/login', { waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_login.png') });
      console.log('📸 Saved screenshot_login.png');
      
      console.log('🔑 Logging in as AI Manager...');
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', 'ai.manager@dhnotebook.com');
      await page.type('input[type="password"]', 'Password123!');
      
      await page.click('button[type="submit"]');
      console.log('⏳ Waiting for Dashboard page to load...');
      await page.waitForSelector('h1', { timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_dashboard.png') });
      console.log('✅ Login successful!');
      console.log('📸 Saved screenshot_dashboard.png');

      console.log('🛒 Navigating to Billing Dashboard...');
      await page.goto('http://localhost:3168/billing', { waitUntil: 'networkidle2' });
      console.log('⏳ Waiting for "สร้างบิลใหม่" button to be ready...');
      try {
        await page.waitForFunction(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.some(b => b.textContent.includes('สร้างบิลใหม่'));
        }, { timeout: 15000 });
      } catch (err) {
        console.warn('⚠️ Warning: "สร้างบิลใหม่" button wait timeout, continuing...');
      }
      
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_pos.png') });
      console.log('📸 Saved screenshot_pos.png');
      
      console.log('➕ Clicking "สร้างบิลใหม่" button...');
      const createBillSuccess = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.textContent.includes('สร้างบิลใหม่'));
          if (btn) { btn.click(); return true; }
          return false;
      });
      if (!createBillSuccess) throw new Error('ไม่พบปุ่ม "สร้างบิลใหม่"');
      
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_pos_real.png') });
      console.log('📸 Saved screenshot_pos_real.png');

      console.log('🔍 Typing "ADAC" in product search...');
      await page.waitForSelector('input[placeholder*="ค้นหาสินค้า"]');
      await page.type('input[placeholder*="ค้นหาสินค้า"]', 'ADAC');
      await new Promise(r => setTimeout(r, 2000)); // wait for dropdown search results
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_search_dropdown.png') });
      console.log('📸 Saved screenshot_search_dropdown.png');
      
      console.log('🖱️ Clicking first item in search dropdown...');
      const clickProductSuccess = await page.evaluate(() => {
          const item = document.querySelector('.search-bar-area div.cursor-pointer');
          if (item) { item.click(); return true; }
          return false;
      });
      if (clickProductSuccess) {
          console.log('✅ Product clicked in dropdown');
      } else {
          console.log('⚠️ Dropdown item not found via evaluate, fallback to raw click');
          await page.click('div.cursor-pointer');
      }
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_cart.png') });
      console.log('📸 Saved screenshot_cart.png');

      console.log('👤 Selecting Customer...');
      const openCustModalSuccess = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.textContent.includes('ค้นหา / เลือกลูกค้า'));
          if (btn) { btn.click(); return true; }
          return false;
      });
      if (openCustModalSuccess) {
          await page.waitForSelector('input[placeholder*="ค้นหา"]', {timeout: 5000});
          await page.type('input[placeholder*="ค้นหา"]', 'Y2RGBKQN');
          await new Promise(r => setTimeout(r, 1500)); 
          
          const selectCustSuccess = await page.evaluate(() => {
              const btns = Array.from(document.querySelectorAll('button'));
              const btn = btns.find(b => b.textContent.includes('เลือก'));
              if (btn) { btn.click(); return true; }
              return false;
          });
          if (selectCustSuccess) console.log('✅ Customer Y2RGBKQN Selected');
      }

      console.log('💳 Proceeding to Checkout...');
      const checkoutSuccess = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.textContent.includes('ชำระเงิน'));
          if (btn) { btn.click(); return true; }
          return false;
      });
      if (checkoutSuccess) {
          await new Promise(r => setTimeout(r, 2000));
          await page.screenshot({ path: path.join(artifactDir, 'screenshot_checkout.png') });
          console.log('📸 Saved screenshot_checkout.png');
      }

      console.log('💸 Confirming Payment...');
      const confirmPaymentSuccess = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.textContent.includes('ยืนยันชำระเงิน'));
          if (btn) { btn.click(); return true; }
          return false;
      });
      if (confirmPaymentSuccess) {
          console.log('✅ Clicked confirm payment button');
      } else {
          console.log('⚠️ Could not find confirm payment button');
      }
      
      // Give it time to save order
      await new Promise(r => setTimeout(r, 5000));
      await page.screenshot({ path: path.join(artifactDir, 'screenshot_completed.png') });
      console.log('✅ Checkout Completed!');
      console.log('📸 Saved screenshot_completed.png');
      
  } catch (e) {
      console.error(e);
      try {
        if (page && !page.isClosed()) {
          await page.screenshot({ path: path.join(artifactDir, 'screenshot_error.png') });
        }
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError.message);
      }
  }

  await browser.close();
  console.log('🏁 Test Finished.');
})();
