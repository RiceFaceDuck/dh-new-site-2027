import puppeteer from "puppeteer";

async function run() {
  console.log("=== Launching Puppeteer to inspect http://localhost:8988/providers ===");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    const failedRequests = [];
    page.on('requestfailed', req => {
      failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
    });

    const responseStatuses = [];
    page.on('response', res => {
      if (res.url().includes('google') || res.url().includes('firebase') || res.url().includes('logo') || res.url().includes('unsplash')) {
        responseStatuses.push({ url: res.url().substring(0, 80), status: res.status() });
      }
    });

    console.log("Navigating to http://localhost:8988/providers...");
    await page.goto('http://localhost:8988/providers', { waitUntil: 'networkidle2', timeout: 15000 });

    // Wait a little bit for any React effects and intersection observer
    await new Promise(r => setTimeout(r, 2000));

    // Inspect cards
    const cardsInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid > div'));
      return cards.map(c => {
        const title = c.querySelector('h3')?.innerText || '';
        const img = c.querySelector('img');
        const imgAttrs = img ? {
          src: img.getAttribute('src'),
          currentSrc: img.currentSrc,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          className: img.className
        } : null;
        const skeleton = c.querySelector('.animate-pulse');
        return {
          title,
          hasImgTag: !!img,
          imgAttrs,
          hasSkeleton: !!skeleton
        };
      });
    });

    console.log("\n--- Cards Info ---");
    console.log(JSON.stringify(cardsInfo, null, 2));

    console.log("\n--- Console Logs ---");
    consoleLogs.forEach(l => console.log(`[${l.type}] ${l.text}`));

    console.log("\n--- Failed Requests ---");
    console.log(failedRequests);

    console.log("\n--- Relevant Responses ---");
    responseStatuses.forEach(r => console.log(`${r.status} ${r.url}`));

  } catch (err) {
    console.error("Puppeteer test error:", err);
  } finally {
    await browser.close();
  }
}

run();
