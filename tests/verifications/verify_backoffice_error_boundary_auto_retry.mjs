import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log("=== [TEST] Verifying Backoffice & Staff ErrorBoundary Auto-Retry Implementation ===");

// 1. Check Backoffice ErrorBoundary
const boPath = path.resolve("Management System/dh-backoffice-react/src/components/ErrorBoundary.jsx");
assert(fs.existsSync(boPath), `ErrorBoundary.jsx must exist at ${boPath}`);

const boContent = fs.readFileSync(boPath, 'utf8');

assert(boContent.includes('MAX_AUTO_RETRIES = 3'), 'Backoffice: Must have MAX_AUTO_RETRIES = 3');
assert(boContent.includes('RETRY_KEY = \'dh_bo_retry_count\''), 'Backoffice: Must have RETRY_KEY');
assert(boContent.includes('RETRY_PATH_KEY = \'dh_bo_retry_path\''), 'Backoffice: Must have RETRY_PATH_KEY');
assert(boContent.includes('sessionStorage.getItem(RETRY_PATH_KEY)'), 'Backoffice: Must check RETRY_PATH_KEY');
assert(boContent.includes('currentRetries < MAX_AUTO_RETRIES'), 'Backoffice: Must gate auto-reload < MAX_AUTO_RETRIES');
assert(boContent.includes('window.location.reload()'), 'Backoffice: Must call window.location.reload()');
assert(boContent.includes('กำลังเชื่อมต่อและโหลดข้อมูลใหม่...'), 'Backoffice: Must render polite loading UI during auto reload');
assert(boContent.includes('handleManualRefresh'), 'Backoffice: Must have handleManualRefresh to reset count');

// 2. Check Staff App ErrorBoundary
const staffPath = path.resolve("Management System/dh-staff-app/src/components/ErrorBoundary.jsx");
assert(fs.existsSync(staffPath), `ErrorBoundary.jsx must exist at ${staffPath}`);

const staffContent = fs.readFileSync(staffPath, 'utf8');

assert(staffContent.includes('MAX_AUTO_RETRIES = 3'), 'Staff: Must have MAX_AUTO_RETRIES = 3');
assert(staffContent.includes('RETRY_KEY = \'dh_staff_retry_count\''), 'Staff: Must have RETRY_KEY');
assert(staffContent.includes('currentRetries < MAX_AUTO_RETRIES'), 'Staff: Must gate auto-reload < MAX_AUTO_RETRIES');
assert(staffContent.includes('window.location.reload()'), 'Staff: Must call window.location.reload()');
assert(staffContent.includes('กำลังเชื่อมต่อและโหลดข้อมูลใหม่...'), 'Staff: Must render polite loading UI during auto reload');
assert(staffContent.includes('handleManualRefresh'), 'Staff: Must have handleManualRefresh to reset count');

// 3. Logic Simulation
function simulateRetryFlow(maxRetries = 3) {
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

    if (currentRetries < maxRetries) {
      const next = currentRetries + 1;
      storage['count'] = next.toString();
      return { action: 'AUTO_RELOAD', attempt: next };
    } else {
      return { action: 'SHOW_FALLBACK', attempt: currentRetries };
    }
  }

  // Attempt 1: Auto Reload
  let r1 = triggerCrash('/customers');
  assert.strictEqual(r1.action, 'AUTO_RELOAD');
  assert.strictEqual(r1.attempt, 1);

  // Attempt 2: Auto Reload
  let r2 = triggerCrash('/customers');
  assert.strictEqual(r2.action, 'AUTO_RELOAD');
  assert.strictEqual(r2.attempt, 2);

  // Attempt 3: Auto Reload
  let r3 = triggerCrash('/customers');
  assert.strictEqual(r3.action, 'AUTO_RELOAD');
  assert.strictEqual(r3.attempt, 3);

  // Attempt 4: Show Fallback (limit exceeded)
  let r4 = triggerCrash('/customers');
  assert.strictEqual(r4.action, 'SHOW_FALLBACK');
  assert.strictEqual(r4.attempt, 3);

  // Reset
  storage = {};
  let r5 = triggerCrash('/customers');
  assert.strictEqual(r5.action, 'AUTO_RELOAD');
  assert.strictEqual(r5.attempt, 1);

  console.log("-> Unit retry simulation passed 100%!");
}

simulateRetryFlow();

console.log("✅ All Backoffice & Staff ErrorBoundary Auto-Retry checks PASSED!");
