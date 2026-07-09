import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  const ports = [5173, 5174, 5175, 5176];
  let connected = false;
  let port = null;

  for (const p of ports) {
    try {
      console.log(`Trying port ${p}...`);
      await page.goto(`http://localhost:${p}`, { waitUntil: 'networkidle0', timeout: 5000 });
      connected = true;
      port = p;
      break;
    } catch (e) {
      console.log(`Port ${p} not ready:`, e.message);
    }
  }

  if (!connected) {
    console.error("Could not connect to dev server.");
    await browser.close();
    process.exit(1);
  }

  console.log(`Connected to http://localhost:${port}`);
  await new Promise(r => setTimeout(r, 5000));
  
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  if (errors.length > 0) {
    console.log("🔥 Errors found during UI load:");
    errors.forEach(e => console.log(e));
  } else {
    console.log("✅ No UI errors detected. System is stable.");
  }

  await page.screenshot({ path: 'C:\\Users\\bents\\.gemini\\antigravity\\brain\\30a74a70-7db1-4b29-8b10-d49961eda2a7\\test_ui_result.png' });
  console.log("Screenshot saved.");

  await browser.close();
  process.exit(0);
})();
