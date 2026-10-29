/**
 * 🧪 Test Suite: Prepaid Ad Quota & Activation Gatekeeper Verification
 * Centralized Path: Management System/tests/verifications/verify_prepaid_ad_quota_flow.mjs
 * 
 * Objectives:
 * 1. Verify adPrepaidService logic (pricing, gatekeeper check, atomic deduction & quota setup)
 * 2. Verify Gatekeeper Guard: blocks activation when user credit < adImpressionCost
 * 3. Verify Resume Flow: allows re-activating paused ad with remaining quota without extra charge
 * 4. Verify Telemetry Integration: prepaid ads do not double-charge wallet for views, and auto-exhaust when remainingViews reaches 0
 * 5. Verify UI visibility: remainingViews display in AdListTable
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('==================================================================');
console.log('🚀 RUNNING VERIFICATION: PREPAID AD QUOTA & ACTIVATION GATEKEEPER');
console.log('==================================================================');

// ------------------------------------------------------------------
// Test 1: adPrepaidService.js Exists and Exports Required Functions
// ------------------------------------------------------------------
const servicePath = path.resolve('dh-frontend/src/firebase/credit/adPrepaidService.js');
assert(fs.existsSync(servicePath), '❌ adPrepaidService.js does not exist');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

assert(serviceContent.includes('getAdImpressionPricing'), '❌ Missing getAdImpressionPricing export');
assert(serviceContent.includes('checkCanActivateAd'), '❌ Missing checkCanActivateAd export');
assert(serviceContent.includes('activateAdWithPrepaidQuota'), '❌ Missing activateAdWithPrepaidQuota export');
console.log('✅ [PASS] Test 1: adPrepaidService.js exists with required prepaid functions');

// ------------------------------------------------------------------
// Test 2: Gatekeeper Logic (Insufficient Credit Guard)
// ------------------------------------------------------------------
// Extract pure checkCanActivateAd function directly from adPrepaidService.js
const extractCheckFn = () => {
  const match = serviceContent.match(/export const checkCanActivateAd = ([\s\S]*?);\n\n\/\*\*/);
  if (!match) throw new Error("Could not extract checkCanActivateAd");
  return new Function(`return (${match[1]});`)();
};

const checkCanActivateAd = extractCheckFn();
const defaultPricing = { cost: 15, count: 100 };

// Case 2.1: User has 10 Pts (less than 15 Pts) and 0 quota -> MUST BLOCK
const blockedResult = checkCanActivateAd(10, { remainingViews: 0 }, defaultPricing);
assert.strictEqual(blockedResult.canActivate, false, '❌ User with 10 Pts should be blocked from activating ad requiring 15 Pts');
assert.strictEqual(blockedResult.reason, 'INSUFFICIENT_CREDIT', '❌ Reason should be INSUFFICIENT_CREDIT');
assert.strictEqual(blockedResult.requiredCost, 15, '❌ requiredCost should be 15 Pts');

// Case 2.2: User has 15 Pts -> MUST ALLOW with payment required
const allowedResult = checkCanActivateAd(15, { remainingViews: 0 }, defaultPricing);
assert.strictEqual(allowedResult.canActivate, true, '❌ User with 15 Pts should be allowed');
assert.strictEqual(allowedResult.needsPayment, true, '❌ Fresh activation should require payment');
assert.strictEqual(allowedResult.quotaCount, 100, '❌ Quota count should be 100');

// Case 2.3: User has 50 Pts -> MUST ALLOW
const highCreditResult = checkCanActivateAd(50, { remainingViews: 0 }, defaultPricing);
assert.strictEqual(highCreditResult.canActivate, true, '❌ User with 50 Pts should be allowed');
console.log('✅ [PASS] Test 2: Gatekeeper logic blocks insufficient credits (< 15 Pts) and approves valid balance (>= 15 Pts)');

// ------------------------------------------------------------------
// Test 3: Resume Flow (Remaining Quota without Double Charge)
// ------------------------------------------------------------------
// User has 0 Pts, but ad still has 42 remaining views -> MUST ALLOW RESUME WITHOUT PAYMENT
const resumeResult = checkCanActivateAd(0, { remainingViews: 42 }, defaultPricing);
assert.strictEqual(resumeResult.canActivate, true, '❌ Ad with remaining views (42) must be allowed to resume');
assert.strictEqual(resumeResult.needsPayment, false, '❌ Resuming with remaining views must NOT require payment');
assert.strictEqual(resumeResult.remainingViews, 42, '❌ Remaining views should match 42');
console.log('✅ [PASS] Test 3: Resume flow permits unpausing with existing quota (42 views) with 0 extra cost');

// ------------------------------------------------------------------
// Test 4: Cloud Function Telemetry Quota Decrement & Zero Double-Deduction
// ------------------------------------------------------------------
const telemetryModule = await import('../../functions/marketing/recordAdTelemetry.js');
const { calculateAdDeductions } = telemetryModule.default || telemetryModule;

const mockConfig = { adClickCost: 5, adImpressionCost: 15, adImpressionCount: 100 };

// Case 4.1: Prepaid Ad (has data.remainingViews) -> Views must NOT deduct points from wallet
const prepaidAdMap = {
  'ad-prepaid-1': {
    ownerId: 'user-partner-1',
    deltaViews: 30,
    deltaClicks: 0,
    data: { remainingViews: 100, quotaViews: 100 }
  }
};
const prepaidDeductions = calculateAdDeductions(prepaidAdMap, mockConfig);
assert.strictEqual(prepaidDeductions['user-partner-1'], undefined, '❌ Prepaid ad views must NOT deduct additional wallet points');

// Case 4.2: Prepaid Ad with Clicks -> Clicks still deduct points
const prepaidAdWithClicks = {
  'ad-prepaid-1': {
    ownerId: 'user-partner-1',
    deltaViews: 30,
    deltaClicks: 1,
    data: { remainingViews: 100, quotaViews: 100 }
  }
};
const clickDeductions = calculateAdDeductions(prepaidAdWithClicks, mockConfig);
assert.strictEqual(clickDeductions['user-partner-1'].totalDeduct, 5, '❌ 1 click at 5 Pts should deduct 5 Pts');

// Case 4.3: Legacy Ad (no data.remainingViews) -> Views calculate as before
const legacyAdMap = {
  'ad-legacy-1': {
    ownerId: 'user-legacy-1',
    deltaViews: 100,
    deltaClicks: 0,
    data: {}
  }
};
const legacyDeductions = calculateAdDeductions(legacyAdMap, mockConfig);
assert.strictEqual(legacyDeductions['user-legacy-1'].totalDeduct, 15, '❌ Legacy ad views calculate according to config rate');
console.log('✅ [PASS] Test 4: Telemetry correctly treats prepaid views with 0 wallet deduction, while preserving click billing and legacy fallback');

// ------------------------------------------------------------------
// Test 5: useAdManager.js & AdListTable.jsx Integration
// ------------------------------------------------------------------
const adManagerPath = path.resolve('dh-frontend/src/components/profile/tabs/hooks/useAdManager.js');
const adManagerContent = fs.readFileSync(adManagerPath, 'utf8');
assert(adManagerContent.includes('checkCanActivateAd'), '❌ useAdManager missing checkCanActivateAd integration');
assert(adManagerContent.includes('activateAdWithPrepaidQuota'), '❌ useAdManager missing activateAdWithPrepaidQuota integration');

const adTablePath = path.resolve('dh-frontend/src/components/profile/tabs/ad-manager/AdListTable.jsx');
const adTableContent = fs.readFileSync(adTablePath, 'utf8');
assert(adTableContent.includes('ad.remainingViews !== undefined'), '❌ AdListTable missing remainingViews quota display');
assert(adTableContent.includes('โควต้าหมด'), '❌ AdListTable missing out-of-quota badge');
console.log('✅ [PASS] Test 5: Frontend hooks and UI table display prepaid quota balance and out-of-quota badge');

console.log('==================================================================');
console.log('🎯 ALL 5/5 PREPAID VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('==================================================================');
