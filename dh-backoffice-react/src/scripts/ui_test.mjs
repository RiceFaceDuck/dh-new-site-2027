import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting Real UI Simulation...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
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
  console.log('✅ Login successful!');

  console.log('🛒 Navigating to POS...');
  await page.goto('http://localhost:3168/billing/pos', { waitUntil: 'networkidle2' });
  
  console.log('🔍 Searching for product "ADAC001"...');
  await page.waitForSelector('input[placeholder="พิมพ์ค้นหาสินค้า... (SKU, ชื่อ, บาร์โค้ด)"]');
  await page.type('input[placeholder="พิมพ์ค้นหาสินค้า... (SKU, ชื่อ, บาร์โค้ด)"]', 'ADAC001');
  
  await page.waitForSelector('.grid.grid-cols-2 div.group.cursor-pointer');
  await page.click('.grid.grid-cols-2 div.group.cursor-pointer');
  console.log('✅ Added ADAC001 to Cart');

  console.log('🎁 Applying Promotion...');
  try {
      const promoBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find(b => b.textContent.includes('เลือกโปรโมชั่น'));
      });
      if (promoBtn) {
          await promoBtn.click();
          await new Promise(r => setTimeout(r, 1000));
          const applyBtn = await page.evaluateHandle(() => {
              const btns = Array.from(document.querySelectorAll('button'));
              return btns.find(b => b.textContent.includes('จัดเต็มอัตโนมัติ') || b.textContent.includes('ใช้งานโปรโมชั่น'));
          });
          if (applyBtn) await applyBtn.click();
          await new Promise(r => setTimeout(r, 1000));
          const closePromo = await page.evaluateHandle(() => {
              const btns = Array.from(document.querySelectorAll('button'));
              return btns.find(b => b.textContent.includes('ยืนยัน'));
          });
          if (closePromo) await closePromo.click();
      }
  } catch(e) {
      console.log('⚠️ Could not apply promo:', e);
  }

  console.log('👤 Selecting Customer...');
  const customerBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('ค้นหา / เลือกลูกค้า'));
  });
  if (customerBtn) {
      await customerBtn.click();
      await page.waitForSelector('input[placeholder*="ค้นหา"]', {timeout: 5000});
      await page.type('input[placeholder*="ค้นหา"]', 'Y2RGBKQN');
      await new Promise(r => setTimeout(r, 1500)); 
      
      const selectCustBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find(b => b.textContent.includes('เลือก'));
      });
      if (selectCustBtn) await selectCustBtn.click();
  }

  console.log('💳 Proceeding to Checkout...');
  await new Promise(r => setTimeout(r, 1000));
  const checkoutBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('ชำระเงิน'));
  });
  if (checkoutBtn) await checkoutBtn.click();

  console.log('💸 Confirming Payment...');
  await new Promise(r => setTimeout(r, 1000));
  const confirmPaymentBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('ยืนยันชำระเงิน'));
  });
  if (confirmPaymentBtn) {
      await confirmPaymentBtn.click();
      console.log('✅ Checkout Completed!');
  }

  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
  console.log('🏁 Test Finished.');
})();
