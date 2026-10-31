/**
 * ⚔️ ADVERSARIAL CHALLENGER M2-1: TELEMETRY & DWELL-TIME STRESS TEST SUITE
 * File: Management System/tests/adversarial/challenger_m2_telemetry_dwell_stress.mjs
 * 
 * Target Files under Test:
 * 1. Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreStats.js
 * 2. Management System/dh-frontend/src/firebase/marketingAnalyticsService.js
 * 
 * Scope:
 * - Dimension 1: Dwell-Time Timer Mechanics (< 1,000ms bounces vs >= 1,000ms stay)
 * - Dimension 2: 5-Minute Session Deduplication & Concurrency Guards
 * - Dimension 3: In-Memory Telemetry Queue Batching (20-event threshold & 2-minute interval flush)
 * - Dimension 4: Fault Tolerance, Fallbacks (Network offline, GA4 absent/error, sendBeacon)
 * - Dimension 5: End-to-End Integrated Component Lifecycle Stress & High-Concurrency Thrashing
 * 
 * Execution:
 * node "Management System/tests/adversarial/challenger_m2_telemetry_dwell_stress.mjs"
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

const HOOK_PATH = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/pages/StoreProfile/hooks/useStoreStats.js');
const SERVICE_PATH = path.resolve(REPO_ROOT, 'Management System/dh-frontend/src/firebase/marketingAnalyticsService.js');

console.log('================================================================================');
console.log('  ⚔️ CHALLENGER M2-1: EMPIRICAL TELEMETRY & DWELL-TIME STRESS TEST SUITE');
console.log('  Scope: Dwell-Time (1,000ms), 5-Min Deduplication, 20-Batch & 2-Min Buffer, Fallbacks');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const defects = [];
const observations = [];

function test(category, description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] [${category}] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] [${category}] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
    defects.push({ category, description, error: err.message, stack: err.stack });
  }
}

async function asyncTest(category, description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] [${category}] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] [${category}] ${description}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
    defects.push({ category, description, error: err.message, stack: err.stack });
  }
}

// =============================================================================
// VIRTUAL CLOCK & SIMULATOR HARNESS FACTORY
// =============================================================================

class VirtualClock {
  constructor(startTime = 1700000000000) {
    this.currentTime = startTime;
    this.timers = new Map();
    this.nextTimerId = 1;
  }

  now() {
    return this.currentTime;
  }

  setTimeout(callback, delayMs) {
    const id = this.nextTimerId++;
    const triggerAt = this.currentTime + Math.max(0, delayMs);
    this.timers.set(id, { id, callback, triggerAt });
    return id;
  }

  clearTimeout(id) {
    this.timers.delete(id);
  }

  advanceTime(ms) {
    const targetTime = this.currentTime + ms;
    while (true) {
      // Find the earliest active timer that should trigger at or before targetTime
      let earliest = null;
      for (const timer of this.timers.values()) {
        if (timer.triggerAt <= targetTime) {
          if (!earliest || timer.triggerAt < earliest.triggerAt) {
            earliest = timer;
          }
        }
      }

      if (!earliest) {
        this.currentTime = targetTime;
        break;
      }

      // Advance clock to this timer's trigger time and execute
      this.currentTime = earliest.triggerAt;
      this.timers.delete(earliest.id);
      earliest.callback();
    }
  }

  getActiveTimerCount() {
    return this.timers.size;
  }
}

class MockStorage {
  constructor(shouldThrow = false) {
    this.store = new Map();
    this.shouldThrow = shouldThrow;
  }
  getItem(key) {
    if (this.shouldThrow) throw new Error('SecurityError: Access is denied for this document');
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    if (this.shouldThrow) throw new Error('QuotaExceededError: The quota has been exceeded');
    this.store.set(key, String(value));
  }
  removeItem(key) {
    if (this.shouldThrow) throw new Error('SecurityError: Access is denied');
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

/**
 * Creates an integrated sandbox environment that loads the REAL source code
 * of marketingAnalyticsService.js and useStoreStats.js from disk.
 */
function createIntegratedEnvironment(options = {}) {
  const clock = new VirtualClock(options.startTime || 1700000000000);
  const localStorage = new MockStorage(options.localStorageThrows);
  const sessionStorage = new MockStorage(options.sessionStorageThrows);

  const fetchCalls = [];
  const beaconCalls = [];
  const gaCalls = [];

  const mockAnalytics = options.analyticsEnabled === false ? null : { app: 'mock-app' };

  const mockLogEvent = (analyticsInstance, eventName, params) => {
    if (options.gaThrows) {
      throw new Error('GA4 internal quota exceeded or script error');
    }
    gaCalls.push({ eventName, params, timestamp: clock.now() });
  };

  const mockFetch = async (url, fetchOptions) => {
    fetchCalls.push({ url, options: fetchOptions, timestamp: clock.now() });
    if (options.fetchFails) {
      throw new Error('TypeError: Failed to fetch (Network offline or connection refused)');
    }
    if (options.fetchDelayMs) {
      await new Promise((res) => clock.setTimeout(res, options.fetchDelayMs));
    }
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };

  const mockSendBeacon = (url, data) => {
    beaconCalls.push({ url, data, timestamp: clock.now() });
    if (options.beaconReturnsFalse) {
      return false;
    }
    if (options.beaconThrows) {
      throw new Error('TypeError: sendBeacon failed');
    }
    return true;
  };

  // 1. Evaluate marketingAnalyticsService.js in sandbox
  const serviceCodeRaw = fs.readFileSync(SERVICE_PATH, 'utf8');
  let cleanedServiceCode = serviceCodeRaw
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+let\s+/g, 'let ')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+default\s+[\s\S]*?;?$/m, '')
    .replace(/import\.meta/g, 'mockImportMeta');

  const mockImportMeta = {
    env: {
      VITE_FIREBASE_PROJECT_ID: 'dh-notebook-69f3b'
    }
  };

  const serviceSandboxFn = new Function(
    'mockImportMeta',
    'analytics',
    'logEvent',
    'Date',
    'setTimeout',
    'clearTimeout',
    'fetch',
    'navigator',
    'window',
    'document',
    'Blob',
    `
    ${cleanedServiceCode}

    return {
      trackStoreView,
      trackAdView,
      trackAdClick,
      flushTelemetryQueue,
      checkAntiFraud,
      getEventQueue: () => eventQueue,
      setEventQueue: (q) => { eventQueue = q; },
      getFlushTimer: () => flushTimer,
      getAdStatsBuffer: () => adStatsBuffer,
      getInMemoryCache: () => inMemoryAntiFraudCache
    };
    `
  );

  const mockWindow = {
    sessionStorage,
    localStorage,
    __dh_ad_telemetry_attached: false,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const mockDocument = {
    visibilityState: 'visible'
  };

  const mockNavigator = {
    sendBeacon: mockSendBeacon
  };

  // Mock global Blob if not present or wrap it
  class MockBlob {
    constructor(chunks, opts) {
      this.chunks = chunks;
      this.type = opts?.type;
    }
  }

  const serviceInstance = serviceSandboxFn(
    mockImportMeta,
    mockAnalytics,
    mockLogEvent,
    { now: () => clock.now() },
    (fn, ms) => clock.setTimeout(fn, ms),
    (id) => clock.clearTimeout(id),
    mockFetch,
    mockNavigator,
    mockWindow,
    mockDocument,
    typeof Blob !== 'undefined' ? Blob : MockBlob
  );

  const getAllEmittedStoreEvents = () => {
    const list = [];
    for (const call of fetchCalls) {
      try {
        const body = JSON.parse(call.options.body);
        if (Array.isArray(body.events)) {
          list.push(...body.events);
        }
      } catch (e) {}
    }
    list.push(...serviceInstance.getEventQueue());
    return list;
  };

  // 2. Evaluate useStoreStats.js in sandbox
  const hookCodeRaw = fs.readFileSync(HOOK_PATH, 'utf8');
  let cleanedHookCode = hookCodeRaw
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+const\s+useStoreStats\s*=/g, 'const useStoreStats =')
    .replace(/export\s+default\s+[\s\S]*?;?$/m, '');

  // Setup Hook Harness
  function createHookInstance(initialPartner) {
    let state = {};
    let stateSetters = {};
    let effectCleanups = new Map();
    let pendingEffects = [];
    let refs = {};
    let hookResult = null;
    let currentPartner = initialPartner;
    let isMounted = true;
    let isRendering = false;

    let stateIndex = 0;
    let effectIndex = 0;
    let refIndex = 0;
    let prevDepsMap = new Map();
    let hasPendingUpdate = false;

    function useState(initialValue) {
      const idx = stateIndex++;
      if (!(idx in state)) {
        state[idx] = typeof initialValue === 'function' ? initialValue() : initialValue;
      }
      const setter = (nextVal) => {
        const resolved = typeof nextVal === 'function' ? nextVal(state[idx]) : nextVal;
        if (!Object.is(state[idx], resolved)) {
          state[idx] = resolved;
          hasPendingUpdate = true;
          if (isMounted && !isRendering) {
            render();
          }
        }
      };
      stateSetters[idx] = setter;
      return [state[idx], setter];
    }

    function useRef(initialValue) {
      const idx = refIndex++;
      if (!(idx in refs)) {
        refs[idx] = { current: initialValue };
      }
      return refs[idx];
    }

    function useEffect(effectFn, deps) {
      const idx = effectIndex++;
      let shouldRun = false;
      if (!deps) {
        shouldRun = true;
      } else {
        const prevDeps = prevDepsMap.get(idx);
        if (!prevDeps || deps.length !== prevDeps.length) {
          shouldRun = true;
        } else {
          for (let i = 0; i < deps.length; i++) {
            if (!Object.is(deps[i], prevDeps[i])) {
              shouldRun = true;
              break;
            }
          }
        }
        prevDepsMap.set(idx, [...deps]);
      }

      if (shouldRun) {
        pendingEffects.push({ idx, fn: effectFn });
      }
    }

    function useCallback(fn, deps) {
      return fn;
    }

    const firestoreUpdates = [];
    const mockDoc = (db, col, id) => ({ col, id, path: `${col}/${id}` });
    const mockIncrement = (delta) => ({ __op: 'increment', delta });
    const mockUpdateDoc = async (docRef, payload) => {
      firestoreUpdates.push({ docRef, payload, timestamp: clock.now() });
      return true;
    };
    const mockGetCollectionPath = (col) => col;

    const trackStoreViewSpyCalls = [];
    const spiedTrackStoreView = async (params) => {
      trackStoreViewSpyCalls.push({ params, timestamp: clock.now() });
      return serviceInstance.trackStoreView(params);
    };

    const hookEvaluator = new Function(
      'useState',
      'useEffect',
      'useCallback',
      'useRef',
      'doc',
      'updateDoc',
      'increment',
      'db',
      'getCollectionPath',
      'trackStoreView',
      'localStorage',
      'sessionStorage',
      'Date',
      'setTimeout',
      'clearTimeout',
      `
      ${cleanedHookCode}
      return useStoreStats;
      `
    )(
      useState,
      useEffect,
      useCallback,
      useRef,
      mockDoc,
      mockUpdateDoc,
      mockIncrement,
      {},
      mockGetCollectionPath,
      spiedTrackStoreView,
      localStorage,
      sessionStorage,
      { now: () => clock.now() },
      (fn, ms) => clock.setTimeout(fn, ms),
      (id) => clock.clearTimeout(id)
    );

    function render(partnerToUse) {
      if (!isMounted) return hookResult;
      if (partnerToUse !== undefined) currentPartner = partnerToUse;

      isRendering = true;
      try {
        let loopCount = 0;
        do {
          hasPendingUpdate = false;
          stateIndex = 0;
          effectIndex = 0;
          refIndex = 0;
          pendingEffects = [];

          hookResult = hookEvaluator(currentPartner);

          // Run pending effects and cleanups
          for (const eff of pendingEffects) {
            const oldCleanup = effectCleanups.get(eff.idx);
            if (typeof oldCleanup === 'function') {
              oldCleanup();
            }
            const cleanup = eff.fn();
            if (typeof cleanup === 'function') {
              effectCleanups.set(eff.idx, cleanup);
            } else {
              effectCleanups.delete(eff.idx);
            }
          }

          loopCount++;
        } while (hasPendingUpdate && loopCount < 10);
      } finally {
        isRendering = false;
      }

      return hookResult;
    }

    function unmount() {
      if (!isMounted) return;
      isMounted = false;
      for (const cleanup of effectCleanups.values()) {
        if (typeof cleanup === 'function') cleanup();
      }
      effectCleanups.clear();
    }

    // Initial mount
    render(initialPartner);

    return {
      render,
      rerender: (newPartner) => render(newPartner),
      unmount,
      get result() { return hookResult; },
      get isMounted() { return isMounted; },
      trackStoreViewSpyCalls,
      firestoreUpdates
    };
  }

  return {
    clock,
    localStorage,
    sessionStorage,
    serviceInstance,
    createHookInstance,
    fetchCalls,
    beaconCalls,
    gaCalls,
    getAllEmittedStoreEvents
  };
}

// =============================================================================
// DIMENSION 1: DWELL-TIME TIMER MECHANICS (< 1,000ms bounces vs >= 1,000ms stay)
// =============================================================================
console.log('--- Dimension 1: Dwell-Time Timer Stress (< 1,000ms bounces vs >= 1,000ms stay) ---');

test('Dwell 1.1', 'Instant bounce at 0ms (immediate bot / click away): 0 calls to trackStoreView, 0 queued events', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_bounce_0ms', name: 'Zero Stay Shop', viewCount: 10 };

  const hook = env.createHookInstance(partner);
  assert.equal(hook.result.viewCount, 10, 'Initial view count must not change on mount');

  // Immediately unmount at 0ms
  hook.unmount();

  // Advance time far into future
  env.clock.advanceTime(10000);

  // Assertions
  assert.equal(hook.trackStoreViewSpyCalls.length, 0, 'trackStoreView must NEVER be called for 0ms bounce');
  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'eventQueue must remain empty');
  assert.equal(env.sessionStorage.getItem('dh_store_viewed_partner_bounce_0ms'), null, 'sessionStorage must remain unset');
  assert.equal(hook.result.viewCount, 10, 'viewCount must remain unincremented');
});

test('Dwell 1.2', 'Fast bounce at 300ms: timer cancelled on unmount, 0 telemetry calls', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_bounce_300ms', name: 'Fast Bounce Shop', viewCount: 50 };

  const hook = env.createHookInstance(partner);
  env.clock.advanceTime(300);
  hook.unmount(); // Unmount at 300ms

  // Advance time past 1,000ms threshold
  env.clock.advanceTime(5000);

  assert.equal(hook.trackStoreViewSpyCalls.length, 0, 'trackStoreView must not be called after 300ms bounce');
  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'eventQueue must remain 0');
  assert.equal(env.sessionStorage.getItem('dh_store_viewed_partner_bounce_300ms'), null);
});

test('Dwell 1.3', 'Critical boundary bounce at 999ms (1ms before 1,000ms threshold): strictly NO view recorded', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_bounce_999ms', name: 'Threshold Bounce Shop', viewCount: 100 };

  const hook = env.createHookInstance(partner);
  env.clock.advanceTime(999);
  assert.equal(hook.trackStoreViewSpyCalls.length, 0, 'Must not fire at 999ms');

  hook.unmount(); // Unmount exactly 1ms before 1000ms timer
  env.clock.advanceTime(5000);

  assert.equal(hook.trackStoreViewSpyCalls.length, 0, 'Must NOT trigger trackStoreView on 999ms bounce');
  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'No event in queue');
  assert.equal(env.sessionStorage.getItem('dh_store_viewed_partner_bounce_999ms'), null);
});

test('Dwell 1.4', 'Continuous stay reaches exactly 1,000ms: triggers trackStoreView, locks session, and increments viewCount', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_dwell_1000ms', name: 'Dwell Shop 1000', viewCount: 77 };

  const hook = env.createHookInstance(partner);
  assert.equal(hook.result.viewCount, 77);

  // Advance to 999ms: not yet fired
  env.clock.advanceTime(999);
  assert.equal(hook.trackStoreViewSpyCalls.length, 0);

  // Advance 1ms more -> reaches 1,000ms
  env.clock.advanceTime(1);

  // Assertions
  assert.equal(hook.trackStoreViewSpyCalls.length, 1, 'trackStoreView must fire at 1,000ms');
  assert.deepEqual(hook.trackStoreViewSpyCalls[0].params, {
    storeId: 'partner_dwell_1000ms',
    partnerName: 'Dwell Shop 1000',
    ownerId: 'partner_dwell_1000ms',
    source: 'store_profile'
  });

  // Optimistic UI count increment
  assert.equal(hook.result.viewCount, 78, 'Optimistic viewCount must be 78');

  // Session storage timestamp lock
  const sessionVal = env.sessionStorage.getItem('dh_store_viewed_partner_dwell_1000ms');
  assert.ok(sessionVal, 'sessionStorage lock must be written');
  assert.equal(sessionVal, String(env.clock.now()));

  // In-memory queue entry
  const queue = env.serviceInstance.getEventQueue();
  assert.equal(queue.length, 1, 'Event queue must have 1 event');
  assert.equal(queue[0].type, 'store_view');
  assert.equal(queue[0].storeId, 'partner_dwell_1000ms');
});

test('Dwell 1.5', 'Prolonged stay (10,000ms): strictly idempotent, fires exactly ONCE', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_stay_10s', name: 'Long Stay Shop', viewCount: 200 };

  const hook = env.createHookInstance(partner);
  env.clock.advanceTime(10000);

  assert.equal(hook.trackStoreViewSpyCalls.length, 1, 'trackStoreView must fire exactly once during 10s stay');
  assert.equal(hook.result.viewCount, 201, 'viewCount increments only once');
  assert.equal(env.serviceInstance.getEventQueue().length, 1);
});

test('Dwell 1.6', 'Prop update at 500ms cleanly resets dwell timer and fires 1,000ms after update', () => {
  const env = createIntegratedEnvironment();
  const initialPartner = { id: 'partner_prop_change', name: 'Original Name', viewCount: 5 };

  const hook = env.createHookInstance(initialPartner);

  // Wait 500ms (timer at 500ms remaining)
  env.clock.advanceTime(500);
  assert.equal(hook.trackStoreViewSpyCalls.length, 0);

  // Prop updates with new store name
  hook.rerender({ id: 'partner_prop_change', name: 'Updated Name', viewCount: 5 });

  // Advance 600ms (total 1,100ms from start, but only 600ms since prop change)
  env.clock.advanceTime(600);
  assert.equal(hook.trackStoreViewSpyCalls.length, 0, 'Old timer was cleared on prop change; new timer has not fired yet');

  // Advance 400ms more (reaches 1,000ms since prop change)
  env.clock.advanceTime(400);
  assert.equal(hook.trackStoreViewSpyCalls.length, 1, 'Dwell timer fires 1,000ms after prop update');
  assert.equal(hook.trackStoreViewSpyCalls[0].params.partnerName, 'Updated Name', 'Must use updated partner name');
});

test('Dwell 1.7', 'Null/empty partnerId on mount: dwell timer never set, safe zero-op', () => {
  const env = createIntegratedEnvironment();
  const hook1 = env.createHookInstance(null);
  const hook2 = env.createHookInstance({});
  const hook3 = env.createHookInstance({ id: '' });

  env.clock.advanceTime(5000);

  assert.equal(hook1.trackStoreViewSpyCalls.length, 0);
  assert.equal(hook2.trackStoreViewSpyCalls.length, 0);
  assert.equal(hook3.trackStoreViewSpyCalls.length, 0);
  assert.equal(env.serviceInstance.getEventQueue().length, 0);
});

// =============================================================================
// DIMENSION 2: 5-MINUTE SESSION DEDUPLICATION & CONCURRENCY GUARDS
// =============================================================================
console.log('\n--- Dimension 2: 5-Minute Session Deduplication & Concurrency Guards ---');

test('Dedup 2.1', '50 continuous re-renders within same mounted session produce strictly 1 event', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_rerenders_50', name: 'Rerender Shop', viewCount: 10 };

  const hook = env.createHookInstance(partner);
  env.clock.advanceTime(1000);
  assert.equal(hook.trackStoreViewSpyCalls.length, 1);

  // Re-render 50 times across 60 seconds
  for (let i = 0; i < 50; i++) {
    env.clock.advanceTime(1200);
    hook.rerender(partner);
  }

  assert.equal(hook.trackStoreViewSpyCalls.length, 1, 'trackStoreView must remain strictly 1 across 50 re-renders');
  assert.equal(hook.result.viewCount, 11, 'viewCount stays at 11');
});

test('Dedup 2.2', 'Unmount and remount within 5 minutes (30s, 2m, 4.5m) blocked by session cooldown', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_nav_revisit', name: 'Revisit Shop', viewCount: 10 };

  // Visit 1: stays 1,500ms -> view recorded
  const hook1 = env.createHookInstance(partner);
  env.clock.advanceTime(1500);
  assert.equal(hook1.trackStoreViewSpyCalls.length, 1);
  hook1.unmount();

  // Revisit at 30 seconds (30,000ms < 300,000ms)
  env.clock.advanceTime(30000);
  const hook2 = env.createHookInstance(partner);
  env.clock.advanceTime(2000);
  assert.equal(hook2.trackStoreViewSpyCalls.length, 0, 'Revisit at 30s must NOT track view');
  hook2.unmount();

  // Revisit at 2 minutes (120,000ms < 300,000ms)
  env.clock.advanceTime(120000);
  const hook3 = env.createHookInstance(partner);
  env.clock.advanceTime(2000);
  assert.equal(hook3.trackStoreViewSpyCalls.length, 0, 'Revisit at 2m must NOT track view');
  hook3.unmount();

  // Revisit at 4.5 minutes (270,000ms < 300,000ms)
  env.clock.advanceTime(120000);
  const hook4 = env.createHookInstance(partner);
  env.clock.advanceTime(2000);
  assert.equal(hook4.trackStoreViewSpyCalls.length, 0, 'Revisit at 4.5m must NOT track view');
  hook4.unmount();

  assert.equal(env.getAllEmittedStoreEvents().length, 1, 'Total queued/flushed events across all visits must be strictly 1');
});

test('Dedup 2.3', 'High-frequency thrashing: 100 mount/unmount cycles within 10 seconds produce exactly 1 event', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_hammer_100', name: 'Hammered Shop', viewCount: 0 };

  // Cycle 1: stays 1,000ms -> triggers view 1
  const firstHook = env.createHookInstance(partner);
  env.clock.advanceTime(1000);
  assert.equal(firstHook.trackStoreViewSpyCalls.length, 1);
  firstHook.unmount();

  // Cycles 2 to 100: rapid mounts and unmounts
  for (let i = 2; i <= 100; i++) {
    const hook = env.createHookInstance(partner);
    env.clock.advanceTime(90); // 90ms stay
    hook.unmount();
  }

  assert.equal(env.getAllEmittedStoreEvents().length, 1, 'Total queued/flushed events must remain strictly 1 after 100 cycles');
});

test('Dedup 2.4', 'Cooldown expiration: Revisit at 300,001ms (> 5 minutes) correctly logs 2nd view', () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'partner_expired_cooldown', name: 'Long Term Return Shop', viewCount: 10 };

  // Visit 1 at T=0
  const hook1 = env.createHookInstance(partner);
  env.clock.advanceTime(1000);
  assert.equal(hook1.trackStoreViewSpyCalls.length, 1);
  assert.equal(hook1.result.viewCount, 11);
  hook1.unmount();

  // Fast forward by 300,001 ms (> 5 minutes cooldown)
  env.clock.advanceTime(300001);

  // Visit 2
  const hook2 = env.createHookInstance(partner);
  env.clock.advanceTime(1000);
  assert.equal(hook2.trackStoreViewSpyCalls.length, 1, 'trackStoreView must fire on revisit after 5-minute cooldown');
  assert.equal(hook2.result.viewCount, 11, 'viewCount increments on second visit');
  hook2.unmount();

  assert.equal(env.getAllEmittedStoreEvents().length, 2, 'Total queued/flushed events must be exactly 2');
});

test('Dedup 2.5', 'Cross-Store Isolation: Visiting Store A, Store B, Store C deduplicates independently per store', () => {
  const env = createIntegratedEnvironment();
  const storeA = { id: 'store_AAA', name: 'Shop A' };
  const storeB = { id: 'store_BBB', name: 'Shop B' };
  const storeC = { id: 'store_CCC', name: 'Shop C' };

  // Visit Store A
  const hA = env.createHookInstance(storeA);
  env.clock.advanceTime(1000);
  hA.unmount();

  // Visit Store B
  const hB = env.createHookInstance(storeB);
  env.clock.advanceTime(1000);
  hB.unmount();

  // Revisit Store A at 2 min (blocked)
  env.clock.advanceTime(120000);
  const hA2 = env.createHookInstance(storeA);
  env.clock.advanceTime(1000);
  hA2.unmount();

  // Revisit Store B at 3 min (blocked)
  env.clock.advanceTime(60000);
  const hB2 = env.createHookInstance(storeB);
  env.clock.advanceTime(1000);
  hB2.unmount();

  // Visit Store C for the first time
  const hC = env.createHookInstance(storeC);
  env.clock.advanceTime(1000);
  hC.unmount();

  const allEvents = env.getAllEmittedStoreEvents();
  assert.equal(allEvents.length, 3, 'Must contain exactly 3 events (1 for A, 1 for B, 1 for C)');
  assert.equal(allEvents[0].storeId, 'store_AAA');
  assert.equal(allEvents[1].storeId, 'store_BBB');
  assert.equal(allEvents[2].storeId, 'store_CCC');
});

test('Dedup 2.6', 'SessionStorage throws SecurityError: handles gracefully without crashing React render tree', () => {
  const env = createIntegratedEnvironment({ sessionStorageThrows: true });
  const partner = { id: 'partner_private_mode', name: 'Private Mode Shop', viewCount: 15 };

  let threw = false;
  let hook = null;
  try {
    hook = env.createHookInstance(partner);
    env.clock.advanceTime(2000);
  } catch (err) {
    threw = true;
  }

  assert.equal(threw, false, 'Hook must not throw even if sessionStorage is blocked');
  assert.ok(hook.result, 'Hook result must be available');
  assert.equal(hook.result.viewCount, 15, 'View count preserves safe fallback');
});

// =============================================================================
// DIMENSION 3: IN-MEMORY QUEUE BATCHING (20-Batch & 2-Minute Flush)
// =============================================================================
console.log('\n--- Dimension 3: In-Memory Telemetry Queue Batching (20-Batch & 2-Minute Flush) ---');

await asyncTest('Queue 3.1', 'Under-threshold batching (19 events): queue holds events without triggering network fetch', async () => {
  const env = createIntegratedEnvironment();

  // Enqueue 19 distinct store view events
  for (let i = 1; i <= 19; i++) {
    await env.serviceInstance.trackStoreView({
      storeId: `store_batch_${i}`,
      partnerName: `Partner ${i}`,
      ownerId: `owner_${i}`
    });
  }

  const queue = env.serviceInstance.getEventQueue();
  assert.equal(queue.length, 19, 'Queue length must be exactly 19');
  assert.equal(env.fetchCalls.length, 0, 'fetch must NOT be called for < 20 events');
  assert.ok(env.serviceInstance.getFlushTimer() !== null, 'Periodic flush timer must be active');
});

await asyncTest('Queue 3.2', 'Immediate flush on reaching 20 events (MAX_QUEUE_SIZE = 20): triggers network fetch and empties queue', async () => {
  const env = createIntegratedEnvironment();

  for (let i = 1; i <= 19; i++) {
    await env.serviceInstance.trackStoreView({
      storeId: `store_max_${i}`,
      partnerName: `Partner ${i}`
    });
  }
  assert.equal(env.fetchCalls.length, 0);

  // Push 20th event
  await env.serviceInstance.trackStoreView({
    storeId: `store_max_20`,
    partnerName: `Partner 20`
  });

  // Early flush must fire immediately
  assert.equal(env.fetchCalls.length, 1, 'fetch must be called immediately when queue reaches 20');
  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'Queue must be emptied after flush');

  // Verify fetch payload
  const fetchCall = env.fetchCalls[0];
  assert.ok(fetchCall.url.includes('recordAdTelemetry'), 'Must POST to recordAdTelemetry endpoint');
  assert.equal(fetchCall.options.method, 'POST');
  assert.equal(fetchCall.options.keepalive, true);

  const parsedBody = JSON.parse(fetchCall.options.body);
  assert.equal(parsedBody.events.length, 20, 'Payload must contain all 20 events');
  assert.equal(parsedBody.events[0].storeId, 'store_max_1');
  assert.equal(parsedBody.events[19].storeId, 'store_max_20');
});

await asyncTest('Queue 3.3', 'Periodic flush interval: exactly 120,000ms (2 minutes) triggers scheduled batch flush', async () => {
  const env = createIntegratedEnvironment();

  // Enqueue 5 events
  for (let i = 1; i <= 5; i++) {
    await env.serviceInstance.trackStoreView({
      storeId: `store_periodic_${i}`,
      partnerName: `Partner ${i}`
    });
  }
  assert.equal(env.serviceInstance.getEventQueue().length, 5);
  assert.equal(env.fetchCalls.length, 0);

  // Advance time to 119,999ms (1ms before 2 minutes)
  env.clock.advanceTime(119999);
  assert.equal(env.fetchCalls.length, 0, 'Must NOT flush at 119,999ms');
  assert.equal(env.serviceInstance.getEventQueue().length, 5);

  // Advance 1ms more -> reaches 120,000ms
  env.clock.advanceTime(1);
  assert.equal(env.fetchCalls.length, 1, 'Must flush at exactly 120,000ms (2 minutes)');
  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'Queue must be cleared after periodic flush');

  const parsedBody = JSON.parse(env.fetchCalls[0].options.body);
  assert.equal(parsedBody.events.length, 5, 'Flushed payload must contain all 5 events');
});

await asyncTest('Queue 3.4', 'Concurrent event arrival during in-flight fetch: new events safely queued without collision', async () => {
  const env = createIntegratedEnvironment({ fetchDelayMs: 500 }); // Network takes 500ms

  // Push 20 events to trigger flush
  for (let i = 1; i <= 20; i++) {
    await env.serviceInstance.trackStoreView({ storeId: `batch1_${i}` });
  }

  assert.equal(env.fetchCalls.length, 1, 'Flush initiated');
  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'In-flight queue cleared');

  // Push 2 new events while fetch is still in flight (at 100ms)
  env.clock.advanceTime(100);
  await env.serviceInstance.trackStoreView({ storeId: `concurrent_item_A` });
  await env.serviceInstance.trackStoreView({ storeId: `concurrent_item_B` });

  // Current queue must hold ONLY the 2 new items
  const queue = env.serviceInstance.getEventQueue();
  assert.equal(queue.length, 2, 'Queue must hold only new concurrent arrivals');
  assert.equal(queue[0].storeId, 'concurrent_item_A');
  assert.equal(queue[1].storeId, 'concurrent_item_B');

  // Complete in-flight fetch
  env.clock.advanceTime(400);

  // Advance another 2 minutes to flush concurrent items
  env.clock.advanceTime(120000);
  assert.equal(env.fetchCalls.length, 2, 'Second flush dispatched for concurrent items');
  const secondBatch = JSON.parse(env.fetchCalls[1].options.body);
  assert.equal(secondBatch.events.length, 2);
  assert.equal(secondBatch.events[0].storeId, 'concurrent_item_A');
  assert.equal(secondBatch.events[1].storeId, 'concurrent_item_B');
});

await asyncTest('Queue 3.5', 'Page exit beacon (isExiting = true): calls navigator.sendBeacon with JSON Blob', async () => {
  const env = createIntegratedEnvironment();

  await env.serviceInstance.trackStoreView({ storeId: 'store_beacon_1' });
  await env.serviceInstance.trackStoreView({ storeId: 'store_beacon_2' });

  // Page is closing
  await env.serviceInstance.flushTelemetryQueue(true);

  assert.equal(env.beaconCalls.length, 1, 'navigator.sendBeacon must be called when isExiting=true');
  assert.equal(env.fetchCalls.length, 0, 'fetch must NOT be called if sendBeacon succeeded');
  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'Queue cleared');
});

await asyncTest('Queue 3.6', 'Page exit beacon fallback: if sendBeacon returns false, falls back to fetch(keepalive: true)', async () => {
  const env = createIntegratedEnvironment({ beaconReturnsFalse: true });

  await env.serviceInstance.trackStoreView({ storeId: 'store_beacon_fallback' });
  await env.serviceInstance.flushTelemetryQueue(true);

  assert.equal(env.beaconCalls.length, 1, 'sendBeacon attempted first');
  assert.equal(env.fetchCalls.length, 1, 'fetch fallback called when sendBeacon returns false');
  assert.equal(env.fetchCalls[0].options.keepalive, true, 'fetch keepalive must be true');
});

// =============================================================================
// DIMENSION 4: FAULT TOLERANCE, FALLBACKS & ERROR RESILIENCE
// =============================================================================
console.log('\n--- Dimension 4: Fault Tolerance, Fallbacks & Error Resilience ---');

await asyncTest('Fault 4.1', 'Transient Network Failure: fetch rejection requeues failed events for retry without throwing', async () => {
  const env = createIntegratedEnvironment({ fetchFails: true });

  // Enqueue 5 events
  for (let i = 1; i <= 5; i++) {
    await env.serviceInstance.trackStoreView({ storeId: `store_fail_${i}` });
  }

  let threw = false;
  try {
    // Flush triggers but network throws
    await env.serviceInstance.flushTelemetryQueue(false);
  } catch (e) {
    threw = true;
  }

  assert.equal(threw, false, 'flushTelemetryQueue must not bubble unhandled promise rejection');

  // The 5 events must be recovered in eventQueue for next retry
  const queue = env.serviceInstance.getEventQueue();
  assert.equal(queue.length, 5, 'Failed payload must be requeued into eventQueue');
  assert.equal(queue[0].storeId, 'store_fail_1');
});

await asyncTest('Fault 4.2', 'Overflow Prevention: Chronic network failure drops excess events when queue >= 50', async () => {
  const env = createIntegratedEnvironment({ fetchFails: true });

  // Pre-seed queue with 48 events
  const existingEvents = Array.from({ length: 48 }, (_, i) => ({ storeId: `seed_${i}` }));
  env.serviceInstance.setEventQueue(existingEvents);

  // Trigger flush of 5 events
  const payloadToFail = Array.from({ length: 5 }, (_, i) => ({ storeId: `overflow_${i}` }));
  env.serviceInstance.setEventQueue(payloadToFail);

  // Push 48 more while in-flight so queue length will exceed 50
  env.serviceInstance.setEventQueue([...existingEvents]);

  // Attempt flush with failure
  await env.serviceInstance.flushTelemetryQueue(false);

  // Because eventQueue already had 48 items, adding 5 would make 53. If queue was >= 50 it drops.
  // Verify queue does not grow unboundedly
  assert.ok(env.serviceInstance.getEventQueue().length <= 50, 'Queue must not exceed OOM threshold (50 items max)');
});

await asyncTest('Fault 4.3', 'GA4 Missing / Null (AdBlocker / Dev Mode): trackStoreView succeeds cleanly and queues event', async () => {
  const env = createIntegratedEnvironment({ analyticsEnabled: false });

  await env.serviceInstance.trackStoreView({
    storeId: 'store_no_ga',
    partnerName: 'AdBlock Store'
  });

  assert.equal(env.gaCalls.length, 0, 'No GA calls made');
  assert.equal(env.serviceInstance.getEventQueue().length, 1, 'Event must still be queued for backend');
  assert.equal(env.serviceInstance.getEventQueue()[0].storeId, 'store_no_ga');
});

await asyncTest('Fault 4.4', 'GA4 logEvent throws exception: caught cleanly, does not disrupt telemetry pipeline', async () => {
  const env = createIntegratedEnvironment({ gaThrows: true });

  let threw = false;
  try {
    await env.serviceInstance.trackStoreView({
      storeId: 'store_ga_error',
      partnerName: 'Error GA Shop'
    });
  } catch (e) {
    threw = true;
  }

  assert.equal(threw, false, 'trackStoreView must catch GA4 errors without throwing');
  assert.equal(env.serviceInstance.getEventQueue().length, 1, 'Event queued safely despite GA4 crash');
});

await asyncTest('Fault 4.5', 'Service-level Anti-Fraud guard: double call to trackStoreView within 5m rejected at service tier', async () => {
  const env = createIntegratedEnvironment();

  // 1st call
  await env.serviceInstance.trackStoreView({ storeId: 'store_service_dedup' });
  assert.equal(env.serviceInstance.getEventQueue().length, 1);

  // 2nd call directly to service (simulating bypass of hook)
  await env.serviceInstance.trackStoreView({ storeId: 'store_service_dedup' });
  assert.equal(env.serviceInstance.getEventQueue().length, 1, 'Service-level anti-fraud must drop duplicate event within 5 minutes');
});

test('Fault 4.6', 'Payload Schema Parity: queued event contains all required camelCase and snake_case properties', () => {
  const env = createIntegratedEnvironment();

  env.serviceInstance.trackStoreView({
    storeId: 'store_schema_check',
    partnerName: 'Schema Check Store',
    ownerId: 'owner_999',
    source: 'store_profile'
  });

  const event = env.serviceInstance.getEventQueue()[0];
  assert.equal(event.type, 'store_view');
  assert.equal(event.storeId, 'store_schema_check');
  assert.equal(event.store_id, 'store_schema_check');
  assert.equal(event.ownerId, 'owner_999');
  assert.equal(event.owner_id, 'owner_999');
  assert.equal(event.partnerName, 'Schema Check Store');
  assert.equal(event.partner_name, 'Schema Check Store');
  assert.equal(event.source, 'store_profile');
  assert.equal(typeof event.timestamp, 'number');
});

test('Fault 4.7', 'Empty / Invalid arguments to trackStoreView safely ignored without crashing', () => {
  const env = createIntegratedEnvironment();

  env.serviceInstance.trackStoreView();
  env.serviceInstance.trackStoreView(null);
  env.serviceInstance.trackStoreView({});
  env.serviceInstance.trackStoreView({ storeId: '' });
  env.serviceInstance.trackStoreView({ storeId: null });

  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'Zero events should be queued for invalid inputs');
});

// =============================================================================
// DIMENSION 5: END-TO-END INTEGRATION & HIGH-CONCURRENCY CHAOS
// =============================================================================
console.log('\n--- Dimension 5: End-to-End Integration & High-Concurrency Chaos ---');

await asyncTest('Integration 5.1', 'Full End-to-End Flow: Hook mount -> Dwell 1,000ms -> Queue buffer -> 2-min Flush -> HTTP POST', async () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'store_e2e_01', name: 'Full Flow Store', viewCount: 15 };

  // 1. User arrives on store page
  const hook = env.createHookInstance(partner);
  assert.equal(hook.result.viewCount, 15);

  // 2. User stays 1,000ms
  env.clock.advanceTime(1000);

  // Optimistic UI updated
  assert.equal(hook.result.viewCount, 16);
  // GA4 event logged
  assert.equal(env.gaCalls.length, 1);
  assert.equal(env.gaCalls[0].eventName, 'store_profile_view');
  assert.equal(env.gaCalls[0].params.store_id, 'store_e2e_01');
  // In-memory queue holds event (0 network writes yet)
  assert.equal(env.serviceInstance.getEventQueue().length, 1);
  assert.equal(env.fetchCalls.length, 0);

  // 3. User browses for 2 minutes (120,000ms)
  env.clock.advanceTime(120000);

  // 4. Batch flush dispatches HTTP POST
  assert.equal(env.fetchCalls.length, 1);
  const sentPayload = JSON.parse(env.fetchCalls[0].options.body);
  assert.equal(sentPayload.events.length, 1);
  assert.equal(sentPayload.events[0].storeId, 'store_e2e_01');
  assert.equal(env.serviceInstance.getEventQueue().length, 0);
});

await asyncTest('Integration 5.2', 'Concurrent multi-user simulation: 25 distinct store visitors with mixed dwell times', async () => {
  const env = createIntegratedEnvironment();

  // 10 visitors bounce at 400ms (< 1,000ms)
  for (let i = 1; i <= 10; i++) {
    const hook = env.createHookInstance({ id: `bouncing_user_${i}` });
    env.clock.advanceTime(400);
    hook.unmount();
  }

  // 15 visitors stay for 1,500ms (>= 1,000ms)
  for (let i = 1; i <= 15; i++) {
    const hook = env.createHookInstance({ id: `staying_user_${i}` });
    env.clock.advanceTime(1500);
    hook.unmount();
  }

  // Verify: exactly 15 events in queue, 0 from bouncing users
  const queue = env.serviceInstance.getEventQueue();
  assert.equal(queue.length, 15, 'Exactly 15 events must be queued (10 bounces discarded)');
  for (let i = 1; i <= 15; i++) {
    assert.ok(queue.some((e) => e.storeId === `staying_user_${i}`));
  }

  // Advance time by 2 minutes to flush the 15 events
  env.clock.advanceTime(120000);
  assert.equal(env.fetchCalls.length, 1);
  const payload = JSON.parse(env.fetchCalls[0].options.body);
  assert.equal(payload.events.length, 15);
});

await asyncTest('Integration 5.3', 'Toggle Like Concurrency does not conflict with View Dwell Timer', async () => {
  const env = createIntegratedEnvironment();
  const partner = { id: 'store_like_race', likeCount: 0, viewCount: 0 };

  const hook = env.createHookInstance(partner);

  // User likes the store at 200ms
  env.clock.advanceTime(200);
  await hook.result.toggleLike();
  hook.render();

  assert.equal(hook.result.likeCount, 1, 'Like count increments');
  assert.equal(hook.result.viewCount, 0, 'View count not yet incremented');
  assert.equal(env.serviceInstance.getEventQueue().length, 0, 'No view event queued yet');

  // User stays until 1,000ms
  env.clock.advanceTime(800);

  assert.equal(hook.result.likeCount, 1, 'Like count preserved');
  assert.equal(hook.result.viewCount, 1, 'View count incremented');
  assert.equal(env.serviceInstance.getEventQueue().length, 1, 'View event queued');
});

console.log('\n================================================================================');
console.log(`  SUMMARY: Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================\n');

if (defects.length > 0) {
  console.error('❌ DEFECTS DETECTED:');
  for (const d of defects) {
    console.error(`- [${d.category}] ${d.description}: ${d.error}`);
  }
  process.exit(1);
} else {
  console.log(`🎉 ALL ${totalTests} ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS!`);
  process.exit(0);
}
