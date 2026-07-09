import puppeteer from 'puppeteer';

(async () => {
  console.log("🚀 [E2E Testing] Starting real-world UI test on Production...");
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    let errors = [];

    // Catch console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log("🚨 Browser Console Error:", msg.text());
      }
    });
    
    // Catch page errors
    page.on('pageerror', err => {
      errors.push(err.message);
      console.log("🚨 Page Error:", err.message);
    });

    console.log("🌐 Navigating to dh-notebook-frontend.web.app...");
    await page.goto('https://dh-notebook-frontend.web.app', { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    console.log("✅ Page Title:", title);
    
    // Navigate to a product detail page to ensure ChevronLeft issue is gone
    // We will just try to click on the first product or go to a known URL like /product/FADE021
    console.log("🌐 Navigating to /product/FADE021...");
    await page.goto('https://dh-notebook-frontend.web.app/product/FADE021', { waitUntil: 'networkidle2' });
    
    // Check if error boundary is shown (usually has text 'ขออภัย เกิดข้อผิดพลาด')
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('ขออภัย เกิดข้อผิดพลาด') || bodyText.includes('ChevronLeft')) {
       console.log("❌ Error Boundary detected on screen!");
       errors.push("Error Boundary UI shown");
    } else {
       console.log("✅ No Error Boundary detected. UI rendered successfully.");
    }

    if (errors.length > 0) {
      console.log("❌ Tests failed with errors.");
      process.exit(1);
    } else {
      console.log("🎉 All Real-world UI tests passed!");
    }
  } catch (error) {
    console.error("❌ Automation script crashed:", error);
  } finally {
    if (browser) await browser.close();
  }
})();
