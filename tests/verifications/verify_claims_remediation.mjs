import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const mgmtDir = path.join(rootDir, 'Management System');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

console.log('=== VERIFY CLAIMS AUTO-REMEDIATION ===\n');

// 1. Verify ClaimItemCard.jsx
console.log('1. Checking ClaimItemCard.jsx:');
const claimItemCardPath = path.join(mgmtDir, 'dh-frontend/src/components/profile/tabs/claims/ClaimItemCard.jsx');
const claimItemCardContent = fs.readFileSync(claimItemCardPath, 'utf8');

assert(!claimItemCardContent.includes("getCollectionPath('todos')"), 'No getCollectionPath("todos") reference exists in ClaimItemCard.jsx');
assert(claimItemCardContent.includes("getCollectionPath('claims')"), 'ClaimItemCard.jsx targets getCollectionPath("claims")');
assert(claimItemCardContent.includes("import { useToast } from '../../../../context/ToastContext';"), 'useToast is imported from ToastContext');
assert(claimItemCardContent.includes("const { showToast } = useToast();"), 'const { showToast } = useToast() is initialized');
assert(claimItemCardContent.includes("showToast("), 'showToast is called in ClaimItemCard.jsx');

// 2. Verify claimRequestService.js customerUid at document root
console.log('\n2. Checking claimRequestService.js:');
const claimReqServicePath = path.join(mgmtDir, 'dh-backoffice-react/src/firebase/claim/claimRequestService.js');
const claimReqServiceContent = fs.readFileSync(claimReqServicePath, 'utf8');

// Check requestClaim
const requestClaimMatch = claimReqServiceContent.match(/requestClaim[\s\S]*?transaction\.set\(newClaimRef,\s*\{([\s\S]*?)\}\);/);
assert(requestClaimMatch !== null, 'Found requestClaim transaction.set block');
if (requestClaimMatch) {
  assert(requestClaimMatch[1].includes("customerUid: bill.customer?.uid || 'Walk-in'"), 'requestClaim includes customerUid at document root');
}

// Check requestReturn
const requestReturnMatch = claimReqServiceContent.match(/requestReturn[\s\S]*?transaction\.set\(newClaimRef,\s*\{([\s\S]*?)\}\);/);
assert(requestReturnMatch !== null, 'Found requestReturn transaction.set block');
if (requestReturnMatch) {
  assert(requestReturnMatch[1].includes("customerUid: bill.customer?.uid || 'Walk-in'"), 'requestReturn includes customerUid at document root');
}

// 3. Verify firestore.rules
console.log('\n3. Checking firestore.rules:');
const firestoreRulesPath = path.join(mgmtDir, 'firestore.rules');
const firestoreRulesContent = fs.readFileSync(firestoreRulesPath, 'utf8');

const claimsRuleMatch = firestoreRulesContent.match(/match\s+\/claims\/\{claimId\}[\s\S]*?allow\s+update:\s*if([\s\S]*?);\s*allow\s+delete/);
assert(claimsRuleMatch !== null, 'Found /claims/{claimId} allow update block');
if (claimsRuleMatch) {
  const updateRule = claimsRuleMatch[1];
  assert(updateRule.includes("CANCEL_CLAIM_APPROVAL") && 
         updateRule.includes("CANCEL_EXCHANGE_APPROVAL") && 
         updateRule.includes("CANCEL_RETURN_APPROVAL") &&
         updateRule.includes("pending_manager"), 
         'firestore.rules permits staff to mutate type to CANCEL_* when status is pending_manager');
  assert(updateRule.includes("waiting_item") && 
         updateRule.includes("trackingNo"), 
         'firestore.rules allows customer to update trackingNo when status is waiting_item');
}

// 4. Verify firestore.indexes.json
console.log('\n4. Checking firestore.indexes.json:');
const indexesPath = path.join(mgmtDir, 'firestore.indexes.json');
const indexesContent = fs.readFileSync(indexesPath, 'utf8');
const indexesJson = JSON.parse(indexesContent);

const claimsIndexes = indexesJson.indexes.filter(idx => idx.collectionGroup === 'claims');
const customerUidIndex = claimsIndexes.find(idx => 
  idx.fields.some(f => f.fieldPath === 'customerUid' && f.order === 'ASCENDING') &&
  idx.fields.some(f => f.fieldPath === 'createdAt' && f.order === 'DESCENDING')
);
assert(customerUidIndex !== undefined, 'firestore.indexes.json contains composite index for claims: customerUid ASC + createdAt DESC');

// 5. Verify UI Hardening (ClaimStepper.jsx & ProductInfo.jsx)
console.log('\n5. Checking UI Component Hardening:');
const stepperPath = path.join(mgmtDir, 'dh-backoffice-react/src/pages/claims/components/detail/ClaimStepper.jsx');
const stepperContent = fs.readFileSync(stepperPath, 'utf8');
assert(stepperContent.includes("type?.startsWith('CANCEL_')"), 'ClaimStepper.jsx uses optional chaining type?.startsWith("CANCEL_")');

const productInfoPath = path.join(mgmtDir, 'dh-backoffice-react/src/pages/claims/components/detail/ProductInfo.jsx');
const productInfoContent = fs.readFileSync(productInfoPath, 'utf8');
assert(productInfoContent.includes("const payload = selectedRequest?.payload || {};"), 'ProductInfo.jsx defines root-level null-safe fallback for payload');
assert(!productInfoContent.includes("selectedRequest.payload."), 'ProductInfo.jsx does not access selectedRequest.payload.* directly');

// 6. Verify ssr memory claims.md
console.log('\n6. Checking ssr memory claims.md:');
const ssrMemoryPath = path.join(mgmtDir, 'dh-backoffice-react/src/pages/claims/ssr memory claims.md');
const ssrMemoryContent = fs.readFileSync(ssrMemoryPath, 'utf8');
const lines = ssrMemoryContent.trim().split('\n');

assert(!ssrMemoryContent.includes('<watchlist>'), 'ssr memory claims.md does not contain <watchlist>');
assert(!ssrMemoryContent.includes('</watchlist>'), 'ssr memory claims.md does not contain </watchlist>');

const standardTags = [
  'flow_and_entry',
  'core_schema',
  'business_rules',
  'cross_impact',
  'pitfalls_and_lessons'
];

let tagCount = 0;
for (const tag of standardTags) {
  if (ssrMemoryContent.includes(`<${tag}>`) && ssrMemoryContent.includes(`</${tag}>`)) {
    tagCount++;
  }
}
assert(tagCount === 5, `ssr memory claims.md contains exactly 5 standard XML sections (found ${tagCount})`);
assert(lines.length <= 80, `ssr memory claims.md line count is <= 80 lines (actual: ${lines.length})`);
assert(Buffer.byteLength(ssrMemoryContent, 'utf8') <= 6144, `ssr memory claims.md byte size is <= 6KB (actual: ${Buffer.byteLength(ssrMemoryContent, 'utf8')} bytes)`);

console.log('\n=====================================');
console.log(`TOTAL CHECKS: ${totalTests}`);
console.log(`PASSED:       ${passedTests}`);
console.log(`FAILED:       ${failedTests}`);
console.log('=====================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
