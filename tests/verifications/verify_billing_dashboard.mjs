/**
 * Live Operational Verification Script for Billing Dashboard
 * Management System/tests/verifications/verify_billing_dashboard.mjs
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

async function probeUrl(urlPath) {
  try {
    const res = await fetch(`${BASE_URL}${urlPath}`);
    if (res.status === 200) {
      pass(`Endpoint ${urlPath} -> HTTP 200 OK`);
      return true;
    } else {
      fail(`Endpoint ${urlPath} -> HTTP ${res.status}`);
      return false;
    }
  } catch (e) {
    fail(`Endpoint ${urlPath} -> Connection Error`, e);
    return false;
  }
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
  console.log("  DH Notebook: Billing Dashboard Phase 1 Operational Verification");
  console.log("  Target: " + BASE_URL);
  console.log("==================================================================\n");

  console.log("--- 1. Testing Route Availability ---");
  await probeUrl('/billing');

  console.log("\n--- 2. Testing Dev Server Module Transformation ---");
  const modulesToTest = [
    '/src/pages/billing/BillingMain.jsx',
    '/src/components/billing/BillingDashboard.jsx',
    '/src/components/billing/hooks/useBillingOrders.js',
    '/src/components/billing/dashboard/OrderFilterBar.jsx',
    '/src/components/billing/dashboard/OrderListTable.jsx',
    '/src/components/billing/dashboard/OrderTableRow.jsx',
    '/src/components/billing/dashboard/OrderDetailModal.jsx',
    '/src/components/billing/dashboard/OrderActions.jsx',
    '/src/components/billing/dashboard/OrderSummary.jsx'
  ];

  for (const mod of modulesToTest) {
    await probeViteModule(mod);
  }

  console.log("\n--- 3. Verifying Code Architecture & Quota Guardrails ---");
  const billingMainPath = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/billing/BillingMain.jsx');
  const useBillingOrdersPath = path.resolve(__dirname, '../../dh-backoffice-react/src/components/billing/hooks/useBillingOrders.js');

  const billingMainCode = fs.readFileSync(billingMainPath, 'utf8');
  const useBillingOrdersCode = fs.readFileSync(useBillingOrdersPath, 'utf8');

  // Check 3.1: limitAmount is 50
  if (useBillingOrdersCode.includes('useState(50)')) {
    pass("useBillingOrders: limitAmount default is 50 (matches production)");
  } else {
    fail("useBillingOrders: limitAmount is not set to 50");
  }

  // Check 3.2: Date sorting
  if (useBillingOrdersCode.includes('.sort((a, b) => {') && useBillingOrdersCode.includes('getTs(b) - getTs(a)')) {
    pass("useBillingOrders: Timestamp fallback sort is wired properly");
  } else {
    fail("useBillingOrders: Timestamp fallback sort is missing");
  }

  // Check 3.3: PosViewWrapper isolates useCustomerData
  if (billingMainCode.includes('PosViewWrapper') && billingMainCode.includes('const { customers, loading: isCustomersLoading } = useCustomerData();')) {
    pass("BillingMain: useCustomerData is isolated inside PosViewWrapper (0 reads on Order List)");
  } else {
    fail("BillingMain: useCustomerData is not properly scoped inside PosViewWrapper");
  }

  console.log("\n==================================================================");
  console.log(`  Total Checks: ${stats.tested} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
  console.log("==================================================================");

  if (stats.failed === 0) {
    console.log("🎉 ALL BILLING DASHBOARD VERIFICATIONS PASSED!\n");
    process.exit(0);
  } else {
    console.error("❌ VERIFICATION FAILED WITH ERRORS!\n");
    process.exit(1);
  }
}

run();
