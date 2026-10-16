import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');

console.log('================================================================================');
console.log('🛡️ VERIFICATION SUITE: CREDIT POINT PHASE 3 (SCHEMA KEYS & ZOD VALIDATION)');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// 1. Verify COLLECTIONS.CREDIT_TRANSACTIONS in schemaKeys.js
// -----------------------------------------------------------------------------
console.log('--- 1. Testing schemaKeys.js ---');

const schemaKeysPath = path.join(REPO_ROOT, 'dh-shared/src/firebase/schemaKeys.js');
assert(fs.existsSync(schemaKeysPath), 'schemaKeys.js must exist in dh-shared');

const { COLLECTIONS, COLLECTION_GROUPS } = await import(`file://${schemaKeysPath.replace(/\\/g, '/')}`);
assert.strictEqual(COLLECTIONS.CREDIT_TRANSACTIONS, 'credit_transactions', 'COLLECTIONS.CREDIT_TRANSACTIONS must be "credit_transactions"');
assert.strictEqual(COLLECTION_GROUPS.CREDIT_TRANSACTIONS, 'credit_transactions', 'COLLECTION_GROUPS.CREDIT_TRANSACTIONS must be "credit_transactions"');
console.log('  ✅ PASS: COLLECTIONS.CREDIT_TRANSACTIONS is defined as "credit_transactions"');
console.log('  ✅ PASS: COLLECTION_GROUPS.CREDIT_TRANSACTIONS is defined as "credit_transactions"');

// -----------------------------------------------------------------------------
// 2. Verify Zod Schema & Validation Functions in dh-shared/src/schemas/creditSchema.js
// -----------------------------------------------------------------------------
console.log('\n--- 2. Testing dh-shared/src/schemas/creditSchema.js ---');

const creditSchemaPath = path.join(REPO_ROOT, 'dh-shared/src/schemas/creditSchema.js');
assert(fs.existsSync(creditSchemaPath), 'creditSchema.js must exist in dh-shared/src/schemas/');

const { 
  creditTransactionSchema, 
  creditLedgerSchema, 
  creditConfigDocSchema, 
  validateCreditTransaction, 
  validateCreditConfig 
} = await import(`file://${creditSchemaPath.replace(/\\/g, '/')}`);

assert(typeof validateCreditTransaction === 'function', 'validateCreditTransaction must be a function');
assert(typeof validateCreditConfig === 'function', 'validateCreditConfig must be a function');

// Test Valid Transaction
const validTx = {
  transactionId: 'TXM-TEST-12345',
  uid: 'user_abc_123',
  type: 'add',
  amount: 250.5,
  balanceAfter: 1250.5,
  referenceId: 'ORD_9999',
  note: 'โบนัสพิเศษ',
  recordedBy: 'admin_master'
};
const validResult = validateCreditTransaction(validTx);
assert.strictEqual(validResult.success, true, 'Valid transaction must pass Zod schema validation');
console.log('  ✅ PASS: Valid transaction passes schema validation');

// Test Invalid Transaction (negative amount)
const invalidTxNegative = {
  transactionId: 'TXM-INVALID-1',
  uid: 'user_abc_123',
  type: 'add',
  amount: -50
};
const negResult = validateCreditTransaction(invalidTxNegative);
assert.strictEqual(negResult.success, false, 'Negative amount transaction must be rejected');
console.log('  ✅ PASS: Negative transaction amount rejected correctly by Zod');

// Test Invalid Transaction (missing uid)
const invalidTxNoUid = {
  transactionId: 'TXM-INVALID-2',
  type: 'deduct',
  amount: 100
};
const noUidResult = validateCreditTransaction(invalidTxNoUid);
assert.strictEqual(noUidResult.success, false, 'Missing uid transaction must be rejected');
console.log('  ✅ PASS: Missing uid rejected correctly by Zod');

// Test Invalid Type
const invalidTxType = {
  transactionId: 'TXM-INVALID-3',
  uid: 'user_abc_123',
  type: 'multiply',
  amount: 100
};
const badTypeResult = validateCreditTransaction(invalidTxType);
assert.strictEqual(badTypeResult.success, false, 'Invalid type "multiply" must be rejected');
console.log('  ✅ PASS: Invalid transaction type rejected correctly by Zod');

// Test Valid Config Document
const validConfigDoc = {
  ledger: { totalAllocated: 50000, systemPoolMax: 10000000, status: 'SECURE' },
  config: { pointsEarningRate: 100, adImpressionCost: 0.1, adImpressionCount: 1000 }
};
const configResult = validateCreditConfig(validConfigDoc);
assert.strictEqual(configResult.success, true, 'Valid config document must pass Zod schema validation');
console.log('  ✅ PASS: Valid credit config passes schema validation');

// -----------------------------------------------------------------------------
// 3. Verify dh-shared/index.js Exports creditSchema
// -----------------------------------------------------------------------------
console.log('\n--- 3. Testing dh-shared/index.js Export Parity ---');

const sharedIndexPath = path.join(REPO_ROOT, 'dh-shared/index.js');
const sharedIndexCode = fs.readFileSync(sharedIndexPath, 'utf8');
assert(sharedIndexCode.includes('creditSchema.js'), 'dh-shared/index.js must export creditSchema.js');
console.log('  ✅ PASS: dh-shared/index.js exports creditSchema.js');

// -----------------------------------------------------------------------------
// 4. Verify Callers in Backoffice and Frontend
// -----------------------------------------------------------------------------
console.log('\n--- 4. Testing Callers in Backoffice & Frontend ---');

const boActionPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/firebase/credit/creditActionService.js');
const boActionCode = fs.readFileSync(boActionPath, 'utf8');
assert(boActionCode.includes('COLLECTIONS.CREDIT_TRANSACTIONS'), 'Backoffice creditActionService must use COLLECTIONS.CREDIT_TRANSACTIONS');
assert(boActionCode.includes('validateCreditTransaction'), 'Backoffice creditActionService must use validateCreditTransaction');
console.log('  ✅ PASS: Backoffice creditActionService integrates COLLECTIONS.CREDIT_TRANSACTIONS and validateCreditTransaction');

const feActionPath = path.join(REPO_ROOT, 'dh-frontend/src/firebase/credit/creditActionService.js');
const feActionCode = fs.readFileSync(feActionPath, 'utf8');
assert(feActionCode.includes('COLLECTIONS.CREDIT_TRANSACTIONS'), 'Frontend creditActionService must use COLLECTIONS.CREDIT_TRANSACTIONS');
assert(feActionCode.includes('validateCreditTransaction'), 'Frontend creditActionService must use validateCreditTransaction');
console.log('  ✅ PASS: Frontend creditActionService integrates COLLECTIONS.CREDIT_TRANSACTIONS and validateCreditTransaction');

const settingsTabPath = path.join(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/CreditDashboard/components/tabs/useCreditSettingsState.js');
const settingsTabCode = fs.readFileSync(settingsTabPath, 'utf8');
assert(settingsTabCode.includes('unwrapCreditConfig(creditSnap.data())'), 'useCreditSettingsState must unwrap credit config');
console.log('  ✅ PASS: useCreditSettingsState unwraps credit config safely with unwrapCreditConfig');

console.log('\n================================================================================');
console.log('📊 PHASE 3 SCHEMA VERIFICATION: ALL 11 CHECKS PASSED');
console.log('🎉 VERIFICATION STATUS: 100% PERFECT PASS (SCHEMA INTEGRITY CONFIRMED)');
console.log('================================================================================\n');
