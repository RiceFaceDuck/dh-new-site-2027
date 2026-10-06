import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertToThaiBahtText } from '../../dh-shared/src/utils/formatters/numberFormatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

console.log('🧪 Starting Phase 2 Verification Script...');

// 1. Thai Baht Text Tests
console.log('\n--- 1. Testing Thai Baht Text Grammatical Accuracy ---');
const testCases = [
  { val: 0, expected: 'ศูนย์บาทถ้วน' },
  { val: 11, expected: 'สิบเอ็ดบาทถ้วน' },
  { val: 21, expected: 'ยี่สิบเอ็ดบาทถ้วน' },
  { val: 101, expected: 'หนึ่งร้อยเอ็ดบาทถ้วน' },
  { val: 1001, expected: 'หนึ่งพันเอ็ดบาทถ้วน' },
  { val: 20.50, expected: 'ยี่สิบบาทห้าสิบสตางค์' },
  { val: 121.25, expected: 'หนึ่งร้อยยี่สิบเอ็ดบาทยี่สิบห้าสตางค์' },
  { val: -50, expected: 'ลบห้าสิบบาทถ้วน' }
];

let failedTests = 0;
for (const tc of testCases) {
  const result = convertToThaiBahtText(tc.val);
  if (result === tc.expected) {
    console.log(`  ✓ ${tc.val} -> "${result}"`);
  } else {
    console.error(`  ❌ FAIL: ${tc.val} -> got "${result}", expected "${tc.expected}"`);
    failedTests++;
  }
}

// 2. Check Composite Index for history_logs
console.log('\n--- 2. Checking Composite Index for history_logs ---');
const indexFile = path.join(rootDir, 'firestore.indexes.json');
const indexJson = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
const hasHistoryLogIndex = indexJson.indexes.some(idx => 
  idx.collectionGroup === 'history_logs' &&
  idx.fields.some(f => f.fieldPath === 'targetId') &&
  idx.fields.some(f => f.fieldPath === 'timestamp')
);

if (hasHistoryLogIndex) {
  console.log('  ✓ Composite index for history_logs exists in firestore.indexes.json');
} else {
  console.error('  ❌ FAIL: Composite index for history_logs not found');
  failedTests++;
}

// 3. Check Multi-page Receipt Factoring Removal
console.log('\n--- 3. Checking ReceiptTemplate.jsx Multi-page Accounting Totals ---');
const receiptTemplateFile = path.join(rootDir, 'dh-backoffice-react/src/components/billing/pos/ReceiptTemplate.jsx');
const receiptContent = fs.readFileSync(receiptTemplateFile, 'utf8');

const hasPageFactor = receiptContent.includes('_shippingFee * factor') || receiptContent.includes('_netTotal * factor');
const hasPagingProps = receiptContent.includes('pageIndex={pageIdx + 1}') && receiptContent.includes('totalPages={pageChunks.length}');

if (!hasPageFactor && hasPagingProps) {
  console.log('  ✓ Factor splitting removed; canonical totals and pagination props preserved');
} else {
  console.error('  ❌ FAIL: ReceiptTemplate still factors totals or lacks pagination props');
  failedTests++;
}

// 4. Check Banned Terminology
console.log('\n--- 4. Checking Banned Terminology ("เคลมเปลี่ยน") ---');
const filesToCheck = [
  'dh-backoffice-react/src/firebase/claim/claimRequestService.js',
  'dh-backoffice-react/src/firebase/claim/claimActionService.js',
  'dh-backoffice-react/src/firebase/claim/cancelActionService.js',
  'dh-backoffice-react/src/components/todo/cards/GenericTodoCard.jsx'
];

let bannedFound = false;
for (const relPath of filesToCheck) {
  const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  if (content.includes('เคลมเปลี่ยน')) {
    console.error(`  ❌ FAIL: Banned word "เคลมเปลี่ยน" found in ${relPath}`);
    bannedFound = true;
    failedTests++;
  }
}
if (!bannedFound) {
  console.log('  ✓ Zero occurrences of "เคลมเปลี่ยน" in after-sales files');
}

console.log('\n----------------------------------------');
if (failedTests === 0) {
  console.log('✅ All Phase 2 Accounting & Print Checks Passed Successfully!');
  process.exit(0);
} else {
  console.error(`❌ ${failedTests} checks failed!`);
  process.exit(1);
}
