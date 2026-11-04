import puppeteer from 'puppeteer';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('🧪 [STAGE FINAL REVIEW] Beginning Comprehensive Verification Suite for Product Detail & Partner Card Stage...');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

// ========================================================
// 🔍 TEST SUITE 1: Code Structure & AST / Static Inspection
// ========================================================
console.log('\n--- SUITE 1: Code Structure & Contract Checks ---');

const pricingSectionPath = resolve('Management System/dh-frontend/src/components/product/ProductPricingSection.jsx');
const partnerBoxPath = resolve('Management System/dh-frontend/src/components/partner/PartnerSupportBox.jsx');
const nearestHookPath = resolve('Management System/dh-frontend/src/components/partner/hooks/useNearestPartner.js');
const memoryPath = resolve('Management System/dh-frontend/src/ssr-memory_storefront_design_system.md');

assert(existsSync(pricingSectionPath), 'ProductPricingSection.jsx exists');
assert(existsSync(partnerBoxPath), 'PartnerSupportBox.jsx exists');
assert(existsSync(nearestHookPath), 'useNearestPartner.js exists');
assert(existsSync(memoryPath), 'ssr-memory_storefront_design_system.md exists');

const pricingCode = readFileSync(pricingSectionPath, 'utf8');
const partnerCode = readFileSync(partnerBoxPath, 'utf8');
const nearestCode = readFileSync(nearestHookPath, 'utf8');
const memoryCode = readFileSync(memoryPath, 'utf8');

// 1. Marketplace 4-column PC & 2-column mobile
assert(pricingCode.includes('grid-cols-2 sm:grid-cols-4 gap-2'), 'Marketplace buttons layout is 4 columns on PC and 2 on mobile');

// 2. Dynamic SKU in platform header
assert(pricingCode.includes('สั่งซื้อ') && pricingCode.includes('จากแพลตฟอร์มอื่นๆ') && pricingCode.includes('product?.sku || product?.id'), 'Platform header dynamically includes SKU with distinct styling');

// 3. Quick Marketplace Circular Badges beside LINE Add friend
assert(pricingCode.includes('shopee_circle.png') && (pricingCode.includes('lazada_circle.png') || pricingCode.includes('lazada_quick_badge.png')), 'Circular Shopee and Lazada badges integrated');
assert(pricingCode.includes('w-10 h-10') && pricingCode.includes('rounded-full'), 'Circular badges strictly preserve 1:1 circular aspect ratio (w-10 h-10 rounded-full)');
assert(!pricingCode.includes('แต้มสะสมเมื่อซื้อสินค้านี้'), 'Points reward reminder successfully removed from pricing section');

// 4. Social Share Bar beside Favorite Heart (Option 1)
assert(pricingCode.includes('share_fb.png') && pricingCode.includes('share_x.png') && pricingCode.includes('share_pinterest.png') && pricingCode.includes('share_line.png'), 'All 4 social share platforms (FB, X, Pinterest, LINE) integrated');
assert(pricingCode.includes('facebook.com/sharer') && pricingCode.includes('twitter.com/intent/tweet') && (pricingCode.includes('social-plugins.line.me') || pricingCode.includes('line.me')), 'Actual functional sharing handlers implemented');

// 5. PartnerSupportBox: Rainbow badge top-flush & reduced 1 level
assert(partnerCode.includes('ผู้ให้บริการ ใกล้คุณ'), 'Rainbow badge displays "ผู้ให้บริการ ใกล้คุณ"');
assert(partnerCode.includes('from-violet-500 via-pink-500 via-amber-400 via-emerald-400 to-cyan-500'), 'Rainbow gradient border matches product table design');
assert(partnerCode.includes('p-[1px]') && partnerCode.includes('px-1.5 py-[1px]'), 'Rainbow badge reduced by 1 level');

// 6. PartnerSupportBox: Replace "ยืนยันตัวตนแล้ว" with store description
assert(!partnerCode.includes('ยืนยันตัวตนแล้ว'), 'Deprecated label "ยืนยันตัวตนแล้ว" completely removed from partner card');
assert(partnerCode.includes('partner.description') || partnerCode.includes('partner.richDescription'), 'Store description rendered from real partner data');

// 7. PartnerSupportBox: Robust image fallback & aspect-square frame
assert(partnerCode.includes('aspect-square') && partnerCode.includes('h-full'), 'Partner image frame is strictly full-height 1:1 aspect ratio');
assert(partnerCode.includes('imgFailed') && partnerCode.includes('Store'), 'Graceful fallback placeholder prevents distorted /logo.png display');

// 8. Nearest Partner Hook: Comprehensive field extraction
assert(nearestCode.includes('nearest.description =') && nearestCode.includes('nearest.storeImage ='), 'useNearestPartner extracts all image and description fields');

// ========================================================
// 🌐 TEST SUITE 2: Live Browser Puppeteer Functional Verification
// ========================================================
console.log('\n--- SUITE 2: Live Browser Puppeteer Functional Verification ---');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    // Desktop Viewport
    {
      const context = browser.defaultBrowserContext();
      await context.overridePermissions('http://localhost:8988', ['geolocation']);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setGeolocation({ latitude: 13.9623537, longitude: 100.6241017 });

      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));

      await page.goto('http://localhost:8988/product/ADAC001', { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 2000));

      assert(pageErrors.length === 0, `Desktop page rendered with ZERO runtime errors (Errors: ${pageErrors.join(', ') || 'None'})`);

      // 1. Check SKU header
      const skuHeaderText = await page.evaluate(() => {
        const h = Array.from(document.querySelectorAll('span, h3, h4, div')).find(el => el.textContent && el.textContent.includes('สั่งซื้อ') && el.textContent.includes('จากแพลตฟอร์มอื่นๆ'));
        return h ? h.innerText : null;
      });
      assert(skuHeaderText && skuHeaderText.includes('ADAC001'), `Dynamic SKU header rendered on Desktop`);

      // 2. Check Quick Marketplace Badges beside LINE
      const quickBadges = await page.evaluate(() => {
        const shopeeCircle = document.querySelector('img[src*="shopee_circle.png"]');
        const lazadaCircle = document.querySelector('img[src*="lazada_quick_badge.png"], img[src*="lazada_circle.png"]');
        return {
          shopee: Boolean(shopeeCircle),
          lazada: Boolean(lazadaCircle),
          shopeeWidth: shopeeCircle ? shopeeCircle.getBoundingClientRect().width : 0,
          shopeeHeight: shopeeCircle ? shopeeCircle.getBoundingClientRect().height : 0
        };
      });
      assert(quickBadges.shopee && quickBadges.lazada, 'Both Quick Shopee and Quick Lazada circular badges rendered beside LINE button');
      assert(quickBadges.shopeeWidth === 40 && quickBadges.shopeeHeight === 40, `Quick badge preserves 1:1 circular size 40x40px (actual: ${quickBadges.shopeeWidth}x${quickBadges.shopeeHeight}px)`);

      // 3. Check Social Share Bar beside Favorite Heart
      const shareBar = await page.evaluate(() => {
        const fb = document.querySelector('img[src*="share_fb.png"]');
        const x = document.querySelector('img[src*="share_x.png"]');
        const pin = document.querySelector('img[src*="share_pinterest.png"]');
        const line = document.querySelector('img[src*="share_line.png"]');
        return Boolean(fb && x && pin && line);
      });
      assert(shareBar, 'Social share bar with 4 platforms rendered beside Favorite Heart button');

      // 4. Check Partner Support Box
      const partnerData = await page.evaluate(() => {
        const card = document.querySelector('div.group.hover\\:shadow-md');
        if (!card) return null;
        const text = card.innerText;
        const img = card.querySelector('img');
        const rect = card.getBoundingClientRect();
        return {
          text,
          height: rect.height,
          hasRainbow: text.includes('ผู้ให้บริการ ใกล้คุณ'),
          hasNoOldBadge: !text.includes('ยืนยันตัวตนแล้ว'),
          imgSrc: img ? img.src : null,
          imgComplete: img ? img.complete : false
        };
      });

      assert(partnerData !== null, 'Partner Support Box card rendered on Desktop');
      assert(partnerData?.hasRainbow, 'Partner card displays rainbow badge "ผู้ให้บริการ ใกล้คุณ"');
      assert(partnerData?.hasNoOldBadge, 'Partner card does NOT contain old "ยืนยันตัวตนแล้ว" text');
      assert(partnerData?.height <= 155 && partnerData?.height >= 140, `Partner card height strictly bounded to specification (actual: ${partnerData?.height}px)`);
      assert(partnerData?.imgSrc && !partnerData?.imgSrc.endsWith('/logo.png'), `Partner card renders real store photo, not fallback logo (src: ${partnerData?.imgSrc?.substring(0, 60)}...)`);

      await page.close();
    }

    // Mobile Viewport
    {
      const context = browser.defaultBrowserContext();
      await context.overridePermissions('http://localhost:8988', ['geolocation']);
      const page = await browser.newPage();
      await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
      await page.setGeolocation({ latitude: 13.9623537, longitude: 100.6241017 });

      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));

      await page.goto('http://localhost:8988/product/ADAC001', { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 2000));

      assert(pageErrors.length === 0, `Mobile page rendered with ZERO runtime errors (Errors: ${pageErrors.join(', ') || 'None'})`);

      const mobileCard = await page.evaluate(() => {
        const card = document.querySelector('div.group.hover\\:shadow-md');
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        return {
          height: rect.height,
          width: rect.width,
          text: card.innerText
        };
      });

      assert(mobileCard !== null, 'Partner Support Box card rendered on Mobile');
      assert(mobileCard?.height <= 155 && mobileCard?.height >= 140, `Mobile Partner card height strictly bounded to specification (actual: ${mobileCard?.height}px)`);

      await page.close();
    }

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, `Unexpected error in test runner: ${err.message}`);
  } finally {
    await browser.close();
  }

  // ========================================================
  // 📊 TEST SUMMARY & SCORE
  // ========================================================
  console.log('\n========================================================');
  console.log(`📊 FINAL TEST REPORT: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests === 0) {
    console.log('🎉 RESULT: 100% PERFECT PASS - Zero Regressions, Zero Bugs!');
  } else {
    console.log(`⚠️ RESULT: ${failedTests} assertion(s) failed.`);
  }
  console.log('========================================================\n');
})();
