import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

console.log('=== Challenger M1: Empirical Stress-Test for Functions & slipOcrParser ===\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    throw err;
  }
}

// -------------------------------------------------------------
// Test Suite 1: functions/index.js Loading & Contract Invariants
// -------------------------------------------------------------
runTest('functions/index.js can be imported via require without throwing', () => {
  const indexPath = path.resolve(REPO_ROOT, 'Management System/functions/index.js');
  // Clear require cache if any
  delete require.cache[require.resolve(indexPath)];
  const funcs = require(indexPath);
  assert.ok(funcs, 'functions/index.js should return an exports object');
  assert.strictEqual(typeof funcs.verifySlipOcr, 'function', 'verifySlipOcr should be exported as a function');
  assert.strictEqual(typeof funcs.purgeOldSlips, 'function', 'purgeOldSlips should be exported as a function');
});

// -------------------------------------------------------------
// Test Suite 2: slipOcrParser.js Module Contract
// -------------------------------------------------------------
const parserPath = path.resolve(REPO_ROOT, 'Management System/functions/slips/slipOcrParser.js');
const parser = require(parserPath);

runTest('slipOcrParser.js exports required helper functions and constants', () => {
  assert.strictEqual(typeof parser.parseSlipText, 'function');
  assert.strictEqual(typeof parser.extractTransactionRef, 'function');
  assert.strictEqual(typeof parser.extractTransferDateTime, 'function');
  assert.strictEqual(typeof parser.extractDestinationName, 'function');
  assert.strictEqual(typeof parser.extractSenderName, 'function');
  assert.strictEqual(typeof parser.cleanSenderName, 'function');
  assert.ok(Array.isArray(parser.BANK_PATTERNS), 'BANK_PATTERNS should be an array');
  assert.ok(parser.BANK_PATTERNS.length >= 8, 'Should support at least 8 major banks');
});

// -------------------------------------------------------------
// Test Suite 3: Adversarial Input Handling (Null, Undefined, Types)
// -------------------------------------------------------------
runTest('parseSlipText handles empty/null/undefined safely without uncaught exceptions', () => {
  assert.strictEqual(parser.parseSlipText(''), null);
  assert.strictEqual(parser.parseSlipText(null), null);
  assert.strictEqual(parser.parseSlipText(undefined), null);
});

runTest('helper functions handle empty/null/undefined safely', () => {
  assert.strictEqual(parser.cleanSenderName(''), '');
  assert.strictEqual(parser.cleanSenderName(null), '');
  assert.strictEqual(parser.cleanSenderName(undefined), '');

  assert.strictEqual(parser.extractDestinationName(''), 'n/a');
  assert.strictEqual(parser.extractDestinationName(null), 'n/a');
  assert.strictEqual(parser.extractDestinationName(undefined), 'n/a');

  assert.strictEqual(parser.extractTransactionRef(''), 'n/a');
  assert.strictEqual(parser.extractTransactionRef(null), 'n/a');
  assert.strictEqual(parser.extractTransactionRef(undefined), 'n/a');

  assert.strictEqual(parser.extractTransferDateTime('', ''), 'n/a');
  assert.strictEqual(parser.extractTransferDateTime(null, null), 'n/a');

  assert.strictEqual(parser.extractSenderName(''), 'n/a');
  assert.strictEqual(parser.extractSenderName(null), 'n/a');
});

// -------------------------------------------------------------
// Test Suite 4: ReDoS & Performance Stress Test
// -------------------------------------------------------------
runTest('parseSlipText survives large adversarial string without catastrophic backtracking', () => {
  const start = Date.now();
  // 100,000 characters of repetitive malicious regex triggers
  const adversarialInput = 'ธนาคาร '.repeat(2000) + '0100000000000000000000 '.repeat(1000) + 'A'.repeat(50000);
  const result = parser.parseSlipText(adversarialInput);
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 2000, `Execution took ${elapsed}ms, should be < 2000ms`);
  assert.ok(result !== undefined, 'Result should be defined');
});

// -------------------------------------------------------------
// Test Suite 5: Bank Recognition & Data Parsing Accuracy
// -------------------------------------------------------------
const sampleSlips = [
  {
    name: 'KBANK (Kasikorn Bank)',
    text: `โอนเงินสำเร็จ
ธ.กสิกรไทย
นาย สมนึก ใจดี
ไปยัง
บจก. ดีเอช โน้ตบุ๊ค
ธนาคารกสิกรไทย
เลขที่รายการ: 0142611738245198234
วันที่ทำรายการ: 17 ก.ย. 2569 14:32 น.
จำนวนเงิน: 1,590.00 บาท`,
    expectedBank: 'KBANK',
    expectedRef: '0142611738245198234',
    expectedAmount: 1590.00
  },
  {
    name: 'SCB (Siam Commercial Bank)',
    text: `โอนสำเร็จ
SCB EASY
นาย สมชาย สายชล
เข้าบัญชี
บริษัท ดีเอช โน้ตบุ๊ค จำกัด
เลขที่อ้างอิง: 202609174567891234
17 ก.ย. 2026 15:45 น.
จำนวน: 2,450.00 THB`,
    expectedBank: 'SCB',
    expectedRef: '202609174567891234',
    expectedAmount: 2450.00
  },
  {
    name: 'BBL (Bangkok Bank)',
    text: `Bangkok Bank
โอนเงินสำเร็จ
ผู้รับโอน
นาย ธนาคาร กรุงเทพ
หมายเลขอ้างอิง: 2609171234567890
วันที่ 17 ก.ย. 69 10:15 น.
ยอดเงิน: 850.00 บาท`,
    expectedBank: 'BBL',
    expectedRef: '2609171234567890',
    expectedAmount: 850.00
  },
  {
    name: 'BAY (Krungsri Bank)',
    text: `Krungsri Simple
กรุงศรีอยุธยา
โอนเงินสำเร็จ
กรุงศรี ออโต้ / บัญชีร้าน
Transaction ID: 01BAY20260917890123
17 ก.ย. 69 16:20 น.
จำนวนเงิน: ฿ 500.00`,
    expectedBank: 'BAY',
    expectedRef: '01BAY20260917890123',
    expectedAmount: 500.00
  },
  {
    name: 'PROMPTPAY',
    text: `พร้อมเพย์
โอนสำเร็จ
คุณ วิชัย รักเรียน
ไปยัง พร้อมเพย์ 0812345678
รหัสอ้างอิง: 010293847561029384
17 ก.ย. 2569 18:00 น.
จำนวนเงิน 350.00 บาท`,
    expectedBank: 'PROMPTPAY',
    expectedRef: '010293847561029384',
    expectedAmount: 350.00
  }
];

for (const sample of sampleSlips) {
  runTest(`parseSlipText accurately parses ${sample.name}`, () => {
    const res = parser.parseSlipText(sample.text);
    assert.ok(res, `Result should not be null for ${sample.name}`);
    assert.strictEqual(res.bankAccount, sample.expectedBank, `Expected bank ${sample.expectedBank}, got ${res.bankAccount}`);
    assert.strictEqual(res.transactionRef, sample.expectedRef, `Expected ref ${sample.expectedRef}, got ${res.transactionRef}`);
    assert.strictEqual(res.amount, sample.expectedAmount, `Expected amount ${sample.expectedAmount}, got ${res.amount}`);
    assert.ok(res.transferDateTime !== 'n/a', `transferDateTime should be parsed, got ${res.transferDateTime}`);
    assert.ok(res.receivingAccount !== 'n/a', `receivingAccount should be resolved, got ${res.receivingAccount}`);
  });
}

// -------------------------------------------------------------
// Test Suite 6: Unicode, Emojis & Extreme Malformed Characters
// -------------------------------------------------------------
runTest('parseSlipText handles unicode emojis, symbols, and malformed tags safely', () => {
  const malformed = `🎉🚀✨ <script>alert(1)</script> 💥
  กสิกรไทย 🏦 โอนเงิน ฿฿฿
  นาย ทดสอบ 👨‍💻 ระบบ 
  จำนวนเงิน: 9,999.50 บาท
  หมายเลขอ้างอิง: 0199999999999999999
  วันที่: 17 ก.ย. 2569 12:00 น.`;

  const res = parser.parseSlipText(malformed);
  assert.ok(res !== null);
  assert.strictEqual(res.bankAccount, 'KBANK');
  assert.strictEqual(res.amount, 9999.50);
  assert.strictEqual(res.transactionRef, '0199999999999999999');
});

console.log(`\nAll ${passedTests}/${totalTests} tests in challenger_m1_slip_ocr passed successfully!`);
