import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "../../dh-backoffice-react/node_modules/firebase/app/dist/index.mjs";
import { getAuth, signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { getFirestore, doc, getDoc } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('🔍 [Last Order Independence Verification] Running verification checks...');

// 1. Verify customerCacheService.js
const cacheServicePath = path.join(projectRoot, 'dh-backoffice-react/src/pages/Customers/services/customerCacheService.js');
const cacheServiceContent = fs.readFileSync(cacheServicePath, 'utf8');

assert(
  cacheServiceContent.includes('export const parseTimestampNumber ='),
  'customerCacheService.js exports parseTimestampNumber helper'
);

assert(
  cacheServiceContent.includes('lastOrderDate: parseTimestampNumber(item.lastOrderDate || item.stats?.lastOrderDate || 0)'),
  'customerCacheService.js normalizes lastOrderDate in fetchCustomerDirectoryChunk'
);

assert(
  cacheServiceContent.includes('resolvedLastOrder = Math.max(currentLastOrder, parsedMatchDate)'),
  'customerCacheService.js preserves all-time lastOrderDate in applyActiveStatsDelta and never downgrades it'
);

// 2. Verify billingTransactionService.js
const billingServicePath = path.join(projectRoot, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
const billingServiceContent = fs.readFileSync(billingServicePath, 'utf8');

assert(
  billingServiceContent.includes('lastOrderDate: serverTimestamp()') &&
  billingServiceContent.includes('lastOrderId: finalOrderId'),
  'billingTransactionService.js updates customer lastOrderDate and lastOrderId in transaction'
);

// 3. Verify nightlyChunkGuard.js
const nightlyGuardPath = path.join(projectRoot, 'functions/inventory/nightlyChunkGuard.js');
const nightlyGuardContent = fs.readFileSync(nightlyGuardPath, 'utf8');

assert(
  nightlyGuardContent.includes('ordersSnap.forEach(oDoc =>') &&
  nightlyGuardContent.includes('customerLastOrderMap.set(uid, orderTime)'),
  'nightlyChunkGuard.js aggregates orders to calculate customer latest order dates'
);

// 4. Verify Firestore catalogs/customers_directory data
const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
const dirSnap = await getDoc(doc(db, "catalogs", "customers_directory"));
assert(dirSnap.exists(), 'catalogs/customers_directory exists in Firestore');

const customers = dirSnap.data()?.customers || [];
assert(customers.length === 40, `Directory contains all 40 customers (got ${customers.length})`);

const customersWithOrders = customers.filter(c => c.lastOrderDate && c.lastOrderDate > 0);
assert(
  customersWithOrders.length === 28,
  `Exactly 28 customers with verified orders have lastOrderDate populated (got ${customersWithOrders.length})`
);

const customersWithoutOrders = customers.filter(c => !c.lastOrderDate || c.lastOrderDate === 0);
assert(
  customersWithoutOrders.length === 12,
  `Exactly 12 customers with zero orders have blank/null lastOrderDate (got ${customersWithoutOrders.length})`
);

// Spot check Kwan oneself IT SHOP (GHUE8VJZ)
const kwan = customers.find(c => c.accountId === 'GHUE8VJZ');
assert(
  kwan && kwan.lastOrderDate === 1784702073557,
  `Kwan oneself IT SHOP (GHUE8VJZ) has correct lastOrderDate (22 Jul 2026: ${kwan?.lastOrderDate})`
);

// Spot check KSS SERVICE (7R4DRCSS)
const kss = customers.find(c => c.accountId === '7R4DRCSS');
assert(
  kss && kss.lastOrderDate === 1788237759651,
  `KSS SERVICE (7R4DRCSS) has correct lastOrderDate (01 Sep 2026: ${kss?.lastOrderDate})`
);

// Spot check zero-order customer 6IYCVRM2
const zeroCust = customers.find(c => c.accountId === '6IYCVRM2');
assert(
  zeroCust && (!zeroCust.lastOrderDate || zeroCust.lastOrderDate === 0),
  `Zero-order customer 6IYCVRM2 has null/0 lastOrderDate`
);

console.log(`\n======================================================`);
console.log(`Last Order Independence Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`======================================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
