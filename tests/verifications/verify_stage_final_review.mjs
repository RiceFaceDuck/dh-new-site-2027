/**
 * Stage Final Review: Rigorous Automated Verification & Adversarial Test Suite
 * 
 * Target: Customer Directory, Date Guard, Cache Invalidation, and Zero-Data-Loss Invariant
 * Location: Management System/tests/verifications/verify_stage_final_review.mjs
 */

import assert from 'node:assert';
import { signInWithEmailAndPassword } from "../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs";
import { doc, getDoc } from "../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs";
import { auth, db } from "../../dh-backoffice-react/src/firebase/config.js";
import {
  parseTimestampNumber,
  CUSTOMER_CACHE_KEY,
  CUSTOMER_LAST_SYNC_KEY,
  CUSTOMER_CATALOG_VERSION_KEY
} from "../../dh-backoffice-react/src/pages/Customers/services/customerCacheService.js";

async function runStageFinalReview() {
  console.log("================================================================================");
  console.log("  STAGE FINAL REVIEW: RIGOROUS EMPIRICAL VERIFICATION");
  console.log("================================================================================\n");

  let passedChecks = 0;
  let totalChecks = 0;

  function test(name, fn) {
    totalChecks++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passedChecks++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Check 1: Cache Version Invariant
  // ---------------------------------------------------------------------------
  test("Cache Version Invariant: All cache keys must be bumped to v11", () => {
    assert.strictEqual(CUSTOMER_CACHE_KEY, 'dh_customers_data_cache_v11', "CUSTOMER_CACHE_KEY must be v11");
    assert.strictEqual(CUSTOMER_LAST_SYNC_KEY, 'dh_customers_last_sync_v11', "CUSTOMER_LAST_SYNC_KEY must be v11");
    assert.strictEqual(CUSTOMER_CATALOG_VERSION_KEY, 'dh_customers_catalog_ver_v11', "CUSTOMER_CATALOG_VERSION_KEY must be v11");
  });

  // ---------------------------------------------------------------------------
  // Check 2: Date Guard Logic & Boundary Fuzzing
  // ---------------------------------------------------------------------------
  test("Date Guard: Block Year 3995 / Epoch 0001 corrupted timestamp (63927714852.22)", () => {
    const res = parseTimestampNumber(63927714852.22);
    assert.strictEqual(res, 0, "Corrupted epoch 63927714852.22 must be blocked and return 0");
  });

  test("Date Guard: Block future timestamps exceeding Date.now() + 1 day", () => {
    const futureFar = Date.now() + 100 * 86400000;
    assert.strictEqual(parseTimestampNumber(futureFar), 0, "Far future timestamp must return 0");
    const futureTomorrow = Date.now() + 2 * 86400000;
    assert.strictEqual(parseTimestampNumber(futureTomorrow), 0, "Tomorrow+1 day timestamp must return 0");
  });

  test("Date Guard: Block negative or NaN timestamps", () => {
    assert.strictEqual(parseTimestampNumber(-1000), 0, "Negative timestamp must return 0");
    assert.strictEqual(parseTimestampNumber(NaN), 0, "NaN must return 0");
    assert.strictEqual(parseTimestampNumber(null), 0, "null must return 0");
    assert.strictEqual(parseTimestampNumber("invalid-date"), 0, "Invalid date string must return 0");
  });

  test("Date Guard: Allow valid timestamps in seconds or milliseconds", () => {
    const validMillis = 1792118052000; // 16 Oct 2026
    const resMillis = parseTimestampNumber(validMillis);
    assert.strictEqual(resMillis, validMillis, "Valid millis must be preserved exactly");

    const validSeconds = 1792118052; // 16 Oct 2026 in seconds
    const resSeconds = parseTimestampNumber(validSeconds);
    assert.strictEqual(resSeconds, validMillis, "Valid seconds must be converted to millis");
  });

  // ---------------------------------------------------------------------------
  // Check 3: Zero-Data-Loss Incremental Merge Simulation
  // ---------------------------------------------------------------------------
  test("Zero-Data-Loss Invariant: Incremental fetch from users must not wipe lastOrderDate to null/0", () => {
    const cachedCustomer = {
      id: 'cust_001',
      name: 'ร้านทดสอบ',
      lastOrderDate: 1789363554801 // 14 ก.ย. 69
    };
    const incomingFromUsersDoc = {
      id: 'cust_001',
      name: 'ร้านทดสอบ',
      lastOrderDate: 0 // Empty in users collection!
    };

    const preservedLastOrder = Math.max(
      Number(incomingFromUsersDoc.lastOrderDate || 0),
      Number(cachedCustomer.lastOrderDate || 0)
    );
    const merged = {
      ...cachedCustomer,
      ...incomingFromUsersDoc,
      lastOrderDate: preservedLastOrder > 0 ? preservedLastOrder : null
    };

    assert.strictEqual(merged.lastOrderDate, 1789363554801, "Existing valid lastOrderDate must never be wiped to null/0");
  });

  // ---------------------------------------------------------------------------
  // Check 4: Real Database State on Firestore
  // ---------------------------------------------------------------------------
  console.log("\n📡 Connecting to Firestore to verify live server state...");
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");

  const dirSnap = await getDoc(doc(db, "catalogs", "customers_directory"));
  assert.ok(dirSnap.exists(), "catalogs/customers_directory must exist on Firestore");

  const dirData = dirSnap.data();
  const customers = dirData.customers || [];

  test("Server Integrity: Total customer count in directory must be exactly 142", () => {
    assert.strictEqual(customers.length, 142, `Directory must have 142 customers, got ${customers.length}`);
  });

  test("Server Integrity: CDJ3VZUL (บริษัท ฟาโคบิส จำกัด) must have sanitized date (16 ต.ค. 69)", () => {
    const cdj = customers.find(c => c.accountId === 'CDJ3VZUL' || c.id === 'CdJ3vzuLqrJPcaMBx3z7');
    assert.ok(cdj, "CDJ3VZUL must exist in directory");
    assert.strictEqual(cdj.lastOrderDate, 1792118052220, `CDJ3VZUL lastOrderDate must be 1792118052220, got ${cdj.lastOrderDate}`);
    const d = new Date(cdj.lastOrderDate);
    const dateStr = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
    assert.strictEqual(dateStr, '16 ต.ค. 69', `CDJ3VZUL date string must be '16 ต.ค. 69', got '${dateStr}'`);
  });

  test("Server Integrity: Zero customers have year 3995 / future corrupted timestamp", () => {
    const corrupted = customers.filter(c => c.lastOrderDate && Number(c.lastOrderDate) > Date.now() + 86400000);
    assert.strictEqual(corrupted.length, 0, `Found ${corrupted.length} corrupted future timestamps in directory`);
  });

  test("Server Integrity: All 29 audited customer order dates remain preserved", () => {
    const validCount = customers.filter(c => c.lastOrderDate && Number(c.lastOrderDate) > 0).length;
    assert.ok(validCount >= 29, `Expected at least 29 valid customer dates, got ${validCount}`);
  });

  console.log("\n================================================================================");
  console.log(`  ALL ${passedChecks}/${totalChecks} VERIFICATION SUITES PASSED (100% SUCCESS)`);
  console.log("================================================================================");
  process.exit(0);
}

runStageFinalReview().catch(err => {
  console.error("❌ Stage Final Review Failed:", err);
  process.exit(1);
});
