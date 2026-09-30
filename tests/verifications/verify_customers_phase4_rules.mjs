import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('🔍 [Phase 4 Verification] Verifying Customers Phase 4 Security Rules Hardening...');

const rulesPath = path.resolve('firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

// 1. Root /users/{userId} create rule
assert(
  rulesContent.includes("request.resource.data.get('totalAccumulatedPoints', 0) == 0"),
  "firestore.rules requires totalAccumulatedPoints == 0 on /users/{userId} create"
);

// 2. Root /users/{userId} update rule for isStaff()
const usersIdx = rulesContent.indexOf("match /users/{userId}");
const usersSection = rulesContent.slice(usersIdx, usersIdx + 2000);

assert(
  usersSection.includes("'status'") &&
  usersSection.includes("'isActive'") &&
  usersSection.includes("'isApproved'"),
  "firestore.rules blacklists 'status', 'isActive', 'isApproved' from staff updates on /users/{userId}"
);

// 3. Artifacts /artifacts/{appId}/users/{userId} create rule
const artifactsIdx = rulesContent.indexOf("match /artifacts/{appId}/users/{userId}");
const artifactsSection = rulesContent.slice(artifactsIdx, artifactsIdx + 2000);

assert(
  artifactsSection.includes("'totalAccumulatedPoints'"),
  "firestore.rules blacklists 'totalAccumulatedPoints' on artifacts users create"
);

// 4. Artifacts /artifacts/{appId}/users/{userId} update rule for isStaff()
assert(
  artifactsSection.includes("'status'") &&
  artifactsSection.includes("'isActive'") &&
  artifactsSection.includes("'isApproved'"),
  "firestore.rules blacklists 'status', 'isActive', 'isApproved' from staff updates on artifacts users"
);

console.log(`\n================================`);
console.log(`Phase 4 Verification: ${passCount} Passed, ${failCount} Failed`);
console.log(`================================`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
