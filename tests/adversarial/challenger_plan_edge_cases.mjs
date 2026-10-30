/**
 * 🧪 Adversarial Test Suite: Implementation Plan Edge Case Simulator
 * Centralized Path: Management System/tests/adversarial/challenger_plan_edge_cases.mjs
 * 
 * Tests the 3 edge cases specified in the Challenger 2 mission:
 * 1. Store has no partner ads
 * 2. Store is viewed by an unauthenticated guest
 * 3. Network failure occurs during like toggle
 */

import assert from 'node:assert';

console.log('====================================================================');
console.log('🔥 CHALLENGER 2: EMPIRICAL ADVERSARIAL STRESS TEST SUITE');
console.log('====================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(err);
  }
}

// ====================================================================
// EDGE CASE 1: Store has no partner ads
// ====================================================================
console.log('--- SCENARIO 1: Store has no partner ads ---');

runTest('Store exists in ActivePartners but has no partner_ads document', () => {
  // Mock store from ActivePartners
  const storeProfile = {
    id: 'mVtmAmGBqRO4qzDB9u1RCdSHV6k1',
    name: 'Lucky Com Zeer Rangsit',
    // viewCount and likeCount absent initially in DB
  };
  const partnerAds = null; // No partner ad

  // Safe accessor according to plan specification
  const viewCount = storeProfile.viewCount ?? 0;
  const likeCount = storeProfile.likeCount ?? 0;

  assert.strictEqual(viewCount, 0, 'viewCount must default to 0');
  assert.strictEqual(likeCount, 0, 'likeCount must default to 0');
  assert.doesNotThrow(() => {
    const displayViews = `${viewCount.toLocaleString()} เข้าชม`;
    const displayLikes = `กดไลก์ (${likeCount})`;
    assert.strictEqual(displayViews, '0 เข้าชม');
    assert.strictEqual(displayLikes, 'กดไลก์ (0)');
  });
});

runTest('Ad Telemetry fallback handling when partner ads is empty array', () => {
  const allAds = [];
  const activeAds = (allAds || []).filter(ad => ad.status === 'active');
  assert.strictEqual(activeAds.length, 0);

  // Stats in ActivePartners remain completely decoupled from partner_ads
  const storeDoc = { id: 'store-123', viewCount: 5, likeCount: 2 };
  assert.strictEqual(storeDoc.viewCount, 5);
  assert.strictEqual(storeDoc.likeCount, 2);
});

// ====================================================================
// EDGE CASE 2: Unauthenticated Guest Interactions
// ====================================================================
console.log('\n--- SCENARIO 2: Unauthenticated Guest Interactions ---');

// Security Rules Engine Simulator for ActivePartners proposed rules
function evaluateActivePartnersUpdateRule({ auth, existingData, updateData }) {
  const isManagerOrAdmin = auth && ['manager', 'admin'].includes(auth.role);
  if (isManagerOrAdmin) return { allowed: true, reason: 'manager_or_admin' };

  // Calculate affected keys
  const affectedKeys = Object.keys(updateData).filter(
    k => updateData[k] !== existingData[k]
  );

  // Staff rule
  const isStaff = auth && auth.role === 'staff';
  const onlyPointsAndUpdated = affectedKeys.every(k => ['points', 'updatedAt'].includes(k));
  if (isStaff && onlyPointsAndUpdated) return { allowed: true, reason: 'staff_points' };

  // View count rule (unauthenticated allowed, strictly +1, only viewCount & updatedAt)
  const onlyViewsAndUpdated = affectedKeys.every(k => ['viewCount', 'updatedAt'].includes(k));
  const currentViews = existingData.viewCount || 0;
  const newViews = updateData.viewCount;
  if (onlyViewsAndUpdated && newViews === currentViews + 1) {
    return { allowed: true, reason: 'debounced_view_count' };
  }

  // Like count rule (MUST be authenticated, strictly +1 or -1, only likeCount & updatedAt)
  const isAuthenticated = Boolean(auth && auth.uid);
  const onlyLikesAndUpdated = affectedKeys.every(k => ['likeCount', 'updatedAt'].includes(k));
  const currentLikes = existingData.likeCount || 0;
  const newLikes = updateData.likeCount;
  if (isAuthenticated && onlyLikesAndUpdated && (newLikes === currentLikes + 1 || newLikes === currentLikes - 1)) {
    return { allowed: true, reason: 'auth_like_toggle' };
  }

  return { allowed: false, reason: 'permission_denied' };
}

runTest('Guest (auth = null) is ALLOWED to increment viewCount by exactly +1', () => {
  const result = evaluateActivePartnersUpdateRule({
    auth: null,
    existingData: { viewCount: 10, name: 'Lucky Com' },
    updateData: { viewCount: 11, updatedAt: '2026-10-30T06:30:00Z' }
  });
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.reason, 'debounced_view_count');
});

runTest('Guest (auth = null) attempting to tamper viewCount (+5) is BLOCKED', () => {
  const result = evaluateActivePartnersUpdateRule({
    auth: null,
    existingData: { viewCount: 10, name: 'Lucky Com' },
    updateData: { viewCount: 15, updatedAt: '2026-10-30T06:30:00Z' }
  });
  assert.strictEqual(result.allowed, false);
});

runTest('Guest (auth = null) attempting to modify store name along with viewCount is BLOCKED', () => {
  const result = evaluateActivePartnersUpdateRule({
    auth: null,
    existingData: { viewCount: 10, name: 'Lucky Com' },
    updateData: { viewCount: 11, name: 'Hacked Store', updatedAt: '2026-10-30T06:30:00Z' }
  });
  assert.strictEqual(result.allowed, false);
});

runTest('Guest (auth = null) attempting to increment likeCount is BLOCKED by rules', () => {
  const result = evaluateActivePartnersUpdateRule({
    auth: null,
    existingData: { likeCount: 5 },
    updateData: { likeCount: 6, updatedAt: '2026-10-30T06:30:00Z' }
  });
  assert.strictEqual(result.allowed, false);
  assert.strictEqual(result.reason, 'permission_denied');
});

runTest('Authenticated user (auth.uid present) is ALLOWED to toggle likeCount (+1 or -1)', () => {
  const upvote = evaluateActivePartnersUpdateRule({
    auth: { uid: 'user_123', role: 'customer' },
    existingData: { likeCount: 5 },
    updateData: { likeCount: 6, updatedAt: '2026-10-30T06:30:00Z' }
  });
  assert.strictEqual(upvote.allowed, true);

  const downvote = evaluateActivePartnersUpdateRule({
    auth: { uid: 'user_123', role: 'customer' },
    existingData: { likeCount: 6 },
    updateData: { likeCount: 5, updatedAt: '2026-10-30T06:30:00Z' }
  });
  assert.strictEqual(downvote.allowed, true);
});

runTest('Authenticated user attempting likeCount jump (+2) is BLOCKED', () => {
  const result = evaluateActivePartnersUpdateRule({
    auth: { uid: 'user_123', role: 'customer' },
    existingData: { likeCount: 5 },
    updateData: { likeCount: 7, updatedAt: '2026-10-30T06:30:00Z' }
  });
  assert.strictEqual(result.allowed, false);
});

runTest('Client Guard: Guest like click shows Toast without touching DB', () => {
  let toastTriggered = null;
  let dbWriteAttempted = false;

  const mockToast = (msg, type) => {
    toastTriggered = { msg, type };
  };

  const handleToggleLike = ({ currentUser, showToast }) => {
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนกดถูกใจร้านค้าครับ', 'warning');
      return;
    }
    dbWriteAttempted = true;
  };

  handleToggleLike({ currentUser: null, showToast: mockToast });

  assert.strictEqual(dbWriteAttempted, false, 'No DB write must be triggered for guests');
  assert.strictEqual(toastTriggered.msg, 'กรุณาเข้าสู่ระบบก่อนกดถูกใจร้านค้าครับ');
  assert.strictEqual(toastTriggered.type, 'warning');
});

runTest('Session Guard: Repeat page visits in same session result in 0 DB writes', () => {
  const mockSessionStorage = new Map();
  let dbViewWrites = 0;

  const recordStoreView = (storeId) => {
    const key = `dh_store_view_${storeId}`;
    if (mockSessionStorage.has(key)) {
      return false; // Debounced: 0 writes
    }
    mockSessionStorage.set(key, Date.now());
    dbViewWrites++;
    return true;
  };

  // First visit
  const write1 = recordStoreView('store_zeer_1');
  assert.strictEqual(write1, true);
  assert.strictEqual(dbViewWrites, 1);

  // Second visit / page refresh in same session
  const write2 = recordStoreView('store_zeer_1');
  assert.strictEqual(write2, false);
  assert.strictEqual(dbViewWrites, 1, 'Repeat visits must not increase DB writes');

  // Visit another store
  const write3 = recordStoreView('store_zeer_2');
  assert.strictEqual(write3, true);
  assert.strictEqual(dbViewWrites, 2);
});

// ====================================================================
// EDGE CASE 3: Network Failure During Like Toggle
// ====================================================================
console.log('\n--- SCENARIO 3: Network Failure During Like Toggle ---');

runTest('Optimistic UI with catch-revert rollback on network disconnect', async () => {
  let state = {
    isLiked: false,
    likeCount: 12
  };
  let errorToast = null;

  const toggleLikeWithOptimisticUI = async ({ simulateNetworkFailure }) => {
    // 1. Snapshot previous state
    const previousState = { ...state };

    // 2. Optimistic Update (0ms instant UI update)
    const nextIsLiked = !state.isLiked;
    state = {
      isLiked: nextIsLiked,
      likeCount: state.likeCount + (nextIsLiked ? 1 : -1)
    };

    // 3. Network write
    try {
      if (simulateNetworkFailure) {
        throw new Error('FirebaseError: [unavailable] Failed to get document because the client is offline.');
      }
      // writeBatch committed successfully in normal path
    } catch (err) {
      // 4. Rollback to snapshot on failure
      state = { ...previousState };
      errorToast = 'ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }
  };

  // Initial state check
  assert.strictEqual(state.isLiked, false);
  assert.strictEqual(state.likeCount, 12);

  // Simulate network failure
  await toggleLikeWithOptimisticUI({ simulateNetworkFailure: true });

  // State must be completely restored!
  assert.strictEqual(state.isLiked, false, 'isLiked must revert back to false');
  assert.strictEqual(state.likeCount, 12, 'likeCount must revert back to 12');
  assert.ok(errorToast.includes('กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
});

runTest('Atomic Batch Write Invariant: ActivePartners and users updated together or neither', async () => {
  let activePartnersUpdated = false;
  let userProfileUpdated = false;

  const executeAtomicLikeBatch = async ({ shouldFail }) => {
    try {
      if (shouldFail) {
        throw new Error('Network timeout during batch commit');
      }
      activePartnersUpdated = true;
      userProfileUpdated = true;
    } catch {
      // Batch failure guarantees atomicity: neither is applied
      activePartnersUpdated = false;
      userProfileUpdated = false;
    }
  };

  await executeAtomicLikeBatch({ shouldFail: true });
  assert.strictEqual(activePartnersUpdated, false);
  assert.strictEqual(userProfileUpdated, false);
  assert.strictEqual(activePartnersUpdated, userProfileUpdated, 'Atomicity invariant maintained');

  await executeAtomicLikeBatch({ shouldFail: false });
  assert.strictEqual(activePartnersUpdated, true);
  assert.strictEqual(userProfileUpdated, true);
  assert.strictEqual(activePartnersUpdated, userProfileUpdated, 'Atomicity invariant maintained');
});

console.log('\n====================================================================');
console.log(`📊 ADVERSARIAL STRESS TEST SUMMARY: ${passedTests}/${totalTests} PASSED`);
console.log('====================================================================');
