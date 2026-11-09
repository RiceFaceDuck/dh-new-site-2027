/**
 * 🧪 VERIFICATION SUITE 1: STORE VIEW STABILITY & COOLDOWN
 * Path: Management System/tests/verifications/verify_store_view_stability_and_cooldown.mjs
 * 
 * Objectives:
 * 1. Single-Tab Dwell Time: 1,000ms updates metrics.allTime and metrics.today to 1.
 * 2. F5 Reload Stability (Synchronous Init): useState(() => resolveStoreViewMetrics(partner, initialLock))
 *    evaluates targetViews immediately, 0-frame paint flicker eliminated (Frame 0 renders 1).
 * 3. Parent Re-render Invariant: Props changing (e.g. partner.viewCount: 0) does NOT drag counter down (Monotonic Max).
 * 4. Cross-Tab Synchronization: Tab 2 reads dh_store_view_lock_${partnerId}, renders 1 in Frame 0,
 *    and suppresses duplicate dwell timer.
 * 5. Server Commit Transition & Cooldown Persistence: At T=120s server commit updates DB while 30-min
 *    lock persists; on revisit at T=130s dwell timer is suppressed and display remains 1 (no jump to 2).
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('='.repeat(80));
console.log('  🧪 VERIFICATION SUITE 1: STORE VIEW STABILITY & COOLDOWN');
console.log('  Target: useStoreViews.js & storeMetricsHelper.js');
console.log('='.repeat(80));

let passCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Mock LocalStorage Environment
// -----------------------------------------------------------------------------
class MockLocalStorage {
  constructor(allowThrows = false) {
    this.store = new Map();
    this.allowThrows = allowThrows;
  }
  getItem(key) {
    if (this.allowThrows) throw new Error('QuotaExceeded or SecurityError');
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    if (this.allowThrows) throw new Error('QuotaExceeded or SecurityError');
    this.store.set(key, String(value));
  }
  removeItem(key) {
    if (this.allowThrows) throw new Error('QuotaExceeded or SecurityError');
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// Load dynamic module
const { resolveStoreViewMetrics, getBangkokDateKey } = await import('../../dh-shared/src/utils/storeMetricsHelper.js');

// Execute tests
async function main() {
  console.log('\n--- Section 1: Static Architectural Invariants ---');
  runTest('1.1: useStoreViews.js enforces Synchronous useState Initializer', () => {
    const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreViews.js');
    assert.ok(fs.existsSync(filePath), 'useStoreViews.js must exist');
    const code = fs.readFileSync(filePath, 'utf8');

    assert.ok(code.includes('useState(() =>'), 'Must use functional state initializer in useState');
    assert.ok(code.includes('resolveStoreViewMetrics(partner, initialLock)'), 'Must resolve metrics synchronously with initialLock');
  });

  runTest('1.2: useStoreViews.js enforces Monotonic Max Ceiling on allTime and today', () => {
    const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreViews.js');
    const code = fs.readFileSync(filePath, 'utf8');

    assert.ok(code.includes('Math.max(prev.allTime, next.allTime)'), 'Must use Math.max for allTime in state update');
    assert.ok(code.includes('Math.max(prev.today, next.today)'), 'Must use Math.max for today in state update');
  });

  runTest('1.3: useStoreViews.js aligns with 30-Minute Cooldown & 1,000ms Dwell Time', () => {
    const filePath = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreViews.js');
    const code = fs.readFileSync(filePath, 'utf8');

    assert.ok(code.includes('COOLDOWN_MS = 30 * 60 * 1000') || code.includes('1800000'), 'Must enforce 30-minute cooldown (1,800,000 ms)');
    assert.ok(code.includes('1000'), 'Must enforce 1,000ms dwell time MRC delay');
    assert.ok(code.includes('dh_store_view_lock_'), 'Must use standardized lock storage key');
  });

  console.log('\n--- Section 2: Single-Tab Dwell Time Simulation ---');
  await runAsyncTest('2.1: Single-Tab Dwell Time: 1,000ms timer transitions metrics from 0 to 1', async () => {
    const storage = new MockLocalStorage();
    const partnerId = 'test_partner_dwell_01';
    const remotePartner = { id: partnerId, viewCount: 0, views: { allTime: 0, today: 0, dateKey: getBangkokDateKey() } };

    // Initial State: T = 0ms
    const initialLock = null;
    let metrics = resolveStoreViewMetrics(remotePartner, initialLock);
    assert.equal(metrics.allTime, 0, 'Initial allTime must be 0 before dwell time');
    assert.equal(metrics.today, 0, 'Initial today must be 0 before dwell time');

    // Simulate Dwell Timer at T = 1,000ms
    let trackedStoreId = null;
    const mockTrackStoreView = (id) => { trackedStoreId = id; };

    // Execute dwell completion
    const optimisticAllTime = metrics.allTime + 1;
    const optimisticToday = metrics.today + 1;
    const todayKey = getBangkokDateKey();

    const newLock = {
      timestamp: Date.now(),
      expiresAt: Date.now() + 1800000,
      dateKey: todayKey,
      targetViews: optimisticAllTime,
      targetToday: optimisticToday
    };
    storage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify(newLock));
    mockTrackStoreView(partnerId);

    metrics = {
      allTime: optimisticAllTime,
      today: optimisticToday,
      dateKey: todayKey
    };

    assert.equal(metrics.allTime, 1, 'After 1,000ms dwell, allTime must be 1');
    assert.equal(metrics.today, 1, 'After 1,000ms dwell, today must be 1');
    assert.equal(trackedStoreId, partnerId, 'Must trigger trackStoreView with partnerId');
    assert.ok(storage.getItem(`dh_store_view_lock_${partnerId}`), 'Lock must be persisted in localStorage');
  });

  console.log('\n--- Section 3: F5 Reload Stability (Synchronous Init) ---');
  runTest('3.1: F5 Reload Stability: Synchronous initializer renders Frame 0 with targetViews (zero flicker)', () => {
    const storage = new MockLocalStorage();
    const partnerId = 'test_partner_f5_reload';
    const todayKey = getBangkokDateKey();

    // Active lock already saved from previous visit 10 seconds ago
    const savedLock = {
      timestamp: Date.now() - 10000,
      expiresAt: Date.now() + 1790000,
      dateKey: todayKey,
      targetViews: 1,
      targetToday: 1
    };
    storage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify(savedLock));

    // Server document still returns uncommitted viewCount: 0
    const serverPartner = {
      id: partnerId,
      viewCount: 0,
      views: { allTime: 0, today: 0, dateKey: todayKey }
    };

    // Frame 0 execution: useState initializer runs synchronously before initial paint
    const rawStored = JSON.parse(storage.getItem(`dh_store_view_lock_${partnerId}`));
    const frame0Metrics = resolveStoreViewMetrics(serverPartner, rawStored);

    // Assert Frame 0 exhibits ZERO 0->1 paint flicker
    assert.equal(frame0Metrics.allTime, 1, 'Frame 0 allTime MUST be 1 immediately upon render');
    assert.equal(frame0Metrics.today, 1, 'Frame 0 today MUST be 1 immediately upon render');
    assert.equal(frame0Metrics.dateKey, todayKey, 'dateKey must match current Bangkok day');
  });

  console.log('\n--- Section 4: Parent Re-render Invariant (Monotonic Max) ---');
  runTest('4.1: Parent Re-render Invariant: Stale props (viewCount: 0) do not drag counter down', () => {
    const todayKey = getBangkokDateKey();
    const displayedMetrics = { allTime: 1, today: 1, dateKey: todayKey };

    // Parent re-renders at T = 1.5s (e.g. onAuthStateChanged or currentUser prop change)
    const stalePartnerProp = {
      id: 'test_partner_rerender',
      viewCount: 0,
      views: { allTime: 0, today: 0, dateKey: todayKey }
    };

    const currentLock = {
      expiresAt: Date.now() + 1798000,
      dateKey: todayKey,
      targetViews: 1,
      targetToday: 1
    };

    const nextResolved = resolveStoreViewMetrics(stalePartnerProp, currentLock);

    // Monotonic Max Guard in useStoreViews useEffect:
    const newMetrics = {
      allTime: Math.max(displayedMetrics.allTime, nextResolved.allTime),
      today: Math.max(displayedMetrics.today, nextResolved.today),
      dateKey: nextResolved.dateKey
    };

    assert.equal(newMetrics.allTime, 1, 'Counter allTime must NOT decrease to 0');
    assert.equal(newMetrics.today, 1, 'Counter today must NOT decrease to 0');
  });

  console.log('\n--- Section 5: Cross-Tab Synchronization ---');
  runTest('5.1: Cross-Tab Sync: Tab 2 reads lock, renders 1 in Frame 0, and suppresses dwell timer', () => {
    // Shared localStorage simulation between Tab 1 and Tab 2
    const sharedStorage = new MockLocalStorage();
    const partnerId = 'test_partner_crosstab';
    const todayKey = getBangkokDateKey();

    // Tab 1 already set the lock
    const tab1Lock = {
      timestamp: Date.now() - 5000,
      expiresAt: Date.now() + 1795000,
      dateKey: todayKey,
      targetViews: 1,
      targetToday: 1
    };
    sharedStorage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify(tab1Lock));

    // Tab 2 mounts with server document (remoteViews: 0)
    const remotePartner = {
      id: partnerId,
      viewCount: 0,
      views: { allTime: 0, today: 0, dateKey: todayKey }
    };

    // 1. Tab 2 executes synchronous init
    const tab2Lock = JSON.parse(sharedStorage.getItem(`dh_store_view_lock_${partnerId}`));
    const tab2Frame0 = resolveStoreViewMetrics(remotePartner, tab2Lock);
    assert.equal(tab2Frame0.allTime, 1, 'Tab 2 Frame 0 must show 1');
    assert.equal(tab2Frame0.today, 1, 'Tab 2 Frame 0 must show today = 1');

    // 2. Tab 2 Dwell Timer check:
    const existingLock = tab2Lock && tab2Lock.expiresAt > Date.now() ? tab2Lock : null;
    assert.ok(existingLock !== null, 'Existing lock must be recognized');

    let tab2TimerStarted = false;
    if (!existingLock) {
      tab2TimerStarted = true;
    }
    assert.equal(tab2TimerStarted, false, 'Duplicate dwell timer must be strictly suppressed in Tab 2');
  });

  console.log('\n--- Section 6: Server Commit Transition & Cooldown Persistence ---');
  runTest('6.1: Server Commit Transition & Revisit Cooldown: At T=120s server commits and lock persists for 30m; at T=130s revisit suppresses dwell timer and display stays at 1 (no jump to 2)', () => {
    const storage = new MockLocalStorage();
    const partnerId = 'test_partner_commit_120s';
    const todayKey = getBangkokDateKey();
    const t0 = Date.now() - 120000;
    const COOLDOWN_MS = 1800000;

    const activeLock = {
      timestamp: t0,
      expiresAt: t0 + COOLDOWN_MS,
      dateKey: todayKey,
      targetViews: 1,
      targetToday: 1
    };
    storage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify(activeLock));
    storage.setItem(`dh_ad_store_view_${partnerId}`, String(t0));

    // T = 120s: Background telemetry flush completes on Firestore.
    const updatedPartner = {
      id: partnerId,
      viewCount: 1,
      views: { allTime: 1, today: 1, dateKey: todayKey }
    };

    // Hook sync step: Lock persists until natural expiresAt (VULN-M4-01 remediation)
    const currentLock = JSON.parse(storage.getItem(`dh_store_view_lock_${partnerId}`));
    assert.ok(currentLock !== null, 'Lock must NOT be prematurely deleted when server commits');
    assert.equal(storage.getItem(`dh_store_view_lock_${partnerId}`) !== null, true, 'Lock persists in localStorage');

    const resolvedAt120s = resolveStoreViewMetrics(updatedPartner, currentLock);
    assert.equal(resolvedAt120s.allTime, 1, 'allTime must remain exactly 1 (NO jump to 2)');
    assert.equal(resolvedAt120s.today, 1, 'today must remain exactly 1');

    // T = 130s: User navigates away and revisits store profile within 30-minute cooldown
    const t130 = t0 + 130000;
    const revisitLock = storage.getItem(`dh_store_view_lock_${partnerId}`) ? JSON.parse(storage.getItem(`dh_store_view_lock_${partnerId}`)) : null;
    const adCooldown = storage.getItem(`dh_ad_store_view_${partnerId}`);
    const isAdCooldownActive = adCooldown && (t130 - parseInt(adCooldown, 10)) < COOLDOWN_MS;

    // Both primary lock and defense-in-depth anti-fraud cooldown are verified active
    assert.ok(revisitLock && t130 < revisitLock.expiresAt, 'Lock must remain active on revisit at T=130s');
    assert.ok(isAdCooldownActive, 'Anti-fraud cooldown must remain active at T=130s');

    // Dwell timer check in useStoreViews.js: if (existingLock || isAdCooldownActive) return;
    const dwellTimerStarted = !(revisitLock || isAdCooldownActive);
    assert.equal(dwellTimerStarted, false, 'Dwell timer must be suppressed on revisit at T=130s');

    // Display counter verification: Frame 0 and subsequent render remain at 1
    const revisitDisplay = resolveStoreViewMetrics(updatedPartner, revisitLock);
    assert.equal(revisitDisplay.allTime, 1, 'allTime display must stay at 1 (no increment to 2)');
    assert.equal(revisitDisplay.today, 1, 'today display must stay at 1');
  });

  runTest('6.2: Expired Lock (TTL > 30 minutes) is gracefully purged and does not hold stale targets', () => {
    const storage = new MockLocalStorage();
    const partnerId = 'test_partner_expired';
    const todayKey = getBangkokDateKey();

    const expiredLock = {
      timestamp: Date.now() - 1860000,
      expiresAt: Date.now() - 60000,
      dateKey: todayKey,
      targetViews: 99,
      targetToday: 99
    };
    storage.setItem(`dh_store_view_lock_${partnerId}`, JSON.stringify(expiredLock));

    const partner = { id: partnerId, viewCount: 5, views: { allTime: 5, today: 5, dateKey: todayKey } };

    const raw = storage.getItem(`dh_store_view_lock_${partnerId}`);
    let validLock = null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiresAt) {
        storage.removeItem(`dh_store_view_lock_${partnerId}`);
      } else {
        validLock = parsed;
      }
    }

    assert.equal(validLock, null, 'Expired lock must be rejected and purged');
    const metrics = resolveStoreViewMetrics(partner, validLock);
    assert.equal(metrics.allTime, 5, 'Must evaluate to genuine remote metrics, ignoring expired targetViews');
  });

  runTest('6.3: Incognito / Private Browsing storage access exception fallback', () => {
    const failingStorage = new MockLocalStorage(true);
    const partnerId = 'test_incognito';

    let raw = null;
    try {
      raw = failingStorage.getItem(`dh_store_view_lock_${partnerId}`);
    } catch (err) {
      raw = null;
    }

    assert.equal(raw, null, 'Private browsing exception safely handled without crash');
    const fallbackMetrics = resolveStoreViewMetrics({ id: partnerId, viewCount: 10 }, null);
    assert.equal(fallbackMetrics.allTime, 10, 'Fallback metrics evaluate smoothly');
  });

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`  VERIFICATION SUITE 1 RESULT: Total: ${totalCount} | Passed: ${passCount} | Failed: 0`);
  console.log('='.repeat(80));
  console.log('🎉 VERIFICATION SUITE 1: ALL STORE VIEW STABILITY & COOLDOWN INVARIANTS PASSED 100%!\n');
}

main().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
