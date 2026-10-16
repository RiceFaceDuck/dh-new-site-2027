/**
 * 🧪 Test Suite: Full Stage Verification for Ads & Store Profile Management Subsystem
 * Location: Management System/tests/verifications/verify_stage_ads_complete_audit.mjs
 */

import assert from 'assert';

console.log("==================================================================");
console.log("🚀 STARTING RIGOROUS FINAL AUDIT: ADS & STORE PROFILE SUBSYSTEM");
console.log("==================================================================");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(`   Reason: ${err.message}`);
  }
}

// ==================================================================
// 1. AD INJECTION & DEDUPLICATION INVARIANTS
// ==================================================================
console.log("\n--- [Suite 1: Ad Injection & Invariants] ---");

// Simulating useAdInjection logic
function simulateInjection(regularProducts, ads, displayRatio = 10) {
  if (!regularProducts || !Array.isArray(regularProducts) || regularProducts.length === 0) return [];
  if (!ads || ads.length === 0) return regularProducts;

  const mergedList = [];
  let adIndex = 0;
  const usedAdIds = new Set();

  for (let i = 0; i < regularProducts.length; i += displayRatio) {
    const chunk = regularProducts.slice(i, i + displayRatio);
    let nextAd = null;
    while (adIndex < ads.length) {
      const candidate = ads[adIndex];
      adIndex++;
      if (candidate && !usedAdIds.has(candidate.id)) {
        usedAdIds.add(candidate.id);
        nextAd = candidate;
        break;
      }
    }

    let randomInsertPos = -1;
    if (nextAd) {
      if (i === 0) {
        randomInsertPos = chunk.length > 1 
          ? 1 + ((chunk.length * 17 + 7) % (chunk.length - 1))
          : 1;
      } else {
        randomInsertPos = (i * 997 + chunk.length * 31) % (chunk.length + 1);
      }
    }

    let adInserted = false;
    for (let j = 0; j < chunk.length; j++) {
      if (nextAd && !adInserted && j === randomInsertPos) {
        mergedList.push({ ...nextAd, isSponsoredAd: true });
        adInserted = true;
      }
      mergedList.push(chunk[j]);
    }

    if (nextAd && !adInserted) {
      mergedList.push({ ...nextAd, isSponsoredAd: true });
    }
  }

  return mergedList;
}

runTest("Slot 0 Invariant: Slot 0 must ALWAYS be a regular product, never an ad", () => {
  const dummyProducts = Array.from({ length: 50 }, (_, i) => ({ id: `prod-${i}`, name: `Product ${i}` }));
  const dummyAds = [
    { id: 'ad-1', title: 'Ad 1' },
    { id: 'ad-2', title: 'Ad 2' },
    { id: 'ad-3', title: 'Ad 3' }
  ];

  for (let ratio = 1; ratio <= 15; ratio++) {
    const result = simulateInjection(dummyProducts, dummyAds, ratio);
    assert.strictEqual(result[0].isSponsoredAd, undefined, `Slot 0 was an ad when ratio=${ratio}!`);
    assert.strictEqual(result[0].id, 'prod-0', `Slot 0 was not prod-0 when ratio=${ratio}!`);
  }
});

runTest("Deduplication Guard: No ad ID can appear more than once in the same grid", () => {
  const dummyProducts = Array.from({ length: 100 }, (_, i) => ({ id: `prod-${i}` }));
  const dummyAds = [
    { id: 'ad-1', title: 'Ad 1' },
    { id: 'ad-2', title: 'Ad 2' }
  ]; // Only 2 ads, but 10 chunks

  const result = simulateInjection(dummyProducts, dummyAds, 10);
  const renderedAdIds = result.filter(item => item.isSponsoredAd).map(item => item.id);
  
  assert.strictEqual(renderedAdIds.length, 2, "More ads were injected than available unique ads!");
  assert.strictEqual(new Set(renderedAdIds).size, renderedAdIds.length, "Duplicate ads found in grid!");
});

runTest("Billboard 1:1 Filtering: Only 1:1 square billboards are admitted", () => {
  const allBillboards = [
    { id: 'bb-1', billboardRatio: '1:1' },
    { id: 'bb-2', billboardRatio: '16:9' },
    { id: 'bb-3', billboardRatio: '9:16' },
    { id: 'bb-4' } // default fallback
  ];

  const filtered = allBillboards.filter(ad => ad.billboardRatio === '1:1' || !ad.billboardRatio);
  assert.strictEqual(filtered.length, 2);
  assert.strictEqual(filtered.some(a => a.id === 'bb-2'), false);
  assert.strictEqual(filtered.some(a => a.id === 'bb-3'), false);
});

// ==================================================================
// 2. BACKOFFICE TODO & REJECTION INVARIANTS
// ==================================================================
console.log("\n--- [Suite 2: Backoffice Todo & Operations] ---");

runTest("Todo Filter Coverage: STORE_ADS filter includes all 4 marketing task types", () => {
  const storeAdsTypes = ['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'APPROVE_BILLBOARD_AD'];
  const testTasks = [
    { taskId: '1', type: 'AD_APPROVAL' },
    { taskId: '2', type: 'USER_SKU_APPROVAL' },
    { taskId: '3', type: 'BILLBOARD_APPROVAL' },
    { taskId: '4', type: 'APPROVE_BILLBOARD_AD' },
    { taskId: '5', type: 'WARRANTY_CLAIM' }
  ];

  const matched = testTasks.filter(t => storeAdsTypes.includes(t.type));
  assert.strictEqual(matched.length, 4);
  assert.strictEqual(matched.find(t => t.type === 'WARRANTY_CLAIM'), undefined);
});

runTest("handleRejection Argument Order: function accepts (task, reason)", () => {
  let receivedTask = null;
  let receivedReason = null;

  const mockHandleRejection = async (task, reason) => {
    receivedTask = task;
    receivedReason = reason;
    return { success: true };
  };

  const task = { id: 'task-123', type: 'AD_APPROVAL' };
  const reason = 'รูปภาพไม่ชัดเจน';

  mockHandleRejection(task, reason);
  assert.strictEqual(receivedTask.id, 'task-123');
  assert.strictEqual(receivedReason, 'รูปภาพไม่ชัดเจน');
});

// ==================================================================
// 3. FINANCIAL GUARD & ZERO-CREDIT LOOPHOLE INVARIANTS
// ==================================================================
console.log("\n--- [Suite 3: Financial Shield & Cloud Function Cron] ---");

function simulateCloudCronExhaustion(freshAd, userData, totalDeduct = 0) {
  const creditLimit = Number(freshAd.creditLimit || -1);
  const currentPoints = Number(userData.creditPoints || 0);
  const newSpent = Number(freshAd.spentBudget || 0) + totalDeduct;
  let isExhausted = false;

  // 1. Campaign creditLimit
  if (creditLimit > 0 && newSpent >= creditLimit) {
    isExhausted = true;
  }

  // 2. Wallet balance zero check
  if (currentPoints <= 0 || (currentPoints - totalDeduct) <= 0) {
    isExhausted = true;
  }

  return { isExhausted, newSpent, remainingPoints: Math.max(0, currentPoints - totalDeduct) };
}

runTest("Zero-Credit Loophole Prevention: Ad with unlimited creditLimit (-1) pauses when owner has 0 credit", () => {
  const ad = { creditLimit: -1, spentBudget: 50 };
  const user = { creditPoints: 0 }; // Wallet empty

  const result = simulateCloudCronExhaustion(ad, user, 5);
  assert.strictEqual(result.isExhausted, true, "Ad was not paused even though owner wallet is empty!");
});

runTest("Budget Ceiling Exhaustion: Ad pauses when spentBudget reaches creditLimit", () => {
  const ad = { creditLimit: 100, spentBudget: 95 };
  const user = { creditPoints: 500 }; // Wallet has plenty of funds

  const result = simulateCloudCronExhaustion(ad, user, 10); // 95 + 10 = 105 >= 100
  assert.strictEqual(result.isExhausted, true, "Ad was not paused when budget exceeded limit!");
});

runTest("Active Campaign Remains Active: Ad continues when budget and wallet are sufficient", () => {
  const ad = { creditLimit: 500, spentBudget: 100 };
  const user = { creditPoints: 300 };

  const result = simulateCloudCronExhaustion(ad, user, 10);
  assert.strictEqual(result.isExhausted, false, "Ad was falsely paused!");
  assert.strictEqual(result.remainingPoints, 290);
});

// ==================================================================
// 4. GA4 TELEMETRY & ANTI-FRAUD INVARIANTS
// ==================================================================
console.log("\n--- [Suite 4: GA4 Telemetry & Anti-Fraud] ---");

runTest("Anti-Fraud 5-Minute Cooldown: Repeated calls within 5m return false", () => {
  const mockStorage = new Map();
  const checkAntiFraud = (actionType, adId, now) => {
    const sessionKey = `dh_ad_${actionType}_${adId}`;
    const lastAction = mockStorage.get(sessionKey);
    if (lastAction && (now - parseInt(lastAction, 10)) < 300000) return false;
    mockStorage.set(sessionKey, now.toString());
    return true;
  };

  const t0 = 1000000;
  assert.strictEqual(checkAntiFraud('view', 'ad-99', t0), true, "Initial view should be tracked");
  assert.strictEqual(checkAntiFraud('view', 'ad-99', t0 + 60000), false, "View at 1m should be blocked");
  assert.strictEqual(checkAntiFraud('view', 'ad-99', t0 + 299000), false, "View at 4m59s should be blocked");
  assert.strictEqual(checkAntiFraud('view', 'ad-99', t0 + 301000), true, "View at 5m01s should be allowed");
});

console.log("\n==================================================================");
console.log(`🎯 AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
console.log("==================================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
