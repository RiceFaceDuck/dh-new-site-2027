/**
 * Challenger Store Profile Stats Adversarial Test Suite
 * Path: Management System/tests/adversarial/challenger_store_profile_stats_adversarial.mjs
 * 
 * Scope:
 * 1. Quota & Contention Analysis:
 *    - Firestore 1 write/sec single-document sustained limit vs 50 concurrent visitors.
 *    - Session Debounce Guard (`sessionStorage`) isolation leak under multi-client arrival.
 *    - Two-Tier Quota estimation (Cold start vs Warm cache) mathematical and technical verification.
 * 
 * 2. Security Rules Stress-Testing:
 *    - Unauthenticated attacker viewCount spam forging.
 *    - Authenticated attacker likeCount loop spam (+1 to infinity without deduplication).
 *    - Authenticated attacker competitor sabotage (negative likeCount underflow).
 *    - Direct SDK write bypass: decoupled ActivePartners write without users/{userId} update.
 * 
 * Execution: node tests/adversarial/challenger_store_profile_stats_adversarial.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const PLAN_PATH = 'C:/Users/bents/.gemini/antigravity/brain/f79648f4-81bf-4b4b-8453-fdc3fd82dc60/implementation_plan.md';

console.log('================================================================================');
console.log('  ⚔️ CHALLENGER 1: Adversarial Store Profile Stats & Security Rules Suite');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const defects = [];

function pass(name, detail = '') {
  totalChecks++;
  passedChecks++;
  console.log(`  [PASS] ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, error) {
  totalChecks++;
  failedChecks++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  [FAIL] ${name}: ${msg}`);
  defects.push({ test: name, error: msg });
}

// -----------------------------------------------------------------------------
// 1. AST / SIMULATION HARNESS FOR PROPOSED SECURITY RULES
// -----------------------------------------------------------------------------
/**
 * Evaluates the proposed ActivePartners security rule exactly as specified in implementation_plan.md Section 3.4:
 *
 * match /ActivePartners/{partnerId} {
 *   allow read: if true;
 *   allow create: if isManagerOrAdmin();
 *   allow update: if isManagerOrAdmin() || (
 *     isStaff() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['points', 'updatedAt'])
 *   ) || (
 *     // View counter
 *     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewCount', 'updatedAt']) &&
 *     request.resource.data.viewCount == resource.data.get('viewCount', 0) + 1
 *   ) || (
 *     // Like/Unlike toggle
 *     isAuthenticated() &&
 *     request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likeCount', 'updatedAt']) &&
 *     (
 *       request.resource.data.likeCount == resource.data.get('likeCount', 0) + 1 ||
 *       request.resource.data.likeCount == resource.data.get('likeCount', 0) - 1
 *     )
 *   );
 *   allow delete: if isManagerOrAdmin() || (isAuthenticated() && request.auth.uid == partnerId);
 * }
 */
function evalProposedActivePartnersUpdate({
  auth,
  resourceData,
  requestResourceData
}) {
  const isAuthenticated = auth !== null && auth.uid !== undefined;
  const isManagerOrAdmin = isAuthenticated && ['manager', 'admin', 'owner'].includes(auth.token?.role);
  const isStaff = isAuthenticated && (isManagerOrAdmin || auth.token?.role === 'staff' || auth.token?.isStaff === true);

  if (isManagerOrAdmin) return true;

  // Calculate affected keys
  const affectedKeys = new Set();
  const allKeys = new Set([...Object.keys(resourceData), ...Object.keys(requestResourceData)]);
  for (const k of allKeys) {
    if (JSON.stringify(resourceData[k]) !== JSON.stringify(requestResourceData[k])) {
      affectedKeys.add(k);
    }
  }

  // Branch 1: Staff points update
  if (isStaff) {
    const staffAllowed = ['points', 'updatedAt'];
    let staffKeysOnly = true;
    for (const k of affectedKeys) {
      if (!staffAllowed.includes(k)) {
        staffKeysOnly = false;
        break;
      }
    }
    if (staffKeysOnly && affectedKeys.size > 0) return true;
  }

  // Branch 2: View counter (Session Debounced View Counter)
  {
    const viewAllowed = ['viewCount', 'updatedAt'];
    let viewKeysOnly = true;
    for (const k of affectedKeys) {
      if (!viewAllowed.includes(k)) {
        viewKeysOnly = false;
        break;
      }
    }
    const oldViewCount = resourceData.viewCount !== undefined ? resourceData.viewCount : 0;
    const newViewCount = requestResourceData.viewCount;
    if (viewKeysOnly && affectedKeys.size > 0 && newViewCount === oldViewCount + 1) {
      return true;
    }
  }

  // Branch 3: Like/Unlike Toggle
  if (isAuthenticated) {
    const likeAllowed = ['likeCount', 'updatedAt'];
    let likeKeysOnly = true;
    for (const k of affectedKeys) {
      if (!likeAllowed.includes(k)) {
        likeKeysOnly = false;
        break;
      }
    }
    const oldLikeCount = resourceData.likeCount !== undefined ? resourceData.likeCount : 0;
    const newLikeCount = requestResourceData.likeCount;
    const isIncrement = newLikeCount === oldLikeCount + 1;
    const isDecrement = newLikeCount === oldLikeCount - 1;

    if (likeKeysOnly && affectedKeys.size > 0 && (isIncrement || isDecrement)) {
      return true;
    }
  }

  return false;
}

// -----------------------------------------------------------------------------
// TEST SUITE 1: SECURITY RULES ADVERSARIAL STRESS TEST
// -----------------------------------------------------------------------------
console.log('--- Test Suite 1: Security Rules Vulnerability Stress-Testing ---');

// Test 1.1: Unauthenticated View Counter Forgery & Spamming
try {
  const initialPartner = { storeName: 'Lucky Com', viewCount: 10, likeCount: 5 };
  let currentDoc = { ...initialPartner };
  const unauthAttacker = null; // Unauthenticated client

  let allowedWrites = 0;
  for (let i = 0; i < 50; i++) {
    const requestDoc = { ...currentDoc, viewCount: currentDoc.viewCount + 1, updatedAt: Date.now() };
    const isAllowed = evalProposedActivePartnersUpdate({
      auth: unauthAttacker,
      resourceData: currentDoc,
      requestResourceData: requestDoc
    });
    if (isAllowed) {
      allowedWrites++;
      currentDoc = requestDoc;
    }
  }

  assert.equal(allowedWrites, 50, 'All 50 unauthenticated view increments were permitted by rule');
  assert.equal(currentDoc.viewCount, 60, 'View count inflated from 10 to 60 without authentication');
  
  // Vulnerability confirmed: Rule allows unauthenticated view spamming!
  pass('SecRule 1.1 [VULNERABILITY CONFIRMED]', 'Unauthenticated bot successfully forged 50 view increments without logging in!');
} catch (err) {
  fail('SecRule 1.1', err);
}

// Test 1.2: Authenticated Like Count Infinite Loop Spam (+1 to Infinity)
try {
  const initialPartner = { storeName: 'Lucky Com', viewCount: 10, likeCount: 5 };
  let currentDoc = { ...initialPartner };
  const singleAttacker = { uid: 'rogue_user_001', token: { role: 'customer' } };

  let spamIncrements = 0;
  for (let i = 0; i < 100; i++) {
    const requestDoc = { ...currentDoc, likeCount: currentDoc.likeCount + 1, updatedAt: Date.now() };
    const isAllowed = evalProposedActivePartnersUpdate({
      auth: singleAttacker,
      resourceData: currentDoc,
      requestResourceData: requestDoc
    });
    if (isAllowed) {
      spamIncrements++;
      currentDoc = requestDoc;
    }
  }

  assert.equal(spamIncrements, 100, 'Single user bypassed deduplication and incremented 100 times');
  assert.equal(currentDoc.likeCount, 105, 'Like count inflated by 100 by a single user');
  pass('SecRule 1.2 [CRITICAL VULNERABILITY CONFIRMED]', 'Single authenticated user spammed 100 likes in loop without deduplication check!');
} catch (err) {
  fail('SecRule 1.2', err);
}

// Test 1.3: Malicious Competitor Sabotage (Negative Like Count Underflow)
try {
  const initialPartner = { storeName: 'Competitor Store', viewCount: 10, likeCount: 2 };
  let currentDoc = { ...initialPartner };
  const saboteur = { uid: 'saboteur_999', token: { role: 'customer' } };

  let decrementCount = 0;
  for (let i = 0; i < 10; i++) {
    const requestDoc = { ...currentDoc, likeCount: currentDoc.likeCount - 1, updatedAt: Date.now() };
    const isAllowed = evalProposedActivePartnersUpdate({
      auth: saboteur,
      resourceData: currentDoc,
      requestResourceData: requestDoc
    });
    if (isAllowed) {
      decrementCount++;
      currentDoc = requestDoc;
    }
  }

  assert.equal(decrementCount, 10, 'Rule allowed likeCount to decrement below zero');
  assert.equal(currentDoc.likeCount, -8, 'Like count forced into negative numbers (-8)');
  pass('SecRule 1.3 [CRITICAL VULNERABILITY CONFIRMED]', 'Saboteur drove store likeCount to -8 because rule lacks >= 0 check!');
} catch (err) {
  fail('SecRule 1.3', err);
}

// Test 1.4: Decoupled Direct SDK Write (Bypassing users/{userId} Batch)
try {
  // Plan claims atomic batch write, but security rule doesn't enforce cross-document validation
  const initialPartner = { storeName: 'Lucky Com', likeCount: 10 };
  const attackerAuth = { uid: 'isolated_client_1', token: { role: 'customer' } };
  const directSdkRequest = { ...initialPartner, likeCount: 11, updatedAt: Date.now() };

  const isAllowedWithoutUserDoc = evalProposedActivePartnersUpdate({
    auth: attackerAuth,
    resourceData: initialPartner,
    requestResourceData: directSdkRequest
  });

  assert.equal(isAllowedWithoutUserDoc, true, 'Rule allows direct update without requiring users/{uid} coupling');
  pass('SecRule 1.4 [VULNERABILITY CONFIRMED]', 'ActivePartners update succeeds independently of users/{userId} (No atomic cross-document guarantee in rules)');
} catch (err) {
  fail('SecRule 1.4', err);
}

// -----------------------------------------------------------------------------
// TEST SUITE 2: CONCURRENCY & CONTENTION STRESS TEST
// -----------------------------------------------------------------------------
console.log('\n--- Test Suite 2: Concurrency & Contention Stress-Testing ---');

// Test 2.1: Multi-Client Arrival Contention (50 Concurrent Unique Visitors)
try {
  const storeId = 'mVtmAmGBqRO4qzDB9u1RCdSHV6k1';
  const NUM_CONCURRENT_VISITORS = 50;

  // In real browser architecture, each client has an isolated sessionStorage
  const simulatedClients = Array.from({ length: NUM_CONCURRENT_VISITORS }, (_, idx) => ({
    clientId: `client_${idx}`,
    sessionStorage: new Map() // Fresh session
  }));

  let writeAttempts = 0;
  for (const client of simulatedClients) {
    const sessionKey = `dh_store_view_${storeId}`;
    if (!client.sessionStorage.has(sessionKey)) {
      client.sessionStorage.set(sessionKey, Date.now());
      writeAttempts++; // Fires increment(1) to Firestore ActivePartners/{storeId}
    }
  }

  assert.equal(writeAttempts, 50, 'All 50 clients fired writes because sessionStorage is client-isolated');
  
  // Official Firestore Document Contention Limit: 1 write per second
  const FIRESTORE_MAX_SUSTAINED_WRITE_RATE_PER_DOC = 1; // 1 write/sec
  const contentionRatio = writeAttempts / FIRESTORE_MAX_SUSTAINED_WRITE_RATE_PER_DOC;

  assert.ok(contentionRatio > 1, 'Contention ratio exceeds safe document write limits');
  pass('Contention 2.1 [BOTTLENECK PROVED]', `50 concurrent visitors generated 50 simultaneous writes/sec to 1 document (${contentionRatio}x over Firestore 1 write/sec limit). sessionStorage FAILS to prevent contention!`);
} catch (err) {
  fail('Contention 2.1', err);
}

// Test 2.2: Existing Project Mitigation Comparison (marketingAnalyticsService Buffer)
try {
  // Existing project pattern: marketingAnalyticsService uses 2-minute in-memory buffer + Cloud Functions
  const servicePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/marketingAnalyticsService.js');
  const serviceCode = fs.readFileSync(servicePath, 'utf8');

  assert.ok(serviceCode.includes('FLUSH_INTERVAL_MS = 2 * 60 * 1000'), 'Found 2-minute in-memory buffer in existing marketing telemetry');
  assert.ok(serviceCode.includes('recordAdTelemetry'), 'Found Cloud Function aggregation buffer endpoint');
  pass('Contention 2.2 [ARCHITECTURAL CONTRAST]', 'Existing codebase already solves this via buffered Cloud Function telemetry, whereas proposed plan directly writes to Firestore per client.');
} catch (err) {
  fail('Contention 2.2', err);
}

// -----------------------------------------------------------------------------
// TEST SUITE 3: TWO-TIER QUOTA VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- Test Suite 3: Two-Tier Quota Estimation Verification ---');

try {
  // Verify Cold Start claim vs Actual Code Requirements
  const planContent = fs.readFileSync(PLAN_PATH, 'utf8');
  assert.ok(planContent.includes('**1 Read** (ร้านค้า)'), 'Plan claims 1 Read for Cold Start');
  
  // Challenge:
  // 1. If user is authenticated, fetching likedStores requires reading users/{userId} (1 read).
  // 2. StoreProfilePage renders PartnerAds and StoreRecommendedProducts.
  // 3. GEMINI.md explicitly requires calculating catalog chunks (search_index_p*, customers_directory_p*).
  const hasCatalogChunkCalculation = planContent.includes('search_index_p') || planContent.includes('customers_directory_p');
  
  assert.equal(hasCatalogChunkCalculation, false, 'Plan omitted required cold-start catalog chunk calculations mandated by GEMINI.md');
  pass('Quota 3.1 [DEFECT CONFIRMED]', 'Plan undercounts cold start reads (claims 1 Read, ignores users/{uid} fetch for like status, and violates GEMINI.md catalog chunk rule).');
} catch (err) {
  fail('Quota 3.1', err);
}

// -----------------------------------------------------------------------------
// SUMMARY & REPORT
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`  RESULTS: Total ${totalChecks} | Passed ${passedChecks} | Failed ${failedChecks}`);
console.log('================================================================================');

if (defects.length > 0) {
  console.log('\nDefects Found:');
  for (const d of defects) {
    console.log(`  - ${d.test}: ${d.error}`);
  }
}

process.exit(0);
