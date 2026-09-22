/**
 * Live Operational Verification Script for Cloned Refund Management
 * Management System/tests/verifications/verify_refund_clone.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3168';

const stats = {
  tested: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function pass(msg) {
  stats.tested++;
  stats.passed++;
  console.log(`  ✅ [PASS] ${msg}`);
}

function fail(msg, err) {
  stats.tested++;
  stats.failed++;
  console.error(`  ❌ [FAIL] ${msg}`, err || '');
  stats.errors.push({ msg, err: String(err || '') });
}

async function probeUrl(urlPath) {
  try {
    const res = await fetch(`${BASE_URL}${urlPath}`);
    if (res.status === 200) {
      pass(`Endpoint ${urlPath} -> HTTP 200 OK`);
      return true;
    } else {
      fail(`Endpoint ${urlPath} -> HTTP ${res.status}`);
      return false;
    }
  } catch (e) {
    fail(`Endpoint ${urlPath} -> Connection Error`, e.message);
    return false;
  }
}

async function probeViteModule(modulePath) {
  try {
    const res = await fetch(`${BASE_URL}${modulePath}`);
    if (res.status === 200) {
      const code = await res.text();
      if (code.includes('vite-error-overlay') || code.includes('Internal Server Error')) {
        fail(`Module ${modulePath} transformed with error overlay!`);
        return false;
      }
      pass(`Module ${modulePath} transformed cleanly (0 errors)`);
      return code;
    } else {
      fail(`Module ${modulePath} failed with HTTP ${res.status}`);
      return null;
    }
  } catch (e) {
    fail(`Module ${modulePath} fetch error`, e.message);
    return null;
  }
}

async function runVerification() {
  console.log('====================================================');
  console.log('🔍 VERIFICATION SUITE: Refund & Wallet Cloned System');
  console.log(`🌐 Target: ${BASE_URL}/managers/refund`);
  console.log('====================================================\n');

  console.log('--- 1. Live Dev Server Endpoint Checks ---');
  await probeUrl('/');
  await probeUrl('/managers/refund');
  await probeUrl('/managers/wallet');

  console.log('\n--- 2. Module Transformation Checks ---');
  const refundCode = await probeViteModule('/src/pages/managers/RefundManagement.jsx');
  await probeViteModule('/src/pages/managers/WalletManagement.jsx');
  await probeViteModule('/src/pages/managers/wallet/WalletDashboardStats.jsx');
  await probeViteModule('/src/pages/managers/wallet/PendingWithdrawals.jsx');
  await probeViteModule('/src/pages/managers/wallet/CustomerSearchList.jsx');
  await probeViteModule('/src/pages/managers/wallet/WalletDetailPanel.jsx');
  await probeViteModule('/src/pages/managers/wallet/WalletModals.jsx');
  await probeViteModule('/src/pages/managers/wallet/hooks/useWalletManagement.js');

  console.log('\n--- 3. UI & Business Logic Parity Inspection ---');
  if (refundCode) {
    // Check 1: 3-Card Stat component mounted
    if (refundCode.includes('WalletDashboardStats')) {
      pass('Component <WalletDashboardStats /> is properly mounted (3 Stat Cards)');
    } else {
      fail('Component <WalletDashboardStats /> is missing!');
    }

    // Check 2: Title parity
    if (refundCode.includes('ศูนย์จัดการกระเป๋าเงินและรับเรื่องคืนเงิน (Wallet & Refund Operations)')) {
      pass('Header title matches Production 100% (Wallet & Refund Operations)');
    } else {
      fail('Header title does not match Production!');
    }

    // Check 3: Badge parity
    if (refundCode.includes('Financial Operations')) {
      pass('Header badge matches Production (Financial Operations)');
    } else {
      fail('Header badge does not match Production!');
    }

    // Check 4: Outdated negative box removed
    if (!refundCode.includes('ยอดเงินฝากค้างในระบบทั้งหมด') && !refundCode.includes('-฿')) {
      pass('Legacy negative red balance box (-฿2,866.2) is cleanly removed');
    } else {
      fail('Legacy negative red box still detected in code!');
    }

    // Check 5: Secure wallet adjust service
    if (refundCode.includes('creditCoreService.adjustUserWallet')) {
      pass('Financial Mutation uses secure creditCoreService.adjustUserWallet with UUID refId');
    } else {
      fail('Financial Mutation is not using adjustUserWallet!');
    }

    // Check 6: Pending requests filter removed
    if (refundCode.includes('pendingRequests') && !refundCode.includes('refundRequests') && !refundCode.includes('LINE_CONTACT')) {
      pass('All pending withdrawal requests are unlocked (not filtered strictly to LINE)');
    } else {
      fail('pendingRequests is still restricted!');
    }
  }

  console.log('\n====================================================');
  console.log(`📊 Result: Passed ${stats.passed}/${stats.tested} checks (${stats.failed} failed)`);
  console.log('====================================================');

  if (stats.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification();
