/**
 * ⚔️ EMPIRICAL CHALLENGER: COOLDOWN KEY DESYNCHRONIZATION & GHOST VIEW TEST
 * Path: Management System/tests/adversarial/challenger_m4_cooldown_desync_stress.mjs
 * 
 * Objective:
 * Empirically stress-test the lifecycle transition when server commits at T=120s.
 * Verify whether premature deletion of `dh_store_view_lock_${partnerId}` causes:
 * 1. Dwell timer re-trigger on revisit at T=130s (within 30-min window).
 * 2. Ghost view count increment (UI displays 2 while server write is blocked by checkAntiFraud).
 * 3. Eventual downward drop (flicker/counter fluctuation) when lock expires at T=30m.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('='.repeat(80));
console.log('  ⚔️ CHALLENGER M4: COOLDOWN KEY DESYNC & GHOST VIEW STRESS TEST');
console.log('  Target: useStoreViews.js vs marketingAnalyticsService.js');
console.log('='.repeat(80));

const { resolveStoreViewMetrics, getBangkokDateKey } = await import('../../dh-shared/src/utils/storeMetricsHelper.js');

// Mock localStorage shared between Hook and Service
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(k) { return this.store.has(k) ? this.store.get(k) : null; }
  setItem(k, v) { this.store.set(k, String(v)); }
  removeItem(k) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

const storage = new MockLocalStorage();
const partnerId = 'store_test_ghost_view';
const COOLDOWN_MS = 1800000; // 30 min

// Service anti-fraud check logic directly matching marketingAnalyticsService.js:
function checkAntiFraud(storage, actionType, id, now) {
  const sessionKey = `dh_ad_${actionType}_${id}`;
  const lastAction = storage.getItem(sessionKey);
  if (lastAction && (now - parseInt(lastAction, 10)) < COOLDOWN_MS) {
    return false; // Suppressed by anti-fraud
  }
  storage.setItem(sessionKey, now.toString());
  return true; // Allowed
}

// -----------------------------------------------------------------------------
// Timeline Simulation:
// -----------------------------------------------------------------------------
console.log('\n--- Timeline Execution ---');

// T = 0s: First visit
let t0 = 1000000;
let serverDoc = {
  id: partnerId,
  viewCount: 0,
  views: { allTime: 0, today: 0, dateKey: getBangkokDateKey(new Date(t0)) }
};

// Hook initial mount at T=0
let lock = null;
let hookMetrics = resolveStoreViewMetrics(serverDoc, lock, new Date(t0));
assert.equal(hookMetrics.allTime, 0, 'T=0s: Initial view is 0');

// T = 1,000ms: Dwell timer fires
let t1 = t0 + 1000;
// Hook records optimistic lock
lock = {
  timestamp: t1,
  expiresAt: t1 + COOLDOWN_MS,
  dateKey: getBangkokDateKey(new Date(t1)),
  targetViews: hookMetrics.allTime + 1,
  targetToday: hookMetrics.today + 1
};
storage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify(lock));
hookMetrics = { allTime: lock.targetViews, today: lock.targetToday, dateKey: lock.dateKey };

// Hook calls trackStoreView -> checkAntiFraud runs
let allowedVisit1 = checkAntiFraud(storage, 'store_view', partnerId, t1);
assert.equal(allowedVisit1, true, 'T=1s: First visit must be allowed by anti-fraud');
assert.equal(hookMetrics.allTime, 1, 'T=1s: UI shows 1');
console.log('✅ T=1s: First visit dwell completed, UI shows 1, network write allowed.');

// T = 120s: Server commit finishes on Firestore
let t120 = t0 + 120000;
serverDoc.viewCount = 1;
serverDoc.views.allTime = 1;
serverDoc.views.today = 1;

// Hook sync effect runs in useStoreViews.js:
// Lines 116-118:
// if (currentLock && partner?.views?.allTime >= currentLock.targetViews) { removeStoredLock(partnerId); }
let currentStoredLock = JSON.parse(storage.getItem(`dh_store_view_lock_${partnerId}`));
if (currentStoredLock && serverDoc.views.allTime >= currentStoredLock.targetViews) {
  storage.removeItem(`dh_store_view_lock_${partnerId}`);
}
console.log('⚠️ T=120s: Server committed. storage.removeItem removed dh_store_view_lock.');
assert.equal(storage.getItem(`dh_store_view_lock_${partnerId}`), null, 'dh_store_view_lock is now null in storage');

// T = 130s: User navigates away and returns to store profile (or opens Tab 2)
let t130 = t0 + 130000; // 2 minutes 10 seconds (well within 30-min cooldown!)
let reloadedStoredLock = storage.getItem(`dh_store_view_lock_${partnerId}`);
assert.equal(reloadedStoredLock, null, 'At T=130s, stored lock is completely missing!');

// Hook mounts at T=130s
let hook2Metrics = resolveStoreViewMetrics(serverDoc, null, new Date(t130));
assert.equal(hook2Metrics.allTime, 1, 'T=130s: Frame 0 renders 1 from DB');

// Dwell timer check at T=130s:
// const existingLock = getStoredLock(partnerId);
// if (existingLock) { return; }
let existingLockAt130s = reloadedStoredLock ? JSON.parse(reloadedStoredLock) : null;
let timerStartedAt130s = (existingLockAt130s === null);
console.log(`🔎 T=130s: Does dwell timer start on revisit? ${timerStartedAt130s}`);

// Dwell timer fires at T=131s
let t131 = t130 + 1000;
let optimisticAllTime2 = hook2Metrics.allTime + 1; // 1 + 1 = 2!
let optimisticToday2 = hook2Metrics.today + 1;

// trackStoreView is called
let allowedVisit2 = checkAntiFraud(storage, 'store_view', partnerId, t131);
console.log(`🔎 T=131s: Did anti-fraud allow the network write? ${allowedVisit2}`);
console.log(`🔎 T=131s: What does the UI display now? ${optimisticAllTime2}`);

// Check for Ghost View:
if (timerStartedAt130s && !allowedVisit2 && optimisticAllTime2 === 2) {
  console.log('\n🚨 CONFIRMED FAILURE MODE [VULN-M4-01: GHOST VIEW COOLDOWN DESYNC]');
  console.log('   Cause: useStoreViews.js removes dh_store_view_lock when remote views commit at T=120s.');
  console.log('   Impact: On revisit at T=130s (< 30 min cooldown), dwell timer re-arms because lock was deleted.');
  console.log('   UI displays 2, but checkAntiFraud blocks the server write.');
  console.log('   Result: UI counter becomes 2 locally, but server remains 1.');
  console.log('   When the new 30-min lock expires, counter drops back from 2 to 1 on refresh (Fluctuation Bug reappears)!');
}

// -----------------------------------------------------------------------------
// Assertions for Empirical Report
// -----------------------------------------------------------------------------
assert.equal(timerStartedAt130s, true, 'Dwell timer unexpectedly started during active 30-min window');
assert.equal(allowedVisit2, false, 'Network write was blocked by anti-fraud as duplicate');
assert.equal(optimisticAllTime2, 2, 'UI incremented to 2 while server stays at 1');

console.log('\n' + '='.repeat(80));
console.log('  ⚔️ EMPIRICAL VULNERABILITY VULN-M4-01 VERIFIED AND REPRODUCED!');
console.log('='.repeat(80));
