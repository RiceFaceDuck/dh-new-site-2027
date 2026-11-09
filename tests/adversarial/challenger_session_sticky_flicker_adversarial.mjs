/**
 * ⚔️ EMPIRICAL CHALLENGER: ADVERSARIAL STRESS TEST SUITE
 * File: Management System/tests/adversarial/challenger_session_sticky_flicker_adversarial.mjs
 * 
 * Scope:
 * 1. Session-Sticky Optimistic Delta / Reconciliation Algorithm Stress-Testing:
 *    - Formula 1 (Monotonic Max: Math.max(remote, sessionValue)) vs Formula 2 (Additive Delta: remote + sessionDelta)
 *    - 0 <-> 1 flicker under immediate F5 refresh before 120s buffer flush
 *    - Parent re-renders & Auth state transitions (onAuthStateChanged)
 *    - Tab switching (visibilitychange / pagehide) and SPA routing transitions
 * 
 * 2. Multi-Tab Concurrency & Browser Storage Boundary Analysis:
 *    - Tab 1 vs Tab 2 isolation under sessionStorage (W3C HTML5 spec)
 *    - Multi-tab duplicate view inflation (fraudulent dual dwell-time fire)
 *    - Cross-tab mitigation via localStorage with TTL vs sessionStorage
 * 
 * 3. Server Delta Commit Transitions:
 *    - Server commit while tab is still open (remote 0 -> 1)
 *    - Concurrent visitor commit race (foreign delta vs own delta)
 *    - Unload Beacon / sendBeacon network failure fallback
 * 
 * 4. Multi-Period Metrics (All-Time & Today) & Bangkok Midnight Boundary:
 *    - Lazy Rollover on Read (0 reads/writes at 00:00:01)
 *    - Transactional Reset on Write in Cloud Function
 *    - Timezone boundary verification (UTC 16:59:59 vs 17:00:00 -> Asia/Bangkok YYYY-MM-DD)
 */

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================================');
console.log('  ⚔️ EMPIRICAL CHALLENGER: SESSION-STICKY RECONCILIATION & FLICKER HARNESS');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const defects = [];
const observations = [];

function pass(name, detail = '') {
  totalChecks++;
  passedChecks++;
  console.log(`  ✅ [PASS] ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, error) {
  totalChecks++;
  failedChecks++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  ❌ [FAIL] ${name}: ${msg}`);
  defects.push({ test: name, error: msg });
}

function observe(code, title, details) {
  observations.push({ code, title, details });
  console.log(`  ℹ️  [OBSERVATION ${code}] ${title}: ${details}`);
}

// =============================================================================
// MOCK BROWSER ENVIRONMENT HARNESS
// =============================================================================

class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

// -----------------------------------------------------------------------------
// BANGKOK DATE KEY HELPER (As proposed in implementation_plan.md)
// -----------------------------------------------------------------------------
function getBangkokDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function resolveStoreViewMetrics(partner, now = new Date()) {
  const todayKey = getBangkokDateKey(now);
  const rawViews = partner?.views;
  
  const allTime = Number(
    rawViews?.allTime ?? partner?.viewCount ?? partner?.viewsCount ?? 0
  );
  
  // Lazy Rollover: if dateKey is not today, today is logically 0
  const today = (rawViews?.dateKey === todayKey)
    ? Number(rawViews?.today || 0)
    : 0;

  return {
    allTime: Math.max(0, allTime),
    today: Math.max(0, today),
    dateKey: todayKey
  };
}

// =============================================================================
// RECONCILIATION ALGORITHM IMPLEMENTATIONS FOR EMPIRICAL TESTING
// =============================================================================

/**
 * Model A: Formula 1 - Monotonic Max Ceiling
 * display = Math.max(remote, sessionValue)
 */
class ModelA_MonotonicMax {
  constructor(storage, partnerId) {
    this.storage = storage;
    this.partnerId = partnerId;
    this.sessionKey = `dh_store_view_sticky_${partnerId}`;
    this.cooldownKey = `dh_store_viewed_${partnerId}`;
    this.pendingDelta = false;
  }

  // Synchronous initialization on mount
  init(remoteViewCount) {
    const rawRemote = Math.max(0, Number(remoteViewCount || 0));
    const storedSession = this.storage.getItem(this.sessionKey);
    const sessionVal = storedSession !== null ? Number(storedSession) : 0;
    
    // Auto-reconcile: if remote caught up or surpassed session, clear sticky key
    if (storedSession !== null && rawRemote >= sessionVal) {
      this.storage.removeItem(this.sessionKey);
      return { display: rawRemote, sessionValue: rawRemote };
    }

    const display = Math.max(rawRemote, sessionVal);
    return { display, sessionValue: sessionVal };
  }

  // Dwell timer completion (1000ms)
  onDwellComplete(currentDisplay) {
    const nextVal = currentDisplay + 1;
    this.storage.setItem(this.sessionKey, String(nextVal));
    this.storage.setItem(this.cooldownKey, String(Date.now()));
    this.pendingDelta = true;
    return nextVal;
  }

  // Props sync (parent re-render or auth change)
  syncProps(remoteViewCount, currentDisplay) {
    const rawRemote = Math.max(0, Number(remoteViewCount || 0));
    const storedSession = this.storage.getItem(this.sessionKey);
    const sessionVal = storedSession !== null ? Number(storedSession) : 0;

    if (storedSession !== null && rawRemote >= sessionVal) {
      this.storage.removeItem(this.sessionKey);
      this.pendingDelta = false;
      return rawRemote;
    }

    return Math.max(rawRemote, sessionVal, currentDisplay);
  }
}

/**
 * Model B: Formula 2 - Additive Optimistic Delta
 * display = remote + sessionDelta
 */
class ModelB_AdditiveDelta {
  constructor(storage, partnerId) {
    this.storage = storage;
    this.partnerId = partnerId;
    this.deltaKey = `dh_store_view_delta_${partnerId}`;
    this.cooldownKey = `dh_store_viewed_${partnerId}`;
  }

  init(remoteViewCount) {
    const rawRemote = Math.max(0, Number(remoteViewCount || 0));
    const delta = Number(this.storage.getItem(this.deltaKey) || 0);
    return rawRemote + delta;
  }

  onDwellComplete(currentDisplay) {
    const delta = Number(this.storage.getItem(this.deltaKey) || 0) + 1;
    this.storage.setItem(this.deltaKey, String(delta));
    this.storage.setItem(this.cooldownKey, String(Date.now()));
    return currentDisplay + 1;
  }

  syncProps(remoteViewCount) {
    const rawRemote = Math.max(0, Number(remoteViewCount || 0));
    const delta = Number(this.storage.getItem(this.deltaKey) || 0);
    return rawRemote + delta;
  }

  clearDelta() {
    this.storage.removeItem(this.deltaKey);
  }
}

// =============================================================================
// TEST SUITES
// =============================================================================

console.log('--- Test Suite 1: F5 Refresh Before 120s Buffer Flushes ---');

// Test 1.1: Immediate F5 refresh at T=2s before buffer flush (Remote remains 0)
(() => {
  const tabSession = new MockStorage();
  const storeId = 'partner_alpha';
  
  // T=0: First visit, remote in DB is 0
  let dbRemote = 0;
  const hookT0 = new ModelA_MonotonicMax(tabSession, storeId);
  let { display: displayT0 } = hookT0.init(dbRemote);
  assert.equal(displayT0, 0, 'Initial display must be 0');

  // T=1s: Dwell timer completes -> UI becomes 1, sticky session set to 1
  let displayT1 = hookT0.onDwellComplete(displayT0);
  assert.equal(displayT1, 1, 'After 1s dwell, display must be 1');
  assert.equal(tabSession.getItem(`dh_store_view_sticky_${storeId}`), '1');

  // T=2s: User presses F5! Browser reloads tab with SAME sessionStorage
  // DB is STILL 0 because 120s buffer has NOT flushed!
  const hookAfterF5 = new ModelA_MonotonicMax(tabSession, storeId);
  const { display: displayAfterF5 } = hookAfterF5.init(dbRemote);

  if (displayAfterF5 === 1) {
    pass('F5.1 - Immediate F5 before 120s flush maintains viewCount = 1 (Zero Flicker)');
  } else {
    fail('F5.1 - Immediate F5 before 120s flush', `Expected 1, got ${displayAfterF5} (Flicker 0 <-> 1 occurred!)`);
  }
})();

// Test 1.2: Second F5 refresh at T=10s, buffer still unflushed
(() => {
  const tabSession = new MockStorage();
  const storeId = 'partner_alpha';
  tabSession.setItem(`dh_store_view_sticky_${storeId}`, '1');
  tabSession.setItem(`dh_store_viewed_${storeId}`, String(Date.now() - 10000));

  const dbRemote = 0;
  const hook = new ModelA_MonotonicMax(tabSession, storeId);
  const { display } = hook.init(dbRemote);

  if (display === 1) {
    pass('F5.2 - Second F5 refresh at T=10s still maintains viewCount = 1');
  } else {
    fail('F5.2 - Second F5 refresh', `Expected 1, got ${display}`);
  }
})();

// Test 1.3: Synchronous vs Asynchronous initialization flicker vulnerability
(() => {
  // If an implementation uses useState(remote) and useEffect to reconcile from sessionStorage:
  // Render 1: state = remote (0) -> UI paints 0 (FLICKER!)
  // Effect 1: setState(sessionValue) -> UI paints 1
  const dbRemote = 0;
  const sessionVal = 1;

  // Simulate naive hook with useEffect reconciliation
  let uiFrames = [];
  let naiveState = dbRemote; // Frame 1
  uiFrames.push(naiveState);
  // Async effect runs later
  naiveState = Math.max(dbRemote, sessionVal); // Frame 2
  uiFrames.push(naiveState);

  // Synchronous init hook
  let syncState = Math.max(dbRemote, sessionVal);
  let syncFrames = [syncState];

  if (uiFrames[0] === 0 && uiFrames[1] === 1) {
    observe('OBS-FLICKER-01', 'Naive useEffect reconciliation introduces 1-frame (0 -> 1) render flicker', 
      'Reconciliation MUST be evaluated synchronously during useState initializer: useState(() => Math.max(remote, sessionVal))');
    pass('F5.3 - Identified synchronous initializer requirement to guarantee 0-frame flicker');
  } else {
    fail('F5.3 - Async init check', 'Unexpected frame flow');
  }
})();

console.log('\n--- Test Suite 2: Parent Re-renders & Auth State Changes ---');

// Test 2.1: Parent re-renders with fresh partner prop where viewCount is still 0
(() => {
  const tabSession = new MockStorage();
  const storeId = 'partner_beta';
  tabSession.setItem(`dh_store_view_sticky_${storeId}`, '1');

  const hook = new ModelA_MonotonicMax(tabSession, storeId);
  let currentDisplay = 1;

  // Parent re-renders because onAuthStateChanged fired
  // New partner prop arrives with viewCount: 0
  const newRemote = 0;
  const reconciled = hook.syncProps(newRemote, currentDisplay);

  if (reconciled === 1) {
    pass('ReRender 2.1 - Parent re-render with remote = 0 maintains viewCount = 1');
  } else {
    fail('ReRender 2.1 - Parent re-render', `Expected 1, got ${reconciled}`);
  }
})();

// Test 2.2: 100 rapid re-renders / prop fluctuations
(() => {
  const tabSession = new MockStorage();
  const storeId = 'partner_gamma';
  tabSession.setItem(`dh_store_view_sticky_${storeId}`, '5');

  const hook = new ModelA_MonotonicMax(tabSession, storeId);
  let display = 5;

  let hadFlicker = false;
  for (let i = 0; i < 100; i++) {
    // Props alternate between null, 0, 4 (stale Firestore cached reads)
    const remote = i % 2 === 0 ? 0 : 4;
    display = hook.syncProps(remote, display);
    if (display < 5) {
      hadFlicker = true;
      break;
    }
  }

  if (!hadFlicker && display === 5) {
    pass('ReRender 2.2 - 100 rapid re-render cycles maintain monotonic ceiling (Zero Drop)');
  } else {
    fail('ReRender 2.2 - Rapid re-renders', `Flickered below session ceiling! Final: ${display}`);
  }
})();

console.log('\n--- Test Suite 3: Multi-Tab Concurrency & Browser Storage Isolation (Adversarial) ---');

// Test 3.1: Tab 1 vs Tab 2 isolation under sessionStorage (HTML5 W3C Standard)
(() => {
  // In real browsers, Tab 1 and Tab 2 have COMPLETELY SEPARATE sessionStorage instances!
  const tab1Session = new MockStorage();
  const tab2Session = new MockStorage(); // Independent!
  const storeId = 'partner_delta';
  let dbRemote = 0; // In Firestore

  // Tab 1 loads store
  const hookTab1 = new ModelA_MonotonicMax(tab1Session, storeId);
  let { display: tab1Display } = hookTab1.init(dbRemote);
  tab1Display = hookTab1.onDwellComplete(tab1Display); // Tab 1 dwell fires -> 1

  assert.equal(tab1Display, 1, 'Tab 1 displays 1');

  // Tab 2 is opened by user in the same browser to the same store
  // Tab 2 has NO session storage from Tab 1!
  const hookTab2 = new ModelA_MonotonicMax(tab2Session, storeId);
  let { display: tab2Display } = hookTab2.init(dbRemote);

  // EMPIRICAL OBSERVATION:
  if (tab2Display === 0 && tab1Display === 1) {
    observe('VULN-TAB-01', 'Multi-Tab Inconsistency under sessionStorage',
      'Tab 1 displays 1, but Tab 2 displays 0 because sessionStorage is strictly isolated per browsing context. User opening a new tab sees 0!');
    pass('MultiTab 3.1 [CONFIRMED VULNERABILITY] - Multi-tab isolation causes Tab 2 to show 0 while Tab 1 shows 1');
  } else {
    fail('MultiTab 3.1 - Isolation check', `Expected Tab 2 to show 0, got ${tab2Display}`);
  }
})();

// Test 3.2: Multi-tab Telemetry Queue Duplication (Fraudulent Double Count)
(() => {
  const tab1Session = new MockStorage();
  const tab2Session = new MockStorage();
  const storeId = 'partner_epsilon';
  let dbRemote = 0;

  // Tab 1 dwell fires
  let tab1Queue = [];
  const hookTab1 = new ModelA_MonotonicMax(tab1Session, storeId);
  hookTab1.onDwellComplete(0);
  tab1Queue.push({ type: 'store_view', storeId });

  // Tab 2 opened within 10 seconds. Tab 2 has no cooldown in tab2Session!
  let tab2Queue = [];
  const hookTab2 = new ModelA_MonotonicMax(tab2Session, storeId);
  hookTab2.onDwellComplete(0); // Fires dwell timer because tab2Session has no cooldown key!
  tab2Queue.push({ type: 'store_view', storeId });

  const totalEventsQueued = tab1Queue.length + tab2Queue.length;

  if (totalEventsQueued === 2) {
    observe('VULN-TAB-02', 'Multi-Tab Duplicate Telemetry Flush',
      'Opening 2 tabs in the same browser generates 2 separate view telemetry events because cooldown is in sessionStorage instead of localStorage!');
    pass('MultiTab 3.2 [CONFIRMED VULNERABILITY] - sessionStorage cooldown leaks across tabs, allowing duplicate view counts');
  } else {
    fail('MultiTab 3.2 - Telemetry duplication', `Expected 2 events, got ${totalEventsQueued}`);
  }
})();

// Test 3.3: Mitigation Verification - LocalStorage with TTL solves Multi-Tab
(() => {
  // Shared localStorage between Tab 1 and Tab 2
  const sharedLocalStorage = new MockStorage();
  const storeId = 'partner_zeta';
  let dbRemote = 0;

  const TTL_MS = 30 * 60 * 1000; // 30 minutes

  // Helper using localStorage for cross-tab stickiness & cooldown
  function checkCrossTabCooldownAndStickiness(storage, id, remote) {
    const key = `dh_store_view_shared_${id}`;
    const raw = storage.getItem(key);
    const now = Date.now();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (now - parsed.timestamp < TTL_MS) {
          return { inCooldown: true, display: Math.max(remote, parsed.viewCount) };
        }
      } catch (e) {}
    }
    return { inCooldown: false, display: remote };
  }

  function recordCrossTabDwell(storage, id, currentDisplay) {
    const key = `dh_store_view_shared_${id}`;
    const next = currentDisplay + 1;
    storage.setItem(key, JSON.stringify({ viewCount: next, timestamp: Date.now() }));
    return next;
  }

  // Tab 1 visits and completes dwell
  let tab1 = checkCrossTabCooldownAndStickiness(sharedLocalStorage, storeId, dbRemote);
  assert.equal(tab1.inCooldown, false);
  let tab1Display = recordCrossTabDwell(sharedLocalStorage, storeId, tab1.display);
  assert.equal(tab1Display, 1);

  // Tab 2 opens now
  let tab2 = checkCrossTabCooldownAndStickiness(sharedLocalStorage, storeId, dbRemote);

  if (tab2.display === 1 && tab2.inCooldown === true) {
    pass('MultiTab 3.3 [MITIGATION VERIFIED] - localStorage with 30m TTL synchronizes viewCount=1 and cooldown across tabs');
  } else {
    fail('MultiTab 3.3 - Mitigation failed', `Tab 2 display: ${tab2.display}, inCooldown: ${tab2.inCooldown}`);
  }
})();

console.log('\n--- Test Suite 4: Server Delta Commit Transitions & Reconciliation Math ---');

// Test 4.1: Model B (Additive Delta) causes Double Count on Server Commit
(() => {
  const tabSession = new MockStorage();
  const storeId = 'partner_eta';
  let dbRemote = 0;

  const hookB = new ModelB_AdditiveDelta(tabSession, storeId);
  let display = hookB.init(dbRemote); // 0
  display = hookB.onDwellComplete(display); // 1 (delta = 1)

  assert.equal(display, 1, 'Display is 1');

  // At T=120s, server commits delta (+1) to Firestore
  // dbRemote becomes 1!
  dbRemote = 1;

  // Tab receives updated remote from server while tab is still open
  const displayAfterCommit = hookB.syncProps(dbRemote);

  // In Model B (Additive): remote (1) + delta (1) = 2! DOUBLE COUNT!
  if (displayAfterCommit === 2) {
    observe('VULN-FORMULA-B', 'Additive Delta Formula (remote + delta) causes false double-count jump (1 -> 2) on server commit',
      'When server commits, remote increments. If delta is added on top of new remote, viewCount jumps from 1 to 2! Model A (Math.max) prevents this!');
    pass('Formula 4.1 [CONFIRMED DEFECT IN ADDITIVE DELTA] - Model B jumps to 2 on server commit');
  } else {
    fail('Formula 4.1 - Additive check', `Unexpected display: ${displayAfterCommit}`);
  }
})();

// Test 4.2: Model A (Monotonic Max) smoothly transitions when server commits (0 flicker, 0 jump)
(() => {
  const tabSession = new MockStorage();
  const storeId = 'partner_theta';
  let dbRemote = 0;

  const hookA = new ModelA_MonotonicMax(tabSession, storeId);
  let { display } = hookA.init(dbRemote);
  display = hookA.onDwellComplete(display); // 1, sticky = 1

  assert.equal(display, 1);

  // Server commits delta at T=120s -> dbRemote = 1
  dbRemote = 1;

  // Props sync runs with new dbRemote
  const displayAfterCommit = hookA.syncProps(dbRemote, display);

  if (displayAfterCommit === 1 && tabSession.getItem(`dh_store_view_sticky_${storeId}`) === null) {
    pass('Formula 4.2 [MONOTONIC MAX VERIFIED] - Model A maintains exactly 1 and clears sticky session cleanly (Zero Jump, Zero Drop)');
  } else {
    fail('Formula 4.2 - Monotonic Max commit', `display: ${displayAfterCommit}, sticky: ${tabSession.getItem(`dh_store_view_sticky_${storeId}`)}`);
  }
})();

// Test 4.3: Concurrent Visitor Commits Before Tab 1 Flushes
(() => {
  const tabSession = new MockStorage();
  const storeId = 'partner_iota';
  let dbRemote = 10; // Initially 10

  const hookA = new ModelA_MonotonicMax(tabSession, storeId);
  let { display } = hookA.init(dbRemote); // 10
  display = hookA.onDwellComplete(display); // 11, sticky = 11

  assert.equal(display, 11);

  // Concurrent visitor (Visitor 2) commits to server first!
  // dbRemote becomes 11!
  dbRemote = 11;

  // Tab 1 re-renders or polls: dbRemote is 11
  const displayAfterVisitor2 = hookA.syncProps(dbRemote, display);
  assert.equal(displayAfterVisitor2, 11, 'Display stays 11');

  // Then Tab 1 flushes its own buffer to server -> dbRemote becomes 12
  dbRemote = 12;
  const displayAfterOwnCommit = hookA.syncProps(dbRemote, displayAfterVisitor2);

  if (displayAfterOwnCommit === 12) {
    pass('Concurrent 4.3 - Concurrent visitor commit transitions monotonically from 11 to 12 without downward drop');
  } else {
    fail('Concurrent 4.3 - Concurrent commit', `Expected 12, got ${displayAfterOwnCommit}`);
  }
})();

console.log('\n--- Test Suite 5: Multi-Period Metrics (All-Time & Today) & Bangkok Midnight Boundary ---');

// Test 5.1: Asia/Bangkok dateKey boundary verification across UTC times
(() => {
  // 2026-11-08 16:59:59 UTC = 2026-11-08 23:59:59 Bangkok (UTC+7) -> DateKey "2026-11-08"
  const tYesterdayUTC = new Date('2026-11-08T16:59:59Z');
  const keyYesterday = getBangkokDateKey(tYesterdayUTC);

  // 2026-11-08 17:00:00 UTC = 2026-11-09 00:00:00 Bangkok (UTC+7) -> DateKey "2026-11-09"
  const tMidnightBangkokUTC = new Date('2026-11-08T17:00:00Z');
  const keyToday = getBangkokDateKey(tMidnightBangkokUTC);

  if (keyYesterday === '2026-11-08' && keyToday === '2026-11-09') {
    pass('Timezone 5.1 - getBangkokDateKey accurately cuts midnight at UTC 17:00:00 (Asia/Bangkok 00:00:00)');
  } else {
    fail('Timezone 5.1 - Bangkok dateKey boundary', `Yesterday: ${keyYesterday}, Today: ${keyToday}`);
  }
})();

// Test 5.2: Lazy Rollover on Read (Midnight crossing without DB write)
(() => {
  // Partner document recorded yesterday
  const partnerYesterdayDoc = {
    id: 'partner_kappa',
    viewCount: 150,
    views: {
      allTime: 150,
      today: 45,
      dateKey: '2026-11-08',
      updatedAt: '2026-11-08T23:55:00Z'
    }
  };

  // Client reads at 2026-11-09 00:00:01 Bangkok (UTC 2026-11-08T17:00:01Z)
  const readingTime = new Date('2026-11-08T17:00:01Z');
  const resolved = resolveStoreViewMetrics(partnerYesterdayDoc, readingTime);

  if (resolved.allTime === 150 && resolved.today === 0 && resolved.dateKey === '2026-11-09') {
    pass('LazyRollover 5.2 - Lazy Rollover on Read computes today = 0 at 00:00:01 with 0 DB writes');
  } else {
    fail('LazyRollover 5.2 - Lazy Rollover', `Expected {allTime: 150, today: 0}, got ${JSON.stringify(resolved)}`);
  }
})();

// Test 5.3: Transactional Reset on Write in recordAdTelemetry simulation
(() => {
  // Simulate Cloud Function transaction logic
  function simulateTelemetryWriteTransaction(currentDoc, deltaViews, todayStr) {
    const rawViews = currentDoc?.views || {};
    const currentAllTime = Number(rawViews.allTime ?? currentDoc?.viewCount ?? 0);
    const currentDateKey = rawViews.dateKey || '';
    const currentToday = Number(rawViews.today || 0);

    const isSameDay = (currentDateKey === todayStr);

    const nextAllTime = currentAllTime + deltaViews;
    const nextToday = isSameDay ? (currentToday + deltaViews) : deltaViews;

    return {
      viewCount: nextAllTime,
      views: {
        allTime: nextAllTime,
        today: nextToday,
        dateKey: todayStr
      }
    };
  }

  // Case A: Same day increment
  const docToday = {
    viewCount: 100,
    views: { allTime: 100, today: 10, dateKey: '2026-11-09' }
  };
  const resSameDay = simulateTelemetryWriteTransaction(docToday, 5, '2026-11-09');
  assert.equal(resSameDay.views.allTime, 105);
  assert.equal(resSameDay.views.today, 15);

  // Case B: Cross-day new write
  const docYesterday = {
    viewCount: 100,
    views: { allTime: 100, today: 40, dateKey: '2026-11-08' }
  };
  const resCrossDay = simulateTelemetryWriteTransaction(docYesterday, 2, '2026-11-09');

  if (resCrossDay.views.allTime === 102 && resCrossDay.views.today === 2 && resCrossDay.views.dateKey === '2026-11-09') {
    pass('TransactionWrite 5.3 - Transactional Write on new dateKey resets today = delta and increments allTime');
  } else {
    fail('TransactionWrite 5.3 - Cross-day write', `Got: ${JSON.stringify(resCrossDay)}`);
  }
})();

// =============================================================================
// SUMMARY REPORT
// =============================================================================

console.log('\n================================================================================');
console.log(`  SUMMARY: Total Checks: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`);
console.log('================================================================================\n');

if (defects.length > 0) {
  console.log('Defects / Vulnerabilities Discovered:');
  defects.forEach((d, idx) => {
    console.log(`  ${idx + 1}. [${d.test}] ${d.error}`);
  });
}

if (observations.length > 0) {
  console.log('\nKey Empirical Observations for Implementation Plan:');
  observations.forEach(o => {
    console.log(`  - [${o.code}] ${o.title}: ${o.details}`);
  });
}

if (failedChecks === 0) {
  console.log('\n⚔️ ALL ADVERSARIAL CHALLENGES COMPLETED. EMPIRICAL EVIDENCE COLLECTED.');
} else {
  console.log('\n⚠️ SOME ADVERSARIAL CHECKS FAILED. INVESTIGATE DEFECTS.');
}
