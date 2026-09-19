/**
 * Live Verification Script for Bundled Recent Orders Document & (Cache & Overwrite)
 * Management System/tests/verifications/verify_order_cache_overwrite.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3168';

const stats = {
  tested: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function pass(msg) {
  stats.tested++;
  stats.passed++;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg, err) {
  stats.tested++;
  stats.failed++;
  console.error(`  [FAIL] ${msg}`, err || '');
  stats.errors.push({ msg, err: String(err || '') });
}

async function probeViteModule(modulePath) {
  try {
    const res = await fetch(`${BASE_URL}${modulePath}`);
    if (res.status === 200) {
      const code = await res.text();
      if (code.includes('vite-error-overlay') || code.includes('Internal Server Error')) {
        fail(`Module ${modulePath} transformed with error overlay!`);
        return false;
      }
      pass(`Module ${modulePath} transformed cleanly (0 errors)`);
      return true;
    } else {
      fail(`Module ${modulePath} returned HTTP ${res.status}`);
      return false;
    }
  } catch (e) {
    fail(`Module ${modulePath} fetch error`, e);
    return false;
  }
}

async function run() {
  console.log("==================================================================");
  console.log("  DH Notebook: (Cache & Overwrite) Architecture Verification");
  console.log("  Target: " + BASE_URL);
  console.log("==================================================================\n");

  console.log("--- 1. Testing Code Architecture & File Exports ---");
  const cacheServicePath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/orderCacheService.js');
  const syncServicePath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/orderSyncService.js');
  const hookPath = path.resolve(__dirname, '../../dh-backoffice-react/src/components/billing/hooks/useBillingOrders.js');
  const statusTxPath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/billingStatusTransaction.js');

  const cacheServiceCode = fs.readFileSync(cacheServicePath, 'utf8');
  const syncServiceCode = fs.readFileSync(syncServicePath, 'utf8');
  const hookCode = fs.readFileSync(hookPath, 'utf8');
  const statusTxCode = fs.readFileSync(statusTxPath, 'utf8');

  // Check 1.1: orderCacheService functions
  if (cacheServiceCode.includes('readCachedOrders') && cacheServiceCode.includes('writeCachedOrders') && cacheServiceCode.includes('subscribeRecentOrdersCatalog')) {
    pass("orderCacheService: Implements readCachedOrders, writeCachedOrders, subscribeRecentOrdersCatalog");
  } else {
    fail("orderCacheService: Missing essential Cache & Overwrite exports");
  }

  // Check 1.2: orderSyncService
  if (syncServiceCode.includes('syncRecentOrdersCatalog') && syncServiceCode.includes('recent_orders')) {
    pass("orderSyncService: Implements syncRecentOrdersCatalog targeting catalogs/recent_orders");
  } else {
    fail("orderSyncService: Missing syncRecentOrdersCatalog");
  }

  // Check 1.3: useBillingOrders Tier 1 & Tier 2 integration
  if (hookCode.includes('readCachedOrders()') && hookCode.includes('subscribeRecentOrdersCatalog') && hookCode.includes('Using direct collection query fallback')) {
    pass("useBillingOrders: Integrated Tier 1 local cache + Tier 2 catalogs/recent_orders listener + fallback");
  } else {
    fail("useBillingOrders: Missing Cache & Overwrite or fallback integration");
  }

  // Check 1.4: billingStatusTransaction trigger
  if (statusTxCode.includes('syncRecentOrdersCatalog') && statusTxCode.includes('syncRecentOrdersCatalog().catch')) {
    pass("billingStatusTransaction: Background catalog sync wired on status updates");
  } else {
    fail("billingStatusTransaction: Missing background catalog sync trigger");
  }

  console.log("\n--- 2. Testing Dev Server Module Transformation ---");
  const modulesToTest = [
    '/src/firebase/orderCacheService.js',
    '/src/firebase/orderSyncService.js',
    '/src/components/billing/hooks/useBillingOrders.js',
    '/src/firebase/billingStatusTransaction.js',
    '/src/pages/billing/BillingMain.jsx'
  ];

  for (const mod of modulesToTest) {
    await probeViteModule(mod);
  }

  console.log("\n==================================================================");
  console.log(`  Total Checks: ${stats.tested} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
  console.log("==================================================================");

  if (stats.failed === 0) {
    console.log("🎉 ALL (CACHE & OVERWRITE) ARCHITECTURE VERIFICATIONS PASSED!\n");
    process.exit(0);
  } else {
    console.error("❌ VERIFICATION FAILED WITH ERRORS!\n");
    process.exit(1);
  }
}

run();
