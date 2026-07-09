import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// ฟังก์ชันหน่วงเวลา
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("🚀 Starting E2E POS Billing Simulation...");
  const screenshotDir = path.resolve('scratch/screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // 1. Launch Browser
  const browser = await puppeteer.launch({
    headless: true, // รันแบบไม่มีหัว แต่บันทึก screenshot
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });

  try {
    // 2. Go to login page
    console.log("📍 Navigating to localhost:3168...");
    await page.goto('http://localhost:3168', { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotDir, '01_login_page.png') });
    console.log("📸 Saved screenshot: 01_login_page.png");

    // 3. Fill Login form
    console.log("✍️ Filling login credentials...");
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'ai.manager@dhnotebook.com');
    await page.type('input[type="password"]', 'Password123!');
    await page.screenshot({ path: path.join(screenshotDir, '02_filled_credentials.png') });

    // Submit
    console.log("🔑 Clicking login button...");
    await page.click('button[type="submit"]');
    
    // Wait for navigation / Overview page loading
    await delay(5000);
    await page.screenshot({ path: path.join(screenshotDir, '03_after_login.png') });
    console.log("📸 Saved screenshot: 03_after_login.png");

    // 4. Navigate to POS page (/billing)
    console.log("📍 Navigating to POS Billing page...");
    await page.goto('http://localhost:3168/billing', { waitUntil: 'networkidle2' });
    await delay(3000);
    await page.screenshot({ path: path.join(screenshotDir, '04_pos_main.png') });
    console.log("📸 Saved screenshot: 04_pos_main.png");

    // Click 'สร้างบิลใหม่' to open POS panel
    console.log("📍 Clicking 'สร้างบิลใหม่' button...");
    const dashboardButtons = await page.$$('button');
    let createBillButton;
    for (let btn of dashboardButtons) {
      let text = await page.evaluate(el => el.textContent, btn);
      let isVisible = await page.evaluate(el => el.offsetWidth > 0 && el.offsetHeight > 0, btn);
      if (text.includes('สร้างบิลใหม่') && isVisible) {
        createBillButton = btn;
        break;
      }
    }
    if (createBillButton) {
      await createBillButton.click();
      console.log("✅ Opened POS System Panel");
    } else {
      console.warn("⚠️ 'สร้างบิลใหม่' button not found, maybe already in POS?");
    }
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotDir, '04_b_pos_panel.png') });
    console.log("📸 Saved screenshot: 04_b_pos_panel.png");

    // 5. Select Customer (Y2RGBKQN)
    console.log("🔍 Searching for customer: Y2RGBKQN...");
    const customerInputSelector = 'input[placeholder="พิมพ์ชื่อลูกค้า, เบอร์โทร หรืออีเมล..."]';
    await page.waitForSelector(customerInputSelector);
    await page.click(customerInputSelector);
    await page.type(customerInputSelector, 'Y2RGBKQN');
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotDir, '05_customer_search.png') });

    // Click the first customer in dropdown
    console.log("👤 Selecting customer from dropdown...");
    const dropdownItems = await page.$$('div.absolute.top-full.left-0.right-0 div');
    let targetCustomerItem;
    for (let item of dropdownItems) {
      let text = await page.evaluate(el => el.textContent, item);
      if (text.includes('AI Technical Service') || text.includes('ai.tester')) {
        targetCustomerItem = item;
        break;
      }
    }
    if (targetCustomerItem) {
      await targetCustomerItem.click();
      console.log("✅ Selected Customer: ลูกค้า AI (ai.tester@dhnotebook.com)");
    } else {
      console.warn("⚠️ Customer not found by email, clicking first dropdown item as fallback...");
      const fallbackItem = await page.$('div.absolute.top-full.left-0.right-0 div.cursor-pointer');
      if (fallbackItem) await fallbackItem.click();
    }
    await delay(2000);

    // Bypass phone checking if needed by clicking 'สงวนสิทธิ์'
    console.log("🛡️ Checking if phone number bypass is needed...");
    const currentButtons = await page.$$('button');
    for (let btn of currentButtons) {
      let text = await page.evaluate(el => el.textContent, btn);
      let isVisible = await page.evaluate(el => el.offsetWidth > 0 && el.offsetHeight > 0, btn);
      if ((text.includes('สงวนสิทธิ์') || text.includes('สงวนสิทธิ์เบอร์โทร')) && isVisible) {
        await btn.click();
        console.log("✅ Clicked 'สงวนสิทธิ์' button");
        break;
      }
    }
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '06_customer_selected.png') });
    console.log("📸 Saved screenshot: 06_customer_selected.png");

    // 6. Search and Add LED14003
    console.log("🛒 Adding product LED14003 (Panel) to cart...");
    const productInputSelector = 'input[placeholder="ยิง Barcode หรือค้นหาสินค้า (F3)"]';
    await page.waitForSelector(productInputSelector);
    await page.click(productInputSelector);
    await page.type(productInputSelector, 'LED14003');
    await delay(1500);
    // Press Enter to add
    await page.keyboard.press('Enter');
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotDir, '07_add_led14003.png') });
    console.log("📸 Saved screenshot: 07_add_led14003.png");

    // 7. Search and Add LED14005
    console.log("🛒 Adding product LED14005 (Panel) to cart...");
    await page.click(productInputSelector);
    // Clear input first
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type(productInputSelector, 'LED14005');
    await delay(1500);
    // Press Enter to add
    await page.keyboard.press('Enter');
    await delay(2000);
    await page.screenshot({ path: path.join(screenshotDir, '08_add_led14005.png') });
    console.log("📸 Saved screenshot: 08_add_led14005.png");

    // 8. Select Cash Payment & Exact amount
    console.log("💵 Expanding payment panel by clicking red 'ชำระเงิน' button...");
    const initButtons = await page.$$('button');
    let expandButton;
    for (let button of initButtons) {
      let text = await page.evaluate(el => el.textContent, button);
      let isVisible = await page.evaluate(el => el.offsetWidth > 0 && el.offsetHeight > 0, button);
      if (text.includes('ชำระเงิน') && isVisible) {
        expandButton = button;
        break;
      }
    }
    if (expandButton) {
      await expandButton.click();
      console.log("✅ Expanded payment panel");
    }
    await delay(1500);
    await page.screenshot({ path: path.join(screenshotDir, '08_c_payment_expanded.png') });
    console.log("📸 Saved screenshot: 08_c_payment_expanded.png");

    console.log("💵 Selecting Cash Payment...");
    const buttons = await page.$$('button');
    let cashButton;
    for (let button of buttons) {
      let text = await page.evaluate(el => el.textContent, button);
      let isVisible = await page.evaluate(el => el.offsetWidth > 0 && el.offsetHeight > 0, button);
      if (text.includes('เงินสด') && isVisible) {
        cashButton = button;
        break;
      }
    }
    if (cashButton) {
      await cashButton.click();
      console.log("✅ Clicked Cash button");
    }
    await delay(1000);

    console.log("💵 Clicking 'Exact' (พอดี) button...");
    const exactButtonSelector = 'button';
    let exactButton;
    const allButtons = await page.$$(exactButtonSelector);
    for (let btn of allButtons) {
      let text = await page.evaluate(el => el.textContent, btn);
      let isVisible = await page.evaluate(el => el.offsetWidth > 0 && el.offsetHeight > 0, btn);
      if (text === 'พอดี' && isVisible) {
        exactButton = btn;
        break;
      }
    }
    if (exactButton) {
      await exactButton.click();
      console.log("✅ Clicked 'Exact' button");
    }
    await delay(1500);
    await page.screenshot({ path: path.join(screenshotDir, '09_payment_prepared.png') });
    console.log("📸 Saved screenshot: 09_payment_prepared.png");

    // 9. Checkout (Paid)
    console.log("🏁 Clicking Receipt/Paid checkout button...");
    let payButton;
    const finalButtons = await page.$$(exactButtonSelector);
    for (let btn of finalButtons) {
      let text = await page.evaluate(el => el.textContent, btn);
      let isVisible = await page.evaluate(el => el.offsetWidth > 0 && el.offsetHeight > 0, btn);
      if (text.includes('รับชำระเงิน (Paid)') && isVisible) {
        payButton = btn;
        break;
      }
    }
    if (payButton) {
      await payButton.click();
      console.log("✅ Clicked 'รับชำระเงิน (Paid)' button");
    } else {
      console.log("⚠️ Button 'รับชำระเงิน (Paid)' not found, attempting Ctrl+Enter shortcut...");
      await page.keyboard.down('Control');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Control');
    }
    
    // Wait for success and receipt modal
    console.log("⏳ Waiting for checkout processing...");
    await delay(6000);
    await page.screenshot({ path: path.join(screenshotDir, '10_checkout_result.png') });
    console.log("📸 Saved screenshot: 10_checkout_result.png");

    console.log("🎉 E2E Simulation finished!");

  } catch (error) {
    console.error("❌ Error occurred during E2E simulation:", error);
    await page.screenshot({ path: path.join(screenshotDir, 'error_page.png') });
  } finally {
    await browser.close();
    console.log("🚪 Browser closed.");
  }
}

run();
