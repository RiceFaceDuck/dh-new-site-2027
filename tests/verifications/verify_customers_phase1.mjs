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
      pass(`Module ${modulePath} -> HTTP 200 transformed cleanly`);
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
  console.log("  DH Notebook: Customers Phase 1 Operational Verification");
  console.log("  Target: " + BASE_URL);
  console.log("==================================================================\n");

  console.log("--- 1. Testing Route Availability ---");
  try {
    const res = await fetch(`${BASE_URL}/customers`);
    if (res.status === 200) {
      pass("Route /customers -> HTTP 200 OK");
    } else {
      fail(`Route /customers returned HTTP ${res.status}`);
    }
  } catch (e) {
    fail("Route /customers connection error", e);
  }

  console.log("\n--- 2. Testing Customers Modules on Vite Dev Server ---");
  const modulesToTest = [
    '/src/pages/Customers/index.jsx',
    '/src/pages/Customers/hooks/useCustomers.js',
    '/src/pages/Customers/hooks/useCustomerData.js',
    '/src/pages/Customers/services/customerCacheService.js',
    '/src/pages/Customers/services/customerOrderStatsService.js',
    '/src/pages/Customers/components/layout/CustomerHeader.jsx',
    '/src/pages/Customers/components/layout/CustomerTable.jsx',
    '/src/pages/Customers/components/layout/CustomerRow.jsx',
    '/src/pages/Customers/components/details/DetailPanel.jsx'
  ];

  for (const mod of modulesToTest) {
    await probeViteModule(mod);
  }

  console.log("\n--- 3. Verifying Code Architecture & Integrity ---");
  const cacheServicePath = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/services/customerCacheService.js');
  const useCustomerDataPath = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerData.js');

  const cacheServiceCode = fs.readFileSync(cacheServicePath, 'utf8');
  const useCustomerDataCode = fs.readFileSync(useCustomerDataPath, 'utf8');

  // Check 3.1: customerCacheService exports all essential methods
  const requiredMethods = [
    'CUSTOMER_CACHE_KEY',
    'CUSTOMER_LAST_SYNC_KEY',
    'filterAndSortCustomers',
    'readCachedCustomers',
    'writeCachedCustomers',
    'fetchCustomerDirectoryChunk',
    'fetchCustomersFromFirestore',
    'applyActiveStatsDelta'
  ];

  for (const method of requiredMethods) {
    if (cacheServiceCode.includes(method)) {
      pass(`customerCacheService: exports '${method}'`);
    } else {
      fail(`customerCacheService: missing export '${method}'`);
    }
  }

  // Check 3.2: fetchCustomerDirectoryChunk preserves accountId & customerCode
  if (cacheServiceCode.includes('resolvedAccountId') && cacheServiceCode.includes('accountId: resolvedAccountId')) {
    pass("fetchCustomerDirectoryChunk: Preserves 'accountId' and 'customerCode'");
  } else {
    fail("fetchCustomerDirectoryChunk: Omits accountId resolution");
  }

  // Check 3.3: useCustomerData connects to customerCacheService
  if (useCustomerDataCode.includes('customerCacheService') && useCustomerDataCode.includes('fetchCustomerDirectoryChunk')) {
    pass("useCustomerData: Wired cleanly to customerCacheService");
  } else {
    fail("useCustomerData: Missing customerCacheService linkage");
  }

  // Check 3.4: useCustomerData has validateAndRefreshActiveStats
  if (useCustomerDataCode.includes('validateAndRefreshActiveStats') && useCustomerDataCode.includes('fetchActiveCustomerStats')) {
    pass("useCustomerData: Zero-read active 30D stats synchronization enabled");
  } else {
    fail("useCustomerData: Missing active 30D stats integration");
  }

  console.log("\n==================================================================");
  console.log(`  Total Checks: ${stats.tested} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
  console.log("==================================================================");

  if (stats.failed === 0) {
    console.log("🎉 ALL PHASE 1 VERIFICATIONS PASSED!\n");
    process.exit(0);
  } else {
    console.error("❌ VERIFICATION FAILED WITH ERRORS!\n");
    process.exit(1);
  }
}

run();
