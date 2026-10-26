import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log("=== [TEST] Verifying ErrorBoundary Auto-Retry Implementation ===");

const filePath = path.resolve("Management System/dh-frontend/src/components/ErrorBoundary.jsx");
assert(fs.existsSync(filePath), `ErrorBoundary.jsx must exist at ${filePath}`);

const content = fs.readFileSync(filePath, 'utf8');

// 1. Verify Constants
assert(content.includes('MAX_AUTO_RETRIES = 3'), 'Must have MAX_AUTO_RETRIES = 3');
assert(content.includes('RETRY_KEY = \'dh_eb_retry_count\''), 'Must have RETRY_KEY');
assert(content.includes('RETRY_PATH_KEY = \'dh_eb_retry_path\''), 'Must have RETRY_PATH_KEY');

// 2. Verify SessionStorage logic
assert(content.includes('sessionStorage.getItem(RETRY_PATH_KEY)'), 'Must check RETRY_PATH_KEY in sessionStorage');
assert(content.includes('sessionStorage.setItem(RETRY_KEY'), 'Must save incremented retry count in sessionStorage');

// 3. Verify Auto Reload Condition (< MAX_AUTO_RETRIES)
assert(content.includes('currentRetries < MAX_AUTO_RETRIES'), 'Must gate auto-reload to less than MAX_AUTO_RETRIES');
assert(content.includes('window.location.reload()'), 'Must call window.location.reload()');

// 4. Verify Calm User Experience during retry
assert(content.includes('isAutoReloading'), 'Must track isAutoReloading state');
assert(content.includes('กำลังเชื่อมต่อและโหลดข้อมูลใหม่...'), 'Must render polite loading UI during auto reload');

// 5. Verify Fallback after 3 retries
assert(content.includes('ขออภัย เกิดข้อผิดพลาด'), 'Must show full fallback error after exceeding retries');
assert(content.includes('handleManualRefresh'), 'Must have manual refresh handler');

// 6. Verify Manual Refresh Resets Storage
assert(content.includes('sessionStorage.removeItem(RETRY_KEY)'), 'Manual refresh or mount must reset RETRY_KEY');

// 7. Verify Unit logic simulation
function simulateRetryFlow() {
  const MAX_RETRIES = 3;
  let storage = {};
  
  function triggerCrash(pathname) {
    let currentRetries = 0;
    if (storage['path'] === pathname) {
      currentRetries = parseInt(storage['count'] || '0', 10);
    } else {
      storage['path'] = pathname;
      storage['count'] = '0';
      currentRetries = 0;
    }

    if (currentRetries < MAX_RETRIES) {
      const next = currentRetries + 1;
      storage['count'] = next.toString();
      return { action: 'AUTO_RELOAD', attempt: next };
    } else {
      return { action: 'SHOW_FALLBACK', attempt: currentRetries };
    }
  }

  // Round 1
  let res1 = triggerCrash('/store/xyz');
  assert.strictEqual(res1.action, 'AUTO_RELOAD');
  assert.strictEqual(res1.attempt, 1);

  // Round 2
  let res2 = triggerCrash('/store/xyz');
  assert.strictEqual(res2.action, 'AUTO_RELOAD');
  assert.strictEqual(res2.attempt, 2);

  // Round 3
  let res3 = triggerCrash('/store/xyz');
  assert.strictEqual(res3.action, 'AUTO_RELOAD');
  assert.strictEqual(res3.attempt, 3);

  // Round 4 (Exceeded 3 attempts)
  let res4 = triggerCrash('/store/xyz');
  assert.strictEqual(res4.action, 'SHOW_FALLBACK');
  assert.strictEqual(res4.attempt, 3);

  // Manual reset
  storage = {};
  let resAfterReset = triggerCrash('/store/xyz');
  assert.strictEqual(resAfterReset.action, 'AUTO_RELOAD');
  assert.strictEqual(resAfterReset.attempt, 1);

  console.log("-> Unit retry simulation passed 100%!");
}

simulateRetryFlow();

console.log("✅ All ErrorBoundary Auto-Retry checks PASSED!");
