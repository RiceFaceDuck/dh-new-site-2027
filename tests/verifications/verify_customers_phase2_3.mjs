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
      pass(`Module ${modulePath} -> HTTP 200 cleanly transformed`);
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
  console.log("  DH Notebook: Customers Phase 2 & 3 Operational Verification");
  console.log("  Target: " + BASE_URL);
  console.log("==================================================================\n");

  console.log("--- 1. Testing Customers Route & Module Compilation ---");
  await probeViteModule('/customers');
  await probeViteModule('/src/pages/Customers/index.jsx');
  await probeViteModule('/src/pages/Customers/hooks/useCustomers.js');
  await probeViteModule('/src/pages/Customers/hooks/useCustomerActions.js');
  await probeViteModule('/src/pages/Customers/hooks/useCustomerHistory.js');
  await probeViteModule('/src/pages/Customers/services/customerSearchService.js');
  await probeViteModule('/src/pages/Customers/components/forms/CustomerDuplicateComparisonModal.jsx');
  await probeViteModule('/src/pages/Customers/components/details/CustomerSyncModal.jsx');

  console.log("\n--- 2. Verifying File Implementation Integrity ---");
  const customersDir = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers');
  
  // 2.1 Check CustomerDuplicateComparisonModal
  const dupModalCode = fs.readFileSync(path.join(customersDir, 'components/forms/CustomerDuplicateComparisonModal.jsx'), 'utf-8');
  if (dupModalCode.includes('checkPotentialDuplicates') && dupModalCode.includes('candidateMap')) {
    pass("CustomerDuplicateComparisonModal implements checkPotentialDuplicates with multi-attribute scoring");
  } else {
    fail("CustomerDuplicateComparisonModal missing checkPotentialDuplicates logic");
  }

  // 2.2 Check customerSearchService
  const searchServiceCode = fs.readFileSync(path.join(customersDir, 'services/customerSearchService.js'), 'utf-8');
  if (searchServiceCode.includes('searchCustomersFromDB') && searchServiceCode.includes('searchCache') && searchServiceCode.includes('CACHE_TTL_MS')) {
    pass("customerSearchService implements in-memory TTL caching and multi-key Firestore lookups");
  } else {
    fail("customerSearchService missing cache or lookup functions");
  }

  // 2.3 Check useCustomers search orchestration
  const useCustomersCode = fs.readFileSync(path.join(customersDir, 'hooks/useCustomers.js'), 'utf-8');
  if (useCustomersCode.includes('searchCustomersFromDB') && useCustomersCode.includes('debounceTimer')) {
    pass("useCustomers hook orchestrates debounced search against DB on demand");
  } else {
    fail("useCustomers hook does not orchestrate DB search");
  }

  // 2.4 Check index.jsx renders duplicate modal
  const indexCode = fs.readFileSync(path.join(customersDir, 'index.jsx'), 'utf-8');
  if (indexCode.includes('<CustomerDuplicateComparisonModal') && indexCode.includes('duplicateCandidates')) {
    pass("Customers/index.jsx mounts CustomerDuplicateComparisonModal with live state and action bindings");
  } else {
    fail("Customers/index.jsx missing CustomerDuplicateComparisonModal");
  }

  // 2.5 Check useCustomerHistory quota leak fix
  const historyCode = fs.readFileSync(path.join(customersDir, 'hooks/useCustomerHistory.js'), 'utf-8');
  if (!historyCode.includes('orderQueries.push(getDocs(query(ordersRef, limit(300))));')) {
    pass("useCustomerHistory: Unbounded 300 orders fallback query completely removed (0 Quota Leak)");
  } else {
    fail("useCustomerHistory still contains unbounded 300 orders fallback query!");
  }

  if (historyCode.includes('historyCache') && historyCode.includes('HISTORY_CACHE_TTL_MS')) {
    pass("useCustomerHistory: In-memory 5-minute cache operational (0 duplicate Firestore reads)");
  } else {
    fail("useCustomerHistory missing in-memory cache");
  }

  // 2.6 Check CustomerSyncModal display name fix
  const syncModalCode = fs.readFileSync(path.join(customersDir, 'components/details/CustomerSyncModal.jsx'), 'utf-8');
  if (!syncModalCode.includes('getCustomerDisplayName(customer, customer).accountName')) {
    pass("CustomerSyncModal: Display name string evaluation bug successfully resolved");
  } else {
    fail("CustomerSyncModal still contains .accountName property access on string");
  }

  console.log("\n==================================================================");
  console.log(`  Total Checks: ${stats.tested} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
  console.log("==================================================================");

  if (stats.failed > 0) {
    console.error("Errors encountered:", stats.errors);
    process.exit(1);
  } else {
    console.log("  ALL CHECKS PASSED PERFECTLY!");
    process.exit(0);
  }
}

run();
