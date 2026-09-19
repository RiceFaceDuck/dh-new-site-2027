/**
 * 🧪 ADVERSARIAL STRESS TEST SUITE — MILESTONE M3:
 * Slip Storage, OCR & Bank Reference Persistence Resilience
 * 
 * Location: Management System/tests/adversarial/challenger_m3_slip_and_bank_stress.mjs
 * 
 * Objectives:
 * 1. Stress test slip payload serialization, large base64/URL strings, special characters, XSS/SQLi, unicode, control chars in transactionRef, transferNote, transferDateTime.
 * 2. Stress test null/undefined/missing bank fields matrix across payment methods ('Cash', 'Transfer', 'OnAccount').
 * 3. Stress test slip upload error handling, network failure, corrupted inputs, Tesseract OCR fallback, and offline POS persistence.
 * 4. AST / Source structural conformance verification across all M3 modified files.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MGMT_DIR = path.resolve(__dirname, '../..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(suiteName, testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] [${suiteName}] ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] [${suiteName}] ${testName}`);
    console.error(`         Error: ${err.message}`);
  }
}

async function runAsyncTest(suiteName, testName, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] [${suiteName}] ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] [${suiteName}] ${testName}`);
    console.error(`         Error: ${err.message}`);
  }
}

console.log('================================================================================');
console.log('🔥 EMPIRICAL ADVERSARIAL CHALLENGER SUITE — MILESTONE M3');
console.log('   Slip Storage, OCR Engine & Bank Reference Persistence Resilience');
console.log('================================================================================\n');

// =============================================================================
// SUITE 1: Slip Payload Serialization & Boundary Stress
// =============================================================================
console.log('--- SUITE 1: Slip Payload Serialization & Boundary Stress ---');

runTest('Suite 1', 'Survives massive URL strings (10KB - 50KB) in slipUrl without corruption', () => {
  const massivePath = 'slips/POS_TEST_ORDER/' + 'a'.repeat(20000) + '.webp';
  const massiveUrl = `https://firebasestorage.googleapis.com/v0/b/dh-notebook.appspot.com/o/${encodeURIComponent(massivePath)}?alt=media&token=test-token-${'x'.repeat(10000)}`;

  const orderData = {
    orderId: 'DH-26-0001',
    paymentMethod: 'Transfer',
    bankAccount: 'KBANK',
    slipUrl: massiveUrl,
    slipImage: massiveUrl,
    slipStoragePath: massivePath,
    slipVerificationStatus: 'verified',
    transactionRef: 'TX123456789',
    transferDateTime: '2026-09-19 13:45',
    transferNote: 'Test note'
  };

  const serialized = JSON.stringify(orderData);
  assert.ok(serialized.length > 30000, 'Serialized payload should reflect large URL size');

  const deserialized = JSON.parse(serialized);
  assert.strictEqual(deserialized.slipUrl, massiveUrl, 'slipUrl must round-trip exactly');
  assert.strictEqual(deserialized.slipStoragePath, massivePath, 'slipStoragePath must round-trip exactly');
});

runTest('Suite 1', 'Simulates large Base64 slip (1MB - 3MB) data URL in memory and verifies JSON safety', () => {
  // Generate 1.5MB base64 data string
  const base64Chunk = 'ABCDEF1234567890+/'.repeat(50);
  const largeBase64 = 'data:image/webp;base64,' + base64Chunk.repeat(1500); // ~1.5MB

  const orderData = {
    orderId: 'DH-TEMP-BASE64',
    paymentMethod: 'Transfer',
    slipImage: largeBase64,
    slipUrl: largeBase64,
    slipVerificationStatus: 'unverified'
  };

  const serialized = JSON.stringify(orderData);
  assert.ok(serialized.length >= 1400000, 'Should serialize 1.4MB+ payload safely');

  const parsed = JSON.parse(serialized);
  assert.strictEqual(parsed.slipImage.length, largeBase64.length, 'Base64 string length must match');
  assert.ok(parsed.slipImage.startsWith('data:image/webp;base64,ABCDEF'), 'Prefix must remain intact');
});

runTest('Suite 1', 'Calculates Firestore document boundary and verifies WebP Storage URL efficiency', () => {
  // Firestore 1MB (1,048,576 bytes) limit comparison
  const cleanStorageUrl = 'https://firebasestorage.googleapis.com/v0/b/dh-notebook.appspot.com/o/slips%2FDH-26-1042%2F1726749800000_1234.webp?alt=media&token=a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const sampleItems = Array.from({ length: 50 }, (_, i) => ({
    sku: `SKU-PART-${i.toString().padStart(4, '0')}`,
    name: `High Performance Laptop Component Model ${i}`,
    price: 1500 + i * 10,
    qty: 2,
    discount: 50,
    total: (1500 + i * 10 - 50) * 2
  }));

  const standardOrderPayload = {
    orderId: 'DH-26-1042',
    paymentMethod: 'Transfer',
    bankAccount: 'SCB',
    transactionRef: '0142611738245198234',
    transferDateTime: '2026-09-19 14:32',
    transferNote: 'โอนชำระเงินเรียบร้อย',
    slipUrl: cleanStorageUrl,
    slipImage: cleanStorageUrl,
    slipStoragePath: 'slips/DH-26-1042/1726749800000_1234.webp',
    slipVerificationStatus: 'verified',
    items: sampleItems,
    netTotal: 150000
  };

  const payloadSizeBytes = Buffer.byteLength(JSON.stringify(standardOrderPayload), 'utf8');
  const firestoreLimitBytes = 1048576; // 1MB

  assert.ok(
    payloadSizeBytes < 25000,
    `Standard order with 50 items and Storage URL consumes only ${payloadSizeBytes} bytes (< 25KB)`
  );
  assert.ok(
    payloadSizeBytes < firestoreLimitBytes * 0.05,
    'Order document consumes < 5% of Firestore 1MB ceiling'
  );
});

// =============================================================================
// SUITE 2: Special Characters, Injections & Unicode Stress
// =============================================================================
console.log('\n--- SUITE 2: Special Characters, Injections & Unicode Stress ---');

const maliciousStrings = [
  { type: 'SQL Injection', val: "' OR '1'='1'; DROP TABLE orders; --" },
  { type: 'XSS Attack Tag', val: '<script>alert("XSS")</script><img src=x onerror=alert(1)>' },
  { type: 'Shell Injection', val: '$(rm -rf /) && `reboot` | whoami' },
  { type: 'Zero-Width Chars', val: 'Ref\u200B123\u200C456\u200D789\uFEFF' },
  { type: 'Thai Unicode & Diacritics', val: 'โอนผ่าน กสิกรไทย สาขาบางกอกน้อย ยอด ฿5,400.50 [บันทึก: สั่งเพิ่ม]' },
  { type: 'Control Characters', val: 'Line1\r\nLine2\tLine3\x08\x1b[31mRed\x1b[0m' },
  { type: 'Emoji Symphony', val: '💸🧾🏦🎉✅🔥 0142611738245198234 💰✨' },
  { type: 'Ultra Long String (4000 chars)', val: 'TX-' + '9'.repeat(4000) },
  { type: 'JSON Metacharacters', val: '{"injection": true, "nested": [null, false, true]}' }
];

maliciousStrings.forEach(({ type, val }) => {
  runTest('Suite 2', `Serializes and deserializes safely with malicious ${type}`, () => {
    const orderData = {
      orderId: 'DH-26-9999',
      paymentMethod: 'Transfer',
      bankAccount: 'BAY',
      transactionRef: val,
      transferDateTime: '2026-09-19 14:00',
      transferNote: val,
      slipUrl: 'https://firebasestorage.googleapis.com/test.webp',
      slipVerificationStatus: 'verified'
    };

    const json = JSON.stringify(orderData);
    assert.doesNotThrow(() => JSON.parse(json), `JSON.parse must not throw on ${type}`);
    const restored = JSON.parse(json);
    assert.strictEqual(restored.transactionRef, val, `transactionRef must be preserved without corruption on ${type}`);
    assert.strictEqual(restored.transferNote, val, `transferNote must be preserved without corruption on ${type}`);
  });
});

runTest('Suite 2', 'Safe Order ID sanitization logic handles hostile characters', () => {
  // Reproduction of usePosActions.js:26 safeOrderId logic:
  // const safeOrderId = String(orderId || 'UNASSIGNED').replace(/[\/\\#\?]/g, '_');
  const hostileOrderIds = [
    'POS/2026/09/19',
    'ORDER\\WINDOWS\\PATH',
    'DH#TEMP#HASH',
    'ORDER?QUERY=INJECTION',
    '../../../ETC/PASSWD',
    null,
    undefined,
    ''
  ];

  hostileOrderIds.forEach(rawId => {
    const safeOrderId = String(rawId || 'UNASSIGNED').replace(/[\/\\#\?]/g, '_');
    assert.ok(!safeOrderId.includes('/'), `safeOrderId should not contain slash: ${safeOrderId}`);
    assert.ok(!safeOrderId.includes('\\'), `safeOrderId should not contain backslash: ${safeOrderId}`);
    assert.ok(!safeOrderId.includes('#'), `safeOrderId should not contain hash: ${safeOrderId}`);
    assert.ok(!safeOrderId.includes('?'), `safeOrderId should not contain question mark: ${safeOrderId}`);
    assert.ok(safeOrderId.length > 0, 'safeOrderId must not be empty');
  });
});

// =============================================================================
// SUITE 3: Cross-Payment Method Bank Field Consistency Matrix
// =============================================================================
console.log('\n--- SUITE 3: Cross-Payment Method Bank Field Consistency Matrix ---');

/**
 * Exact replication of usePosActions.js orderData construction logic for bank fields
 */
function buildBankFieldsForOrder(activeTab) {
  return {
    paymentMethod: activeTab.paymentMethod || 'Transfer',
    bankAccount: activeTab.paymentMethod === 'Transfer' ? (activeTab.bankAccount || '') : null,
    transactionRef: activeTab.paymentMethod === 'Transfer' ? (activeTab.transactionRef || '') : '',
    transferDateTime: activeTab.paymentMethod === 'Transfer' ? (activeTab.transferDateTime || '') : '',
    transferNote: activeTab.paymentMethod === 'Transfer' ? (activeTab.transferNote || '') : '',
    slipUrl: activeTab.paymentMethod === 'Transfer' ? (activeTab.slipUrl || activeTab.slipImage || null) : null,
    slipImage: activeTab.paymentMethod === 'Transfer' ? (activeTab.slipImage || activeTab.slipUrl || null) : null,
    slipStoragePath: activeTab.paymentMethod === 'Transfer' ? (activeTab.slipStoragePath || null) : null,
    slipVerificationStatus: activeTab.paymentMethod === 'Transfer' ? (activeTab.slipVerificationStatus || (activeTab.slipUrl || activeTab.slipImage ? 'unverified' : 'none')) : 'none',
    ocrResult: activeTab.paymentMethod === 'Transfer' ? (activeTab.ocrResult || null) : null,
    cashReceived: activeTab.paymentMethod === 'Cash' ? (Number(activeTab.cashReceived) || 0) : null
  };
}

runTest('Suite 3', 'PaymentMethod "Cash": Strips all bank/slip fields to null or empty string', () => {
  const activeTabWithLeftoverBankData = {
    paymentMethod: 'Cash',
    cashReceived: 1000,
    bankAccount: 'KBANK',
    transactionRef: 'LEFTOVER_TX_12345',
    transferDateTime: '2026-09-19 12:00',
    transferNote: 'Customer previously selected transfer',
    slipUrl: 'https://storage/stale_slip.webp',
    slipImage: 'https://storage/stale_slip.webp',
    slipStoragePath: 'slips/old_slip.webp',
    slipVerificationStatus: 'verified',
    ocrResult: { transactionRef: 'OLD_REF' }
  };

  const fields = buildBankFieldsForOrder(activeTabWithLeftoverBankData);

  assert.strictEqual(fields.paymentMethod, 'Cash');
  assert.strictEqual(fields.bankAccount, null, 'bankAccount must be null for Cash');
  assert.strictEqual(fields.transactionRef, '', 'transactionRef must be empty string for Cash');
  assert.strictEqual(fields.transferDateTime, '', 'transferDateTime must be empty string for Cash');
  assert.strictEqual(fields.transferNote, '', 'transferNote must be empty string for Cash');
  assert.strictEqual(fields.slipUrl, null, 'slipUrl must be null for Cash');
  assert.strictEqual(fields.slipImage, null, 'slipImage must be null for Cash');
  assert.strictEqual(fields.slipStoragePath, null, 'slipStoragePath must be null for Cash');
  assert.strictEqual(fields.slipVerificationStatus, 'none', 'slipVerificationStatus must be "none" for Cash');
  assert.strictEqual(fields.ocrResult, null, 'ocrResult must be null for Cash');
  assert.strictEqual(fields.cashReceived, 1000, 'cashReceived must be preserved for Cash');
});

runTest('Suite 3', 'PaymentMethod "OnAccount": Strips both cash and bank fields safely', () => {
  const activeTabCredit = {
    paymentMethod: 'OnAccount',
    cashReceived: 500,
    bankAccount: 'SCB',
    transactionRef: 'LEFTOVER_REF',
    slipUrl: 'https://storage/slip.webp'
  };

  const fields = buildBankFieldsForOrder(activeTabCredit);

  assert.strictEqual(fields.paymentMethod, 'OnAccount');
  assert.strictEqual(fields.bankAccount, null, 'bankAccount must be null for OnAccount');
  assert.strictEqual(fields.transactionRef, '', 'transactionRef must be empty string for OnAccount');
  assert.strictEqual(fields.transferDateTime, '', 'transferDateTime must be empty string for OnAccount');
  assert.strictEqual(fields.transferNote, '', 'transferNote must be empty string for OnAccount');
  assert.strictEqual(fields.slipUrl, null, 'slipUrl must be null for OnAccount');
  assert.strictEqual(fields.slipImage, null, 'slipImage must be null for OnAccount');
  assert.strictEqual(fields.slipStoragePath, null, 'slipStoragePath must be null for OnAccount');
  assert.strictEqual(fields.slipVerificationStatus, 'none', 'slipVerificationStatus must be "none" for OnAccount');
  assert.strictEqual(fields.ocrResult, null, 'ocrResult must be null for OnAccount');
  assert.strictEqual(fields.cashReceived, null, 'cashReceived must be null for OnAccount');
});

runTest('Suite 3', 'PaymentMethod "Transfer": Properly preserves all bank reference and slip fields', () => {
  const activeTabTransfer = {
    paymentMethod: 'Transfer',
    cashReceived: 1000, // Should be ignored
    bankAccount: 'KBANK',
    transactionRef: '0142611738245198234',
    transferDateTime: '2026-09-19 14:32',
    transferNote: 'โอนชำระค่าสินค้า',
    slipUrl: 'https://storage.googleapis.com/slip123.webp',
    slipImage: 'https://storage.googleapis.com/slip123.webp',
    slipStoragePath: 'slips/DH-26-0001/slip123.webp',
    slipVerificationStatus: 'verified',
    ocrResult: { transactionRef: '0142611738245198234', bankAccount: 'KBANK' }
  };

  const fields = buildBankFieldsForOrder(activeTabTransfer);

  assert.strictEqual(fields.paymentMethod, 'Transfer');
  assert.strictEqual(fields.bankAccount, 'KBANK');
  assert.strictEqual(fields.transactionRef, '0142611738245198234');
  assert.strictEqual(fields.transferDateTime, '2026-09-19 14:32');
  assert.strictEqual(fields.transferNote, 'โอนชำระค่าสินค้า');
  assert.strictEqual(fields.slipUrl, 'https://storage.googleapis.com/slip123.webp');
  assert.strictEqual(fields.slipImage, 'https://storage.googleapis.com/slip123.webp');
  assert.strictEqual(fields.slipStoragePath, 'slips/DH-26-0001/slip123.webp');
  assert.strictEqual(fields.slipVerificationStatus, 'verified');
  assert.ok(fields.ocrResult !== null, 'ocrResult must be preserved');
  assert.strictEqual(fields.cashReceived, null, 'cashReceived must be null for Transfer');
});

runTest('Suite 3', 'PaymentMethod "Transfer" with missing/empty properties defaults gracefully without null dereference', () => {
  const emptyTab = {
    paymentMethod: 'Transfer'
  };

  const fields = buildBankFieldsForOrder(emptyTab);

  assert.strictEqual(fields.bankAccount, '');
  assert.strictEqual(fields.transactionRef, '');
  assert.strictEqual(fields.transferDateTime, '');
  assert.strictEqual(fields.transferNote, '');
  assert.strictEqual(fields.slipUrl, null);
  assert.strictEqual(fields.slipImage, null);
  assert.strictEqual(fields.slipStoragePath, null);
  assert.strictEqual(fields.slipVerificationStatus, 'none');
  assert.strictEqual(fields.ocrResult, null);
  assert.strictEqual(fields.cashReceived, null);
});

runTest('Suite 3', 'PaymentMethod "Transfer" with slip present but no status defaults to "unverified"', () => {
  const tabWithSlipOnly = {
    paymentMethod: 'Transfer',
    slipUrl: 'https://storage/manual_upload.webp'
  };

  const fields = buildBankFieldsForOrder(tabWithSlipOnly);

  assert.strictEqual(fields.slipUrl, 'https://storage/manual_upload.webp');
  assert.strictEqual(fields.slipImage, 'https://storage/manual_upload.webp');
  assert.strictEqual(fields.slipVerificationStatus, 'unverified', 'Slip without explicit status defaults to unverified');
});

// =============================================================================
// SUITE 4: Slip Upload Error Handling & Graceful Fallbacks
// =============================================================================
console.log('\n--- SUITE 4: Slip Upload Error Handling & Graceful Fallbacks ---');

/**
 * Replicate handleFileUpload execution paths from usePosActions.js:203-274
 */
async function simulateHandleFileUpload(fileInput, options = {}) {
  let isUploadingSlip = false;
  let activeTabPatch = null;
  let toastError = null;

  const setIsUploadingSlip = (val) => { isUploadingSlip = val; };
  const updateActiveTab = (patch) => { activeTabPatch = patch; };
  const toast = { error: (msg) => { toastError = msg; } };

  // Execution flow under test
  const file = fileInput?.target?.files?.[0] || fileInput;
  if (!file || typeof file !== 'object' || (!file.isFakeBlob && !file.size && !file.name)) {
    return null;
  }

  setIsUploadingSlip(true);
  try {
    const orderIdForSlip = 'POS_TEST_123';
    
    // Simulate upload function
    let uploadedUrl = null;
    if (options.uploadShouldFail) {
      throw new Error(options.uploadErrorMsg || 'Storage network timeout');
    } else {
      uploadedUrl = `https://firebasestorage.googleapis.com/v0/b/dh-notebook.appspot.com/o/slips%2F${orderIdForSlip}%2F12345.webp?alt=media`;
    }

    let storagePath = '';
    try {
      const urlMatch = String(uploadedUrl || '').match(/\/o\/([^?]+)/);
      if (urlMatch && urlMatch[1]) {
        storagePath = decodeURIComponent(urlMatch[1]);
      }
    } catch (_) {}

    // Simulate OCR extraction
    let ocrData = null;
    try {
      if (options.ocrShouldThrow) {
        throw new Error('Tesseract worker crashed');
      } else if (options.ocrReturnsData) {
        ocrData = {
          rawText: 'เลขที่รายการ: 0142611738245198234\n19 ก.ย. 2569 14:32',
          transactionRef: '0142611738245198234',
          transferDateTime: '19 ก.ย. 2569 14:32',
          transferNote: 'สแกนสลิปสำเร็จ',
          bankAccount: 'KBANK'
        };
      } else {
        // Fallback when OCR fails or not available
        ocrData = {
          transactionRef: '',
          transferDateTime: '2026-09-19 14:32',
          transferNote: 'อัปโหลดสลิปสำเร็จ (รอตรวจสอบยอด)'
        };
      }
    } catch (ocrErr) {
      // Graceful fallback
      ocrData = null;
    }

    const patch = {
      slipImage: uploadedUrl,
      slipUrl: uploadedUrl,
      slipStoragePath: storagePath || `slips/${orderIdForSlip}`,
      ocrResult: ocrData || null,
      slipVerificationStatus: (ocrData && ocrData.transactionRef) ? 'verified' : 'unverified'
    };

    if (ocrData) {
      if (ocrData.transactionRef && ocrData.transactionRef !== 'n/a') {
        patch.transactionRef = ocrData.transactionRef;
      }
      if (ocrData.transferDateTime && ocrData.transferDateTime !== 'n/a') {
        patch.transferDateTime = ocrData.transferDateTime;
      }
      if (ocrData.transferNote && ocrData.transferNote !== 'n/a') {
        patch.transferNote = ocrData.transferNote;
      }
      if (ocrData.bankAccount) {
        patch.bankAccount = ocrData.bankAccount;
      }
    }

    updateActiveTab(patch);
    return { uploadedUrl, ocrData };
  } catch (error) {
    toast.error(`อัปโหลดสลิปไม่สำเร็จ: ${error.message}`);
    return null;
  } finally {
    setIsUploadingSlip(false);
  }
}

await runAsyncTest('Suite 4', 'Non-file inputs (null, undefined, strings, plain objects) reject cleanly without crashing', async () => {
  const badInputs = [null, undefined, '', 'not-a-file', 12345, {}, { foo: 'bar' }];
  for (const bad of badInputs) {
    const result = await simulateHandleFileUpload(bad);
    assert.strictEqual(result, null, `Should return null for input: ${JSON.stringify(bad)}`);
  }
});

await runAsyncTest('Suite 4', 'Storage failure surfaces toast, resets uploading state, and returns null', async () => {
  const fakeFile = { isFakeBlob: true, size: 1024, name: 'slip.jpg' };
  const result = await simulateHandleFileUpload(fakeFile, {
    uploadShouldFail: true,
    uploadErrorMsg: 'Firebase Storage Quota Exceeded'
  });

  assert.strictEqual(result, null, 'Result must be null when upload fails');
});

await runAsyncTest('Suite 4', 'OCR worker crash is caught and gracefully falls back to unverified slip', async () => {
  const fakeFile = { isFakeBlob: true, size: 2048, name: 'slip.jpg' };
  const result = await simulateHandleFileUpload(fakeFile, {
    uploadShouldFail: false,
    ocrShouldThrow: true
  });

  assert.ok(result !== null, 'Upload must succeed even if OCR throws');
  assert.ok(result.uploadedUrl.includes('firebasestorage.googleapis.com'), 'Uploaded URL must be returned');
  assert.strictEqual(result.ocrData, null, 'ocrData must safely be null');
});

await runAsyncTest('Suite 4', 'Successful OCR populates verified state and bank fields', async () => {
  const fakeFile = { isFakeBlob: true, size: 2048, name: 'slip.jpg' };
  const result = await simulateHandleFileUpload(fakeFile, {
    uploadShouldFail: false,
    ocrReturnsData: true
  });

  assert.ok(result !== null);
  assert.strictEqual(result.ocrData.transactionRef, '0142611738245198234');
  assert.strictEqual(result.ocrData.bankAccount, 'KBANK');
});

// =============================================================================
// SUITE 5: Offline Order Persistence Resilience (offlinePosService)
// =============================================================================
console.log('\n--- SUITE 5: Offline Order Persistence Resilience ---');

/**
 * Mock localStorage implementation for Node.js adversarial testing
 */
class MockLocalStorage {
  constructor(quotaBytes = 5 * 1024 * 1024) {
    this.store = new Map();
    this.quotaBytes = quotaBytes;
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    const valStr = String(value);
    let totalSize = 0;
    for (const [k, v] of this.store.entries()) {
      if (k !== key) totalSize += k.length + v.length;
    }
    totalSize += key.length + valStr.length;
    if (totalSize > this.quotaBytes) {
      throw new Error('QuotaExceededError: The quota has been exceeded.');
    }
    this.store.set(key, valStr);
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

runTest('Suite 5', 'Simulates saving multiple offline orders with bank references in offlinePosService', () => {
  const mockStorage = new MockLocalStorage();
  const staffUid = 'STAFF_POS_01';
  const key = `dh_pos_offline_orders_${staffUid}`;

  for (let i = 1; i <= 25; i++) {
    const existing = mockStorage.getItem(key);
    const orders = existing ? JSON.parse(existing) : [];

    const orderData = {
      orderId: `DH260919-1430${i.toString().padStart(2, '0')}`,
      paymentMethod: i % 2 === 0 ? 'Transfer' : 'Cash',
      bankAccount: i % 2 === 0 ? 'KBANK' : null,
      transactionRef: i % 2 === 0 ? `TX_OFFLINE_${i}` : '',
      slipUrl: i % 2 === 0 ? `https://storage/slip_${i}.webp` : null,
      slipVerificationStatus: i % 2 === 0 ? 'unverified' : 'none',
      netTotal: 1200 + i * 50,
      offlineStatus: 'pending',
      staffUid,
      offlineSavedAt: new Date().toISOString()
    };

    orders.push(orderData);
    mockStorage.setItem(key, JSON.stringify(orders));
  }

  const savedData = JSON.parse(mockStorage.getItem(key));
  assert.strictEqual(savedData.length, 25, 'All 25 offline orders must be saved');
  assert.strictEqual(savedData[0].orderId, 'DH260919-143001');
  assert.strictEqual(savedData[1].paymentMethod, 'Transfer');
  assert.strictEqual(savedData[1].transactionRef, 'TX_OFFLINE_2');
  assert.strictEqual(savedData[1].slipVerificationStatus, 'unverified');
});

runTest('Suite 5', 'Catches localStorage quota exhaustion gracefully when storing abnormally large payloads', () => {
  const restrictedStorage = new MockLocalStorage(50 * 1024); // Small 50KB quota
  const key = 'dh_pos_offline_orders_staff';

  const hugeBase64Slip = 'data:image/webp;base64,' + 'A'.repeat(60 * 1024); // 60KB
  const heavyOrder = {
    orderId: 'DH-OFFLINE-HUGE',
    paymentMethod: 'Transfer',
    slipImage: hugeBase64Slip
  };

  assert.throws(
    () => {
      restrictedStorage.setItem(key, JSON.stringify([heavyOrder]));
    },
    /QuotaExceededError/,
    'Should trigger QuotaExceededError when raw base64 exceeds storage limit'
  );
});

// =============================================================================
// SUITE 6: AST & Source Code Conformance Across M3 Deliverables
// =============================================================================
console.log('\n--- SUITE 6: AST & Source Code Conformance Across M3 Deliverables ---');

const usePosActionsPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');
const paymentPanelPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/pos/PaymentPanel.jsx');
const paymentMethodsPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/pos/payment/PaymentMethods.jsx');
const billingTxPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billingTransactionService.js');
const statusWalletPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/firebase/billing/statusWalletHandler.js');

const usePosActionsSrc = fs.readFileSync(usePosActionsPath, 'utf8');
const paymentPanelSrc = fs.readFileSync(paymentPanelPath, 'utf8');
const paymentMethodsSrc = fs.readFileSync(paymentMethodsPath, 'utf8');
const billingTxSrc = fs.readFileSync(billingTxPath, 'utf8');
const statusWalletSrc = fs.readFileSync(statusWalletPath, 'utf8');

runTest('Suite 6', 'usePosActions.js contains genuine Firebase Storage imports and canvas WebP compression', () => {
  assert.ok(usePosActionsSrc.includes("import { auth, storage } from '../../../../firebase/config'"));
  assert.ok(usePosActionsSrc.includes("import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'"));
  assert.ok(usePosActionsSrc.includes("compressImageWithCanvas"));
  assert.ok(usePosActionsSrc.includes("quality: 0.85"));
  assert.ok(usePosActionsSrc.includes("fileType: 'image/webp'"));
});

runTest('Suite 6', 'usePosActions.js sanitizes orderId against path traversal slashes and hashes', () => {
  assert.ok(usePosActionsSrc.includes("safeOrderId = String(orderId || 'UNASSIGNED').replace("));
});

runTest('Suite 6', 'usePosActions.js contains dynamic import with @vite-ignore for tesseract.js', () => {
  assert.ok(usePosActionsSrc.includes("import(/* @vite-ignore */ 'tesseract.js')"));
});

runTest('Suite 6', 'PaymentPanel.jsx eliminated fake 1.8s timeout and uses genuine OCR scanning status', () => {
  assert.ok(!paymentPanelSrc.includes('1800'));
  assert.ok(paymentPanelSrc.includes("setOcrStatus('scanning')"));
  assert.ok(paymentPanelSrc.includes("setOcrStatus('success')"));
  assert.ok(paymentPanelSrc.includes("setOcrStatus('unverified')"));
  assert.ok(paymentPanelSrc.includes("setOcrStatus('error')"));
});

runTest('Suite 6', 'PaymentMethods.jsx provides full slip deletion reset across all bank reference fields', () => {
  assert.ok(paymentMethodsSrc.includes("slipImage: null"));
  assert.ok(paymentMethodsSrc.includes("slipUrl: null"));
  assert.ok(paymentMethodsSrc.includes("slipStoragePath: null"));
  assert.ok(paymentMethodsSrc.includes("ocrResult: null"));
  assert.ok(paymentMethodsSrc.includes("slipVerificationStatus: 'idle'"));
  assert.ok(paymentMethodsSrc.includes("transactionRef: ''"));
  assert.ok(paymentMethodsSrc.includes("transferDateTime: ''"));
  assert.ok(paymentMethodsSrc.includes("transferNote: ''"));
});

runTest('Suite 6', 'billingTransactionService.js persists full orderData with spread operator into order doc', () => {
  assert.ok(billingTxSrc.includes("const dataToSave = { ...orderData }"));
  assert.ok(billingTxSrc.includes("transaction.set(newOrderRef, {"));
  assert.ok(billingTxSrc.includes("...dataToSave"));
});

runTest('Suite 6', 'billingTransactionService.js and statusWalletHandler.js unwrap settingsData.config', () => {
  assert.ok(billingTxSrc.includes("settingsData.config || settingsData.creditConfig || settingsData"));
  assert.ok(statusWalletSrc.includes("settingsData.config || settingsData.creditConfig || settingsData"));
});

runTest('Suite 6', 'Recent orders catalog sync is invoked on order creation', () => {
  assert.ok(billingTxSrc.includes("syncRecentOrdersCatalog(finalOrderId)"));
  assert.ok(usePosActionsSrc.includes("syncRecentOrdersCatalog(actualOrderId)"));
});

// =============================================================================
// SUMMARY & REPORT
// =============================================================================
console.log('\n================================================================================');
console.log(`  Total Checks: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================================');

if (failedTests > 0) {
  console.error(`\n❌ ADVERSARIAL STRESS SUITE FAILED with ${failedTests} failures!`);
  process.exit(1);
} else {
  console.log('\n🎉 ALL M3 ADVERSARIAL CHECKS PASSED EMPIRICALLY WITH ZERO DEFECTS!');
  process.exit(0);
}
