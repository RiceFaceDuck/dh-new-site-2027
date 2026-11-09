/**
 * ⚔️ EMPIRICAL CHALLENGER: ITERATION 2 IMPLEMENTATION PLAN RE-EVALUATION
 * File: Management System/tests/adversarial/challenger_retest_iteration2_plan.mjs
 * 
 * Verifies the exact algorithms and specifications in:
 * C:\Users\bents\.gemini\antigravity\brain\365a6a90-40db-41fd-8a52-e5bead0122cf\implementation_plan.md
 * 
 * Target Checks:
 * 1. VULN-TAB-01 & VULN-TAB-02: localStorage with 30-min TTL cross-tab stickiness & duplicate dwell prevention
 * 2. VULN-FORMULA-B: Monotonic Max Ceiling (Math.max(remoteViews, localTargetViews)) & smooth auto-clear
 * 3. Synchronous useState initialization vs useEffect 1-frame paint flicker
 * 4. Midnight dateKey isolation (no delta bleed across 00:00:00 Bangkok)
 * 5. Legacy viewCount preservation (no wipeout from 150 to 1)
 */

import assert from 'node:assert/strict';

console.log('================================================================================');
console.log('  ⚔️ EMPIRICAL CHALLENGER: ITERATION 2 PLAN ADVERSARIAL RE-EVALUATION');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failures.push({ name, error: err.message });
  }
}

// -----------------------------------------------------------------------------
// IN-MEMORY BROWSER STORAGE MOCK
// -----------------------------------------------------------------------------
class BrowserStorageMock {
  constructor() {
    this.map = new Map();
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

// -----------------------------------------------------------------------------
// EXACT IMPLEMENTATION PLAN ALGORITHMS (FROM LINES 155-201 & 245-340)
// -----------------------------------------------------------------------------

function getBangkokDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function resolveStoreViewMetrics(partner, localLock = null, now = new Date()) {
  const todayKey = getBangkokDateKey(now);
  const rawViews = partner?.views;

  // 1. All-Time: Math.max to prevent legacy loss
  const remoteAllTime = Math.max(
    Number(rawViews?.allTime || 0),
    Number(partner?.viewCount || 0),
    Number(partner?.viewsCount || 0)
  );

  // 2. Today: Lazy rollover
  const remoteToday = (rawViews?.dateKey === todayKey)
    ? Number(rawViews?.today || 0)
    : 0;

  let finalAllTime = remoteAllTime;
  let finalToday = remoteToday;

  const currentTime = now.getTime();
  if (localLock && localLock.expiresAt > currentTime) {
    if (typeof localLock.targetViews === 'number') {
      finalAllTime = Math.max(remoteAllTime, localLock.targetViews);
    }
    if (localLock.dateKey === todayKey && typeof localLock.targetToday === 'number') {
      finalToday = Math.max(remoteToday, localLock.targetToday);
    }
  }

  return {
    allTime: Math.max(0, finalAllTime),
    today: Math.max(0, finalToday),
    dateKey: todayKey
  };
}

// Hook logic simulation
function simulateStoreViewsHook({
  partner,
  storage,
  now = new Date(),
  onTrackView = () => {}
}) {
  const COOLDOWN_MS = 30 * 60 * 1000;
  const partnerId = partner?.id;

  const getStoredLock = () => {
    try {
      const raw = storage.getItem(`dh_store_view_lock_${partnerId}`);
      if (!raw) return null;
      const lock = JSON.parse(raw);
      if (now.getTime() > lock.expiresAt) {
        storage.removeItem(`dh_store_view_lock_${partnerId}`);
        return null;
      }
      return lock;
    } catch {
      return null;
    }
  };

  // Synchronous State Initializer
  const initialLock = getStoredLock();
  let state = resolveStoreViewMetrics(partner, initialLock, now);

  // Prop sync handler (simulates useEffect on partner change)
  const syncProps = (updatedPartner) => {
    const currentLock = getStoredLock();
    const next = resolveStoreViewMetrics(updatedPartner, currentLock, now);
    state = {
      allTime: Math.max(state.allTime, next.allTime),
      today: Math.max(state.today, next.today),
      dateKey: next.dateKey
    };

    // Auto-release lock when server catches up
    const remoteAll = Math.max(
      Number(updatedPartner?.views?.allTime || 0),
      Number(updatedPartner?.viewCount || 0)
    );
    if (currentLock && remoteAll >= currentLock.targetViews) {
      storage.removeItem(`dh_store_view_lock_${partnerId}`);
    }
    return state;
  };

  // Dwell trigger (simulates 1000ms timer)
  const triggerDwell = () => {
    const existingLock = getStoredLock();
    if (existingLock) {
      // Cooldown blocked!
      return { triggered: false, state };
    }

    const todayKey = getBangkokDateKey(now);
    const optimisticAllTime = state.allTime + 1;
    const optimisticToday = state.today + 1;

    const newLock = {
      timestamp: now.getTime(),
      expiresAt: now.getTime() + COOLDOWN_MS,
      dateKey: todayKey,
      targetViews: optimisticAllTime,
      targetToday: optimisticToday
    };

    storage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify(newLock));
    onTrackView(partnerId);

    state = {
      allTime: optimisticAllTime,
      today: optimisticToday,
      dateKey: todayKey
    };

    return { triggered: true, state };
  };

  return {
    getState: () => state,
    syncProps,
    triggerDwell,
    getStoredLock
  };
}

// =============================================================================
// TEST SUITE: ADVERSARIAL VALIDATION OF ITERATION 2
// =============================================================================

console.log('--- 1. Multi-Tab Stickiness & Cooldown (VULN-TAB-01 & VULN-TAB-02) ---');

check('VULN-TAB-01: Tab 2 reads localStorage lock and renders viewCount=1 immediately (No 0 drop)', () => {
  const sharedLocalStorage = new BrowserStorageMock();
  const partner = { id: 'store_alpha', viewCount: 0, views: { allTime: 0, today: 0, dateKey: '2026-11-09' } };
  const t0 = new Date('2026-11-09T10:00:00Z');

  // Tab 1 enters and completes dwell
  const tab1 = simulateStoreViewsHook({ partner, storage: sharedLocalStorage, now: t0 });
  const dwellRes = tab1.triggerDwell();
  assert.equal(dwellRes.triggered, true);
  assert.equal(tab1.getState().allTime, 1);
  assert.equal(tab1.getState().today, 1);

  // Tab 2 opens at T=10s in the same browser (still DB = 0)
  const t10s = new Date(t0.getTime() + 10000);
  const tab2 = simulateStoreViewsHook({ partner, storage: sharedLocalStorage, now: t10s });

  // Tab 2 synchronous initialization must be 1 immediately!
  assert.equal(tab2.getState().allTime, 1, 'Tab 2 allTime must be 1 on mount');
  assert.equal(tab2.getState().today, 1, 'Tab 2 today must be 1 on mount');
});

check('VULN-TAB-02: Tab 2 dwell timer is strictly BLOCKED by 30-min TTL lock (Zero duplicate writes)', () => {
  const sharedLocalStorage = new BrowserStorageMock();
  const partner = { id: 'store_alpha', viewCount: 0, views: { allTime: 0, today: 0, dateKey: '2026-11-09' } };
  const t0 = new Date('2026-11-09T10:00:00Z');

  let telemetryWrites = 0;
  const onTrackView = () => { telemetryWrites++; };

  // Tab 1 mounts and dwells
  const tab1 = simulateStoreViewsHook({ partner, storage: sharedLocalStorage, now: t0, onTrackView });
  tab1.triggerDwell();
  assert.equal(telemetryWrites, 1, 'Tab 1 triggers exactly 1 telemetry write');

  // Tab 2 mounts at T=10s and attempts dwell
  const t10s = new Date(t0.getTime() + 10000);
  const tab2 = simulateStoreViewsHook({ partner, storage: sharedLocalStorage, now: t10s, onTrackView });
  const tab2Dwell = tab2.triggerDwell();

  assert.equal(tab2Dwell.triggered, false, 'Tab 2 dwell must be blocked');
  assert.equal(telemetryWrites, 1, 'Total telemetry writes MUST remain 1 (No duplicate inflation)');
});

check('VULN-TAB-03: LocalStorage lock expires cleanly after 30 minutes (1,800,000ms TTL)', () => {
  const sharedLocalStorage = new BrowserStorageMock();
  const partner = { id: 'store_alpha', viewCount: 1, views: { allTime: 1, today: 1, dateKey: '2026-11-09' } };
  const t0 = new Date('2026-11-09T10:00:00Z');

  let telemetryWrites = 0;
  const onTrackView = () => { telemetryWrites++; };

  const tab1 = simulateStoreViewsHook({ partner, storage: sharedLocalStorage, now: t0, onTrackView });
  tab1.triggerDwell();
  assert.equal(telemetryWrites, 1);

  // Visit after 30 mins and 1 sec (1,800,001 ms)
  const t31m = new Date(t0.getTime() + 30 * 60 * 1000 + 1000);
  const tabLater = simulateStoreViewsHook({ partner, storage: sharedLocalStorage, now: t31m, onTrackView });
  assert.equal(tabLater.getStoredLock(), null, 'Expired lock must return null');

  const dwellAfterCooldown = tabLater.triggerDwell();
  assert.equal(dwellAfterCooldown.triggered, true, 'Dwell after 30 mins must be permitted');
  assert.equal(telemetryWrites, 2, 'New telemetry write recorded after TTL');
});

console.log('\n--- 2. Monotonic Max Ceiling vs Additive Jump (VULN-FORMULA-B) ---');

check('VULN-FORMULA-B.1: Monotonic Max maintains 1 when server commits at T=120s (Zero 1 -> 2 jump)', () => {
  const storage = new BrowserStorageMock();
  let partner = { id: 'store_beta', viewCount: 0, views: { allTime: 0, today: 0, dateKey: '2026-11-09' } };
  const t0 = new Date('2026-11-09T10:00:00Z');

  const hook = simulateStoreViewsHook({ partner, storage, now: t0 });
  hook.triggerDwell(); // UI = 1, targetViews = 1

  assert.equal(hook.getState().allTime, 1);

  // At T=120s, server commits delta to DB -> remote is now 1
  partner = { id: 'store_beta', viewCount: 1, views: { allTime: 1, today: 1, dateKey: '2026-11-09' } };
  const updatedState = hook.syncProps(partner);

  assert.equal(updatedState.allTime, 1, 'ViewCount must stay 1 and NEVER jump to 2');
  assert.equal(storage.getItem(`dh_store_view_lock_store_beta`), null, 'Lock must be auto-released');
});

check('VULN-FORMULA-B.2: Contrast proof against Model B (Additive Formula jumps to 2)', () => {
  // Additive formula: display = remote + delta
  let remote = 0;
  let delta = 1; // user optimistic delta
  let display = remote + delta; // 1

  // Server commits at T=120s -> remote becomes 1
  remote = 1;
  let brokenDisplay = remote + delta; // 1 + 1 = 2 (DEFECT!)

  assert.equal(brokenDisplay, 2, 'Additive formula confirms defect of jumping to 2');

  // Iteration 2 Plan formula: Math.max(remote, targetViews)
  let targetViews = 1;
  let hardenedDisplay = Math.max(remote, targetViews); // Math.max(1, 1) = 1 (HEALED!)
  assert.equal(hardenedDisplay, 1, 'Iteration 2 Monotonic Max strictly preserves 1');
});

console.log('\n--- 3. Synchronous useState Initialization (0-Frame Paint Flicker) ---');

check('Synchronous Init: useState(() => ...) evaluates to 1 on Frame 0 upon F5 reload', () => {
  const storage = new BrowserStorageMock();
  const partnerId = 'store_gamma';
  const partner = { id: partnerId, viewCount: 0 }; // Firestore returns 0
  const t0 = new Date('2026-11-09T10:00:00Z');

  // Simulate Lock in localStorage from prior dwell
  storage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify({
    timestamp: t0.getTime(),
    expiresAt: t0.getTime() + 1800000,
    dateKey: '2026-11-09',
    targetViews: 1,
    targetToday: 1
  }));

  // Frame 0: Hook executes
  const hook = simulateStoreViewsHook({ partner, storage, now: t0 });

  // Verify Frame 0 state BEFORE any effects run
  assert.equal(hook.getState().allTime, 1, 'Frame 0 allTime MUST be 1');
  assert.equal(hook.getState().today, 1, 'Frame 0 today MUST be 1');
});

check('Contrast proof against asynchronous useEffect: useEffect produces 1-frame (0 -> 1) flicker', () => {
  const dbRemote = 0;
  const localTarget = 1;

  const renderedFrames = [];

  // Naive async pattern
  let state = dbRemote; // Initial useState(remote)
  renderedFrames.push(state); // Frame 0 paints 0! (FLICKER)

  // Effect runs on next tick
  state = Math.max(dbRemote, localTarget);
  renderedFrames.push(state); // Frame 1 paints 1!

  assert.deepEqual(renderedFrames, [0, 1], 'Naive async pattern confirmed to produce 1-frame drop');
});

console.log('\n--- 4. Midnight Boundary & DateKey Isolation ---');

check('Midnight Isolation: Yesterday local lock does NOT bleed into today count', () => {
  const storage = new BrowserStorageMock();
  const partnerId = 'store_midnight';
  const partner = { id: partnerId, viewCount: 50, views: { allTime: 50, today: 0, dateKey: '2026-11-09' } };

  // Lock saved yesterday (2026-11-08 23:50:00 Bangkok)
  const tYesterday = new Date('2026-11-08T16:50:00Z'); // 23:50:00 Bangkok
  storage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify({
    timestamp: tYesterday.getTime(),
    expiresAt: tYesterday.getTime() + 1800000, // Still valid for 20 mins into new day
    dateKey: '2026-11-08',
    targetViews: 51,
    targetToday: 15
  }));

  // Client loads at 00:05:00 Bangkok on 2026-11-09
  const tToday = new Date('2026-11-08T17:05:00Z'); // 00:05:00 Bangkok next day
  const hook = simulateStoreViewsHook({ partner, storage, now: tToday });

  assert.equal(hook.getState().allTime, 51, 'All-time includes total views monotonically');
  assert.equal(hook.getState().today, 0, 'Today view must be 0 and NOT polluted by yesterday targetToday (15)');
  assert.equal(hook.getState().dateKey, '2026-11-09');
});

console.log('\n--- 5. Legacy ViewCount Preservation ---');

check('Legacy Preservation: Store with only viewCount: 150 never drops to 1', () => {
  const storage = new BrowserStorageMock();
  const partner = { id: 'store_legacy', viewCount: 150 }; // No views object
  const now = new Date('2026-11-09T10:00:00Z');

  const hook = simulateStoreViewsHook({ partner, storage, now });
  assert.equal(hook.getState().allTime, 150, 'Must preserve 150 views');

  hook.triggerDwell();
  assert.equal(hook.getState().allTime, 151, 'Dwell must increment 150 -> 151');
});

console.log('\n================================================================================');
console.log(`  RESULT: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================\n');

if (failedTests > 0) {
  console.error('FAILURES DETECTED:', failures);
  process.exit(1);
} else {
  console.log('⚔️ ALL EMPIRICAL RE-EVALUATION CHECKS PASSED PERFECTLY!');
  process.exit(0);
}
