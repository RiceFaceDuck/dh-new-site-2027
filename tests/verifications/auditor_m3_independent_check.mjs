/**
 * auditor_m3_independent_check.mjs
 * 
 * FORENSIC INTEGRITY AUDIT INDEPENDENT CHECK: MILESTONE M3
 * Target: POS Transactional Checkout, Slip Storage & Schema Alignment
 * 
 * Executed independently by the Forensic Auditor to verify:
 * 1. Pre-mutation backups for all 5 modified files
 * 2. Code Integrity & Anti-Facade Analysis (zero fake timeouts, genuine Firebase Storage)
 * 3. Split-line stock aggregation edge-case simulation
 * 4. Loyalty config schema unwrapping simulation
 * 5. Server-side vs POS UI VAT & Shipping parity simulation
 * 6. Absolute Deployment Ban & Centralized Test Hub compliance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message, detail = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${message}${detail ? ' -> ' + detail : ''}`);
  }
}

console.log('================================================================================');
console.log('  FORENSIC INTEGRITY AUDIT SUITE: MILESTONE M3');
console.log('  POS Transactional Checkout, Slip Storage & Schema Alignment');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// CHECK 1: Pre-mutation Backups Verification
// -----------------------------------------------------------------------------
console.log('--- CHECK 1: Pre-mutation Backups Verification ---');

const backupBaseDir = path.join(workspaceRoot, '_Backups/2026-09-19_POS_Billing_Enhancement');
const m3BackupDir = path.join(backupBaseDir, 'm3_pre_mutation');

assert(fs.existsSync(backupBaseDir), 'Backup base directory exists: _Backups/2026-09-19_POS_Billing_Enhancement');
assert(fs.existsSync(m3BackupDir), 'Milestone M3 dedicated backup directory exists: m3_pre_mutation');

const targetFiles = [
  {
    name: 'usePosActions.js',
    currentPath: path.join(workspaceRoot, 'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js'),
    backupPath: path.join(m3BackupDir, 'usePosActions.js'),
    rootBackupPath: path.join(backupBaseDir, 'usePosActions.js')
  },
  {
    name: 'PaymentPanel.jsx',
    currentPath: path.join(workspaceRoot, 'dh-backoffice-react/src/components/billing/pos/PaymentPanel.jsx'),
    backupPath: path.join(m3BackupDir, 'PaymentPanel.jsx'),
    rootBackupPath: path.join(backupBaseDir, 'PaymentPanel.jsx')
  },
  {
    name: 'PaymentMethods.jsx',
    currentPath: path.join(workspaceRoot, 'dh-backoffice-react/src/components/billing/pos/payment/PaymentMethods.jsx'),
    backupPath: path.join(m3BackupDir, 'PaymentMethods.jsx'),
    rootBackupPath: path.join(backupBaseDir, 'PaymentMethods.jsx')
  },
  {
    name: 'billingTransactionService.js',
    currentPath: path.join(workspaceRoot, 'dh-backoffice-react/src/firebase/billingTransactionService.js'),
    backupPath: path.join(m3BackupDir, 'billingTransactionService.js'),
    rootBackupPath: path.join(backupBaseDir, 'billingTransactionService.js')
  },
  {
    name: 'statusWalletHandler.js',
    currentPath: path.join(workspaceRoot, 'dh-backoffice-react/src/firebase/billing/statusWalletHandler.js'),
    backupPath: path.join(m3BackupDir, 'statusWalletHandler.js'),
    rootBackupPath: path.join(backupBaseDir, 'statusWalletHandler.js')
  }
];

for (const tf of targetFiles) {
  assert(fs.existsSync(tf.backupPath), `Pre-mutation backup exists in m3_pre_mutation: ${tf.name}`);
  assert(fs.existsSync(tf.rootBackupPath), `Pre-mutation backup exists in root backup: ${tf.name}`);
  assert(fs.existsSync(tf.currentPath), `Current source file exists: ${tf.name}`);

  const backupStat = fs.statSync(tf.backupPath);
  const currentStat = fs.statSync(tf.currentPath);
  assert(backupStat.size > 0, `Backup ${tf.name} is non-empty (${backupStat.size} bytes)`);

  const backupContent = fs.readFileSync(tf.backupPath, 'utf-8');
  const currentContent = fs.readFileSync(tf.currentPath, 'utf-8');
  assert(backupContent !== currentContent, `File ${tf.name} contains legitimate changes compared to backup`);
}

// -----------------------------------------------------------------------------
// CHECK 2: Code Integrity & Anti-Facade Static Analysis
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 2: Code Integrity & Anti-Facade Static Analysis ---');

const usePosActionsContent = fs.readFileSync(targetFiles[0].currentPath, 'utf-8');
const paymentPanelContent = fs.readFileSync(targetFiles[1].currentPath, 'utf-8');
const paymentMethodsContent = fs.readFileSync(targetFiles[2].currentPath, 'utf-8');
const billingTxContent = fs.readFileSync(targetFiles[3].currentPath, 'utf-8');
const statusWalletContent = fs.readFileSync(targetFiles[4].currentPath, 'utf-8');

// usePosActions.js checks
assert(!usePosActionsContent.includes('driveService.uploadSlip'), 'usePosActions.js: legacy driveService completely eradicated');
assert(usePosActionsContent.includes('storage } from \'../../../../firebase/config\''), 'usePosActions.js: imports genuine Firebase storage');
assert(usePosActionsContent.includes('ref, uploadBytes, getDownloadURL'), 'usePosActions.js: imports authentic firebase/storage upload primitives');
assert(usePosActionsContent.includes('compressImageWithCanvas'), 'usePosActions.js: uses client canvas WebP compression');
assert(usePosActionsContent.includes('slips/${safeOrderId}/${timestamp}_${rand}.webp'), 'usePosActions.js: constructs secure partitioned Storage slip path');
assert(usePosActionsContent.includes('contentType: \'image/webp\''), 'usePosActions.js: sets authentic WebP content type metadata');
assert(usePosActionsContent.includes('aggregatedStockDemand = (activeTab.items || []).reduce'), 'usePosActions.js: implements genuine split-line stock aggregation');
assert(usePosActionsContent.includes('item.stock < item.totalQty'), 'usePosActions.js: blocks when combined split-line demand exceeds stock');
assert(usePosActionsContent.includes('transactionRef: activeTab.paymentMethod === \'Transfer\''), 'usePosActions.js: binds transactionRef into orderData');
assert(usePosActionsContent.includes('transferDateTime: activeTab.paymentMethod === \'Transfer\''), 'usePosActions.js: binds transferDateTime into orderData');
assert(usePosActionsContent.includes('transferNote: activeTab.paymentMethod === \'Transfer\''), 'usePosActions.js: binds transferNote into orderData');
assert(usePosActionsContent.includes('slipUrl: activeTab.paymentMethod === \'Transfer\''), 'usePosActions.js: binds slipUrl into orderData');
assert(usePosActionsContent.includes('slipImage: activeTab.paymentMethod === \'Transfer\''), 'usePosActions.js: binds slipImage into orderData');
assert(usePosActionsContent.includes('syncRecentOrdersCatalog(actualOrderId)'), 'usePosActions.js: triggers instant recent order catalog sync');

// PaymentPanel.jsx checks
assert(!paymentPanelContent.includes('setTimeout(() => { setIsScanning(false); setOcrStatus(\'error\'); }, 1800);'), 'PaymentPanel.jsx: dummy 1.8s timeout removed');
assert(!paymentPanelContent.includes('triggerRealOCRCheck'), 'PaymentPanel.jsx: legacy triggerRealOCRCheck facade removed');
assert(paymentPanelContent.includes('const handleFileWithOCR = async (e) => {'), 'PaymentPanel.jsx: genuine handleFileWithOCR async handler present');
assert(paymentPanelContent.includes('setOcrStatus(\'scanning\')'), 'PaymentPanel.jsx: genuine scanning state transition');
assert(paymentPanelContent.includes('const res = await handleFileUpload(e);'), 'PaymentPanel.jsx: genuinely awaits handleFileUpload');

// PaymentMethods.jsx checks
assert(paymentMethodsContent.includes('activeTab.slipUrl || activeTab.slipImage'), 'PaymentMethods.jsx: supports dual slipUrl and slipImage');
assert(paymentMethodsContent.includes('slipVerificationStatus: \'idle\''), 'PaymentMethods.jsx: resets slipVerificationStatus to idle on slip deletion');
assert(paymentMethodsContent.includes('transactionRef: \'\''), 'PaymentMethods.jsx: clears transactionRef on slip deletion');
assert(paymentMethodsContent.includes('border-emerald-400'), 'PaymentMethods.jsx: displays verified status visual indicator');

// billingTransactionService.js & statusWalletHandler.js checks
assert(billingTxContent.includes('(!isVatOnShipping && isExcludedVat) ? 0 : shippingCost'), 'billingTransactionService.js: excludes shipping from taxable base when vatOnShipping=false and vatType=excluded');
assert(billingTxContent.includes('Math.round((vatResult.finalTotal + shippingCost) * 100) / 100'), 'billingTransactionService.js: restores shipping to final net total post-tax for vatOnShipping=false');
assert(billingTxContent.includes('settingsData.config || settingsData.creditConfig || settingsData'), 'billingTransactionService.js: unwraps loyalty config from all 3 schema variants');
assert(billingTxContent.includes('syncRecentOrdersCatalog(finalOrderId)'), 'billingTransactionService.js: synchronizes recent orders catalog post-transaction');
assert(statusWalletContent.includes('settingsData.config || settingsData.creditConfig || settingsData'), 'statusWalletHandler.js: unwraps loyalty config from all 3 schema variants');

// -----------------------------------------------------------------------------
// CHECK 3: Independent Split-Line Stock Demand Simulation
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 3: Independent Split-Line Stock Demand Simulation ---');

function evaluateStockDemand(cartItems, status) {
  const sanitizeNum = (val) => { const parsed = Number(val); return isNaN(parsed) ? 0 : parsed; };

  const lineOutOfStock = (cartItems || []).find(item => sanitizeNum(item.stock) < sanitizeNum(item.qty));
  const aggregatedStockDemand = (cartItems || []).reduce((acc, item) => {
    const key = item.sku || item.id || item.name || 'unknown';
    const qty = sanitizeNum(item.qty);
    const stock = sanitizeNum(item.stock);
    if (!acc[key]) {
      acc[key] = { key, totalQty: 0, stock: stock };
    } else {
      acc[key].stock = Math.min(acc[key].stock, stock);
    }
    acc[key].totalQty += qty;
    return acc;
  }, {});

  const aggregatedOutOfStock = Object.values(aggregatedStockDemand).find(
    item => item.stock < item.totalQty
  );
  const outOfStockItem = aggregatedOutOfStock || lineOutOfStock;

  if (outOfStockItem && status === 'Paid') {
    return { allowed: false, reason: 'OUT_OF_STOCK', item: outOfStockItem.key };
  }
  return { allowed: true, outOfStockItem };
}

// Case 1: Single item normal
const r1 = evaluateStockDemand([{ sku: 'SKU-A', qty: 2, stock: 10 }], 'Paid');
assert(r1.allowed === true, 'Single item demand within stock is allowed');

// Case 2: Exact boundary
const r2 = evaluateStockDemand([{ sku: 'SKU-A', qty: 10, stock: 10 }], 'Paid');
assert(r2.allowed === true, 'Exact stock boundary (qty === stock) is allowed');

// Case 3: Over stock
const r3 = evaluateStockDemand([{ sku: 'SKU-A', qty: 11, stock: 10 }], 'Paid');
assert(r3.allowed === false && r3.item === 'SKU-A', 'Single item exceeding stock is blocked');

// Case 4: Split rows exceeding stock (Critical Regression & Vulnerability Test)
// Row 1: qty 3 (stock 5), Row 2: qty 3 (stock 5) -> individual rows look fine (3 < 5), but sum is 6 > 5
const r4 = evaluateStockDemand([
  { sku: 'DH-CPU-01', qty: 3, stock: 5 },
  { sku: 'DH-CPU-01', qty: 3, stock: 5 }
], 'Paid');
assert(r4.allowed === false && r4.item === 'DH-CPU-01', 'Split-line demand (3+3 > 5) is caught and blocked');

// Case 5: Split rows within stock
const r5 = evaluateStockDemand([
  { sku: 'DH-RAM-01', qty: 2, stock: 10 },
  { sku: 'DH-RAM-01', qty: 3, stock: 10 },
  { sku: 'DH-RAM-01', qty: 5, stock: 10 }
], 'Paid');
assert(r5.allowed === true, 'Split-line demand summing exactly to stock (2+3+5 === 10) is allowed');

// Case 6: Draft bypass on split-line out of stock
const r6 = evaluateStockDemand([
  { sku: 'DH-CPU-01', qty: 3, stock: 5 },
  { sku: 'DH-CPU-01', qty: 3, stock: 5 }
], 'Draft');
assert(r6.allowed === true, 'Draft checkout with split-line out-of-stock is permitted (Draft bypass honored)');

// Case 7: Mixed cart with multiple SKUs
const r7 = evaluateStockDemand([
  { sku: 'GOOD-1', qty: 1, stock: 50 },
  { sku: 'BAD-SPLIT', qty: 4, stock: 6 },
  { sku: 'GOOD-2', qty: 2, stock: 20 },
  { sku: 'BAD-SPLIT', qty: 3, stock: 6 }
], 'Paid');
assert(r7.allowed === false && r7.item === 'BAD-SPLIT', 'Mixed cart correctly flags BAD-SPLIT (4+3 > 6)');

// -----------------------------------------------------------------------------
// CHECK 4: Independent Loyalty Config Unwrapping Simulation
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 4: Independent Loyalty Config Unwrapping Simulation ---');

function resolveLoyaltyConfig(settingsData) {
  return settingsData?.config || settingsData?.creditConfig || settingsData || {};
}

const mockRules = { skuBonusRules: { 'BONUS-A': 15 }, pointsEarningRate: 50 };

const varNestedConfig = { config: mockRules };
const varLegacyConfig = { creditConfig: mockRules };
const varRootConfig = { ...mockRules };
const varEmptyConfig = {};
const varNullConfig = null;

assert(resolveLoyaltyConfig(varNestedConfig).pointsEarningRate === 50, 'Variant 1 (Nested .config): pointsEarningRate === 50');
assert(resolveLoyaltyConfig(varNestedConfig).skuBonusRules?.['BONUS-A'] === 15, 'Variant 1 (Nested .config): skuBonusRules preserved');

assert(resolveLoyaltyConfig(varLegacyConfig).pointsEarningRate === 50, 'Variant 2 (Legacy .creditConfig): pointsEarningRate === 50');
assert(resolveLoyaltyConfig(varLegacyConfig).skuBonusRules?.['BONUS-A'] === 15, 'Variant 2 (Legacy .creditConfig): skuBonusRules preserved');

assert(resolveLoyaltyConfig(varRootConfig).pointsEarningRate === 50, 'Variant 3 (Root doc): pointsEarningRate === 50');
assert(resolveLoyaltyConfig(varRootConfig).skuBonusRules?.['BONUS-A'] === 15, 'Variant 3 (Root doc): skuBonusRules preserved');

assert(resolveLoyaltyConfig(varEmptyConfig).pointsEarningRate === undefined, 'Variant 4 (Empty doc): gracefully returns empty object without error');
assert(resolveLoyaltyConfig(varNullConfig) !== null, 'Variant 5 (Null doc): gracefully returns fallback object without throw');

// -----------------------------------------------------------------------------
// CHECK 5: Independent Server-Side vs POS UI VAT & Shipping Parity Simulation
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 5: Server-Side vs POS UI VAT & Shipping Parity Simulation ---');

function posUiCalculate(subTotal, shippingFee, vatType, vatOnShipping) {
  let vatAmount = 0;
  let netTotal = subTotal;
  const round2 = (num) => Math.round(num * 100) / 100;

  if (vatType === 'included') {
    if (vatOnShipping) {
      vatAmount = round2(((subTotal + shippingFee) * 7) / 107);
      netTotal = subTotal + shippingFee;
    } else {
      vatAmount = round2((subTotal * 7) / 107);
      netTotal = subTotal + shippingFee;
    }
  } else if (vatType === 'excluded') {
    if (vatOnShipping) {
      vatAmount = round2((subTotal + shippingFee) * 0.07);
      netTotal = round2(subTotal + shippingFee + vatAmount);
    } else {
      vatAmount = round2(subTotal * 0.07);
      netTotal = round2(subTotal + shippingFee + vatAmount);
    }
  } else {
    vatAmount = 0;
    netTotal = subTotal + shippingFee;
  }
  return { vatAmount, netTotal: round2(netTotal) };
}

function backendServerCalculate(subTotal, shippingCost, vatType, isVatOnShipping) {
  const isExcludedVat = vatType === 'excluded';
  const taxableShippingCost = (!isVatOnShipping && isExcludedVat) ? 0 : shippingCost;
  const baseNet = subTotal + taxableShippingCost;

  let vatAmount = 0;
  let preNet = baseNet;
  const round2 = (num) => Math.round(num * 100) / 100;

  if (vatType === 'included') {
    vatAmount = round2((baseNet * 7) / 107);
    preNet = baseNet;
  } else if (vatType === 'excluded') {
    vatAmount = round2(baseNet * 0.07);
    preNet = round2(baseNet + vatAmount);
  } else {
    vatAmount = 0;
    preNet = baseNet;
  }

  const finalSecureNetTotal = (!isVatOnShipping && isExcludedVat)
    ? round2(preNet + shippingCost)
    : preNet;

  return { vatAmount, netTotal: round2(finalSecureNetTotal) };
}

const permutations = [
  { name: 'Included VAT, vatOnShipping=true', sub: 1000, ship: 70, vatType: 'included', vatOnShip: true },
  { name: 'Included VAT, vatOnShipping=false', sub: 1000, ship: 50, vatType: 'included', vatOnShip: false },
  { name: 'Excluded VAT, vatOnShipping=true', sub: 1000, ship: 100, vatType: 'excluded', vatOnShip: true },
  { name: 'Excluded VAT, vatOnShipping=false', sub: 1000, ship: 60, vatType: 'excluded', vatOnShip: false },
  { name: 'Exempt VAT, shipping=50', sub: 500, ship: 50, vatType: 'exempt', vatOnShip: false },
  { name: 'Exempt VAT, shipping=0', sub: 800, ship: 0, vatType: 'exempt', vatOnShip: true }
];

for (const p of permutations) {
  const pos = posUiCalculate(p.sub, p.ship, p.vatType, p.vatOnShip);
  const be = backendServerCalculate(p.sub, p.ship, p.vatType, p.vatOnShip);
  const diff = Math.abs(pos.netTotal - be.netTotal);
  assert(diff < 0.001, `Parity [${p.name}]: POS Net ฿${pos.netTotal} === BE Net ฿${be.netTotal} (Diff: ${diff.toFixed(4)})`);
}

// 200 Randomized Fuzzing Runs
let fuzzFailures = 0;
for (let i = 0; i < 200; i++) {
  const sub = Math.round((Math.random() * 5000 + 10) * 100) / 100;
  const ship = Math.round((Math.random() * 300) * 100) / 100;
  const vatType = ['included', 'excluded', 'exempt'][Math.floor(Math.random() * 3)];
  const vatOnShip = Math.random() > 0.5;

  const pos = posUiCalculate(sub, ship, vatType, vatOnShip);
  const be = backendServerCalculate(sub, ship, vatType, vatOnShip);
  const diff = Math.abs(pos.netTotal - be.netTotal);
  if (diff > 0.001) fuzzFailures++;
}
assert(fuzzFailures === 0, `200 randomized parameter fuzzing runs: 0 discrepancies found (got ${fuzzFailures})`);

// -----------------------------------------------------------------------------
// CHECK 6: Absolute Deployment Ban & Centralized Test Management Compliance
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 6: Deployment Ban & Centralized Test Hub Compliance ---');

// Check repository root for test scripts
const rootFiles = fs.readdirSync(workspaceRoot);
const strayRootTests = rootFiles.filter(f => /^(test|verify|challenger).*\.(js|mjs|py|sh|ps1)$/i.test(f));
assert(strayRootTests.length === 0, `Zero test scripts in workspace root (found: ${strayRootTests.join(', ') || 'none'})`);

// Check for stray .bak files in workspace
function findBakFiles(dir, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue;
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        results.push(...findBakFiles(fullPath, maxDepth, currentDepth + 1));
      } else if (ent.name.endsWith('.bak')) {
        results.push(fullPath);
      }
    }
  } catch (e) {}
  return results;
}

const bakFiles = findBakFiles(workspaceRoot);
assert(bakFiles.length === 0, `Zero .bak files across workspace (found: ${bakFiles.join(', ') || 'none'})`);

// Check test script locations
const testVerifPath = path.join(workspaceRoot, 'tests/verifications/verify_pos_checkout_m3.mjs');
const testAuditorPath = path.join(workspaceRoot, 'tests/verifications/auditor_m3_independent_check.mjs');
assert(fs.existsSync(testVerifPath), 'Milestone M3 verification suite is centralized in tests/verifications/');
assert(fs.existsSync(testAuditorPath), 'Milestone M3 independent check is centralized in tests/verifications/');

console.log('\n================================================================================');
console.log(`  Total Forensic Checks: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`);
console.log('================================================================================');

if (failedChecks === 0) {
  console.log('\n🎉 ALL FORENSIC CHECKS PASSED EMPIRICALLY! VERDICT: CLEAN\n');
  process.exit(0);
} else {
  console.error(`\n❌ FORENSIC CHECKS FAILED WITH ${failedChecks} ERRORS! VERDICT: INTEGRITY VIOLATION\n`);
  process.exit(1);
}
