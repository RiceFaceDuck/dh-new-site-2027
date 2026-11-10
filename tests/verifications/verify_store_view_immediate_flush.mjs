/**
 * Verify store view telemetry is never silently lost:
 * 1. trackStoreView sends to server immediately (no 2-min buffer)
 * 2. Non-OK HTTP response (500) re-queues the event and schedules retry
 * 3. Re-evaluating the module (Vite HMR) replaces old lifecycle listeners (no stale empty-queue flush)
 * 4. Fallback partner (users/{id}/storeProfile/main) forwards `views` map
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const svcPath = path.join(ROOT, 'dh-frontend/src/firebase/marketingAnalyticsService.js');
const rawSrc = fs.readFileSync(svcPath, 'utf8');

// Stub firebase imports so the module can be evaluated in Node
const src = rawSrc
  .replace(/import \{ analytics \} from '\.\/config';/, 'const analytics = null;')
  .replace(/import \{ logEvent \} from 'firebase\/analytics';/, 'const logEvent = () => {};');

// Minimal browser globals
const listeners = { visibilitychange: new Set(), pagehide: new Set() };
const store = new Map();
globalThis.window = {
  addEventListener: (t, fn) => listeners[t]?.add(fn),
  removeEventListener: (t, fn) => listeners[t]?.delete(fn),
  localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
};
globalThis.document = { visibilityState: 'visible' };

const calls = [];
let nextStatus = 200;
globalThis.fetch = async (url, opts) => {
  calls.push({ url, body: JSON.parse(opts.body), headers: opts.headers });
  return { ok: nextStatus < 400, status: nextStatus };
};

let evalCount = 0;
const loadModule = () => import(`data:text/javascript;base64,${Buffer.from(src + `\n// v${evalCount++}`).toString('base64')}`);

// --- Test 1: immediate flush ---
const m1 = await loadModule();
await m1.trackStoreView('STORE-A');
await new Promise((r) => setTimeout(r, 10));
assert.equal(calls.length, 1, 'trackStoreView must send immediately');
assert.equal(calls[0].body.events[0].storeId, 'STORE-A');
assert.equal(calls[0].headers['Content-Type'], 'text/plain;charset=UTF-8', 'Must use simple request (no preflight)');
assert.equal(m1.eventQueue.length, 0, 'Queue must be empty after successful send');
console.log('✅ [PASS] Test 1: store view sent immediately (no 2-min buffer, no preflight)');

// --- Test 2: HTTP 500 re-queues + schedules retry ---
nextStatus = 500;
await m1.trackStoreView('STORE-B');
await new Promise((r) => setTimeout(r, 10));
assert.equal(calls.length, 2);
assert.equal(m1.eventQueue.length, 1, 'Failed event must be re-queued, not dropped');
assert.equal(m1.eventQueue[0].storeId, 'STORE-B');
assert.ok(m1.flushTimer, 'Retry must be scheduled after failure');
clearTimeout(m1.flushTimer);
console.log('✅ [PASS] Test 2: HTTP 500 re-queues event and schedules retry');

// --- Test 3: anti-fraud cooldown still blocks repeat views ---
nextStatus = 200;
const before = calls.length;
await m1.trackStoreView('STORE-A');
assert.equal(calls.length, before, '30-min cooldown must block repeat view of same store');
console.log('✅ [PASS] Test 3: 30-min cooldown still prevents view pumping');

// --- Test 4: HMR re-evaluation replaces listeners ---
assert.equal(listeners.pagehide.size, 1);
await loadModule();
assert.equal(listeners.pagehide.size, 1, 'Old pagehide listener must be removed on re-evaluation');
assert.equal(listeners.visibilitychange.size, 1, 'Old visibility listener must be removed on re-evaluation');
console.log('✅ [PASS] Test 4: HMR re-evaluation keeps exactly 1 fresh lifecycle listener');

// --- Test 5: fallback partner forwards views map ---
const hookSrc = fs.readFileSync(path.join(ROOT, 'dh-frontend/src/pages/StoreProfile/hooks/useStoreProfilePage.js'), 'utf8');
assert.ok(/views:\s*\(uStore\.views && typeof uStore\.views === 'object'\)/.test(hookSrc), 'Fallback must forward views map');
assert.ok(!/uStore\.views \|\| 0\)/.test(hookSrc), 'viewCount must not coerce views object to NaN');
console.log('✅ [PASS] Test 5: fallback partner forwards views map safely');

console.log('\n🎉 All store view immediate-flush checks passed');
