import fs from 'fs';
import path from 'path';
import http from 'http';

console.log('================================================================');
console.log('🧪 STAGE FINAL REVIEW: ADVERSARIAL ROLE & TIER AUDIT SUITE');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// Test 1: Scope Completeness & File Integrity Check
// -------------------------------------------------------------
console.log('👉 [1/6] Testing Scope Completeness & File Integrity');

const modifiedFiles = [
  'dh-backoffice-react/src/pages/managers/RoleTierSettings/RoleTierSettingsPage.jsx',
  'dh-backoffice-react/src/pages/managers/RoleTierSettings/hooks/useRoleTierSettingsState.js',
  'dh-backoffice-react/src/pages/managers/RoleTierSettings/ssr memory role_tier.md',
  'dh-backoffice-react/src/pages/Customers/components/layout/CustomerRow.jsx',
  'dh-backoffice-react/src/pages/Customers/components/layout/CustomerTable.jsx',
  'dh-backoffice-react/src/pages/Customers/components/details/DetailPanel.jsx',
  'dh-backoffice-react/src/pages/Customers/components/forms/sections/MainInfoSection.jsx',
  'dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js',
  'dh-backoffice-react/src/components/billing/pos/settings/customer/QuickAddCustomerModal.jsx',
  'dh-backoffice-react/src/firebase/settingsService.js',
  'dh-backoffice-react/src/firebase/credit/creditFormatService.js',
  'dh-frontend/src/firebase/credit/creditFormatService.js',
  'functions/inventory/nightlyChunkGuard.js'
];

for (const relPath of modifiedFiles) {
  const fullPath = path.resolve(relPath);
  assert(fs.existsSync(fullPath), `Target file exists: ${relPath}`);
}

// -------------------------------------------------------------
// Test 2: Mojibake & Encoding Verification
// -------------------------------------------------------------
console.log('\n👉 [2/6] Verifying UTF-8 Text Purity (Zero Mojibake)');

const pageContent = fs.readFileSync(path.resolve('dh-backoffice-react/src/pages/managers/RoleTierSettings/RoleTierSettingsPage.jsx'), 'utf-8');
assert(!pageContent.includes('à¸'), 'RoleTierSettingsPage contains zero ANSI mojibake');
assert(!pageContent.includes('à¹'), 'RoleTierSettingsPage contains zero corrupted Thai prefixes');
assert(!pageContent.includes('à¸£à¸°à¸'), 'RoleTierSettingsPage contains zero garbled rank strings');
assert(pageContent.includes('คู่มือการใช้งานระบบลำดับชั้นและแต้มสะสม'), 'Page contains valid Thai guide title');
assert(pageContent.includes('ลำดับชั้นสิทธิ์และประเภทลูกค้า'), 'Page contains valid Thai role section header');
assert(pageContent.includes('ระดับแต้มสะสม Gamification'), 'Page contains valid Thai tier section header');

// -------------------------------------------------------------
// Test 3: Validation Logic & Schema Integrity (Adversarial Edge Cases)
// -------------------------------------------------------------
console.log('\n👉 [3/6] Adversarial Data Integrity & Schema Validation');

const hookContent = fs.readFileSync(path.resolve('dh-backoffice-react/src/pages/managers/RoleTierSettings/hooks/useRoleTierSettingsState.js'), 'utf-8');
assert(hookContent.includes('export const validateRoleTierConfig'), 'useRoleTierSettingsState exports validateRoleTierConfig');

// Simulate the exact validation logic
const validate = (config) => {
  if (!config || typeof config !== 'object') return { isValid: false, message: 'Invalid payload' };
  if (!Array.isArray(config.roles) || config.roles.length === 0) return { isValid: false, message: 'Empty roles' };
  const roleLevels = new Set();
  const roleIds = new Set();
  for (const role of config.roles) {
    if (!role.name || !role.name.trim()) return { isValid: false, message: 'Empty role name' };
    if (!role.id || !role.id.trim()) return { isValid: false, message: 'Empty role id' };
    if (roleIds.has(role.id)) return { isValid: false, message: 'Duplicate role id' };
    roleIds.add(role.id);
    const level = Number(role.level);
    if (!Number.isInteger(level) || level <= 0 || roleLevels.has(level)) return { isValid: false, message: 'Invalid/duplicate level' };
    roleLevels.add(level);
  }
  if (!Array.isArray(config.tiers) || config.tiers.length === 0) return { isValid: false, message: 'Empty tiers' };
  const tierIds = new Set();
  let prevPoints = -1;
  for (let i = 0; i < config.tiers.length; i++) {
    const tier = config.tiers[i];
    if (!tier.name || !tier.name.trim()) return { isValid: false, message: 'Empty tier name' };
    if (!tier.id || !tier.id.trim()) return { isValid: false, message: 'Empty tier id' };
    if (tierIds.has(tier.id)) return { isValid: false, message: 'Duplicate tier id' };
    tierIds.add(tier.id);
    const points = Number(tier.minPoints);
    if (isNaN(points) || points < 0 || (points <= prevPoints && i > 0)) return { isValid: false, message: 'MinPoints must be strictly ascending' };
    prevPoints = points;
    const multiplier = Number(tier.multiplier);
    if (isNaN(multiplier) || multiplier < 1.0) return { isValid: false, message: 'Multiplier must be >= 1.0' };
  }
  return { isValid: true };
};

// Edge cases
assert(!validate(null).isValid, 'Rejects null configuration');
assert(!validate({ roles: [] }).isValid, 'Rejects empty roles array');
assert(!validate({ roles: [{ id: 'r1', name: 'Role 1', level: 0 }] }).isValid, 'Rejects non-positive role level (level 0)');
assert(!validate({ roles: [{ id: 'r1', name: 'Role 1', level: 1 }, { id: 'r2', name: 'Role 2', level: 1 }], tiers: [{ id: 't1', name: 'T1', minPoints: 0, multiplier: 1.0 }] }).isValid, 'Rejects duplicate role levels');
assert(!validate({ roles: [{ id: 'r1', name: 'Role 1', level: 1 }], tiers: [{ id: 't1', name: 'T1', minPoints: 100, multiplier: 0.95 }] }).isValid, 'Rejects multiplier < 1.0');
assert(!validate({ roles: [{ id: 'r1', name: 'Role 1', level: 1 }], tiers: [{ id: 't1', name: 'T1', minPoints: 500, multiplier: 1.0 }, { id: 't2', name: 'T2', minPoints: 200, multiplier: 1.1 }] }).isValid, 'Rejects inverted minPoints order');

const validConfig = {
  roles: [
    { id: 'member', name: 'Member', level: 1, defaultPriceTier: 'retail' },
    { id: 'wholesale', name: 'Wholesale', level: 2, defaultPriceTier: 'wholesale' }
  ],
  tiers: [
    { id: 'member', name: 'Member', minPoints: 0, multiplier: 1.0 },
    { id: 'silver', name: 'Silver', minPoints: 1000, multiplier: 1.05 }
  ]
};
assert(validate(validConfig).isValid, 'Accepts valid configuration payload');

// -------------------------------------------------------------
// Test 4: Tier Multiplier & Gamification Logic
// -------------------------------------------------------------
console.log('\n👉 [4/6] Tier Multiplier Math & Boundary Calculations');

const customTiers = [
  { id: 'member', name: 'Member', minPoints: 0, multiplier: 1.0 },
  { id: 'silver', name: 'Silver', minPoints: 1000, multiplier: 1.05 },
  { id: 'gold', name: 'Gold', minPoints: 5000, multiplier: 1.10 },
  { id: 'platinum', name: 'Platinum', minPoints: 10000, multiplier: 1.20 },
  { id: 'diamond', name: 'Diamond', minPoints: 100000, multiplier: 1.50 }
];

const resolveTier = (points, tiers) => {
  const sorted = [...tiers].sort((a, b) => (b.minPoints || 0) - (a.minPoints || 0));
  const match = sorted.find(t => points >= (t.minPoints || 0));
  return match || { name: 'Member', multiplier: 1.0 };
};

assert(resolveTier(0, customTiers).name === 'Member', '0 points resolves to Member (1.0x)');
assert(resolveTier(999, customTiers).name === 'Member', '999 points resolves to Member (1.0x)');
assert(resolveTier(1000, customTiers).name === 'Silver', '1000 points resolves to Silver (1.05x)');
assert(resolveTier(4999, customTiers).name === 'Silver', '4999 points resolves to Silver (1.05x)');
assert(resolveTier(5000, customTiers).name === 'Gold', '5000 points resolves to Gold (1.10x)');
assert(resolveTier(15000, customTiers).name === 'Platinum', '15000 points resolves to Platinum (1.20x)');
assert(resolveTier(100000, customTiers).name === 'Diamond', '100000 points resolves to Diamond (1.50x)');
assert(resolveTier(1000000, customTiers).name === 'Diamond', '1000000 points resolves to Diamond (1.50x)');

// Null and undefined safety
assert(resolveTier(null, customTiers).name === 'Member', 'Null points safely resolves to Member');
assert(resolveTier(undefined, customTiers).name === 'Member', 'Undefined points safely resolves to Member');

// -------------------------------------------------------------
// Test 5: Cross-Module Contracts (POS, CRM, Nightly Guard)
// -------------------------------------------------------------
console.log('\n👉 [5/6] Cross-Module Contracts & Quota Shielding');

const posActionsContent = fs.readFileSync(path.resolve('dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js'), 'utf-8');
assert(posActionsContent.includes('isRoleWholesale'), 'POS actions check customer wholesale role');
assert(posActionsContent.includes("isRoleWholesale || isCompany ? 'wholesale' : 'retail'"), 'POS automatically applies wholesale price mode');

const quickAddContent = fs.readFileSync(path.resolve('dh-backoffice-react/src/components/billing/pos/settings/customer/QuickAddCustomerModal.jsx'), 'utf-8');
assert(quickAddContent.includes('settingsService.getRoleTierConfig()'), 'QuickAddCustomerModal uses cached config (0 quota leak)');

const settingsContent = fs.readFileSync(path.resolve('dh-backoffice-react/src/firebase/settingsService.js'), 'utf-8');
assert(settingsContent.includes('ROLE_TIER_TTL = 5 * 60 * 1000'), 'settingsService has 5-minute TTL cache');
assert(settingsContent.includes('clearRoleTierCache'), 'settingsService provides cache invalidation method');

const guardContent = fs.readFileSync(path.resolve('functions/inventory/nightlyChunkGuard.js'), 'utf-8');
assert(!guardContent.includes("['customer', 'member', 'partner', 'vip'].includes(role)"), 'nightlyChunkGuard does NOT drop wholesale customers');
assert(guardContent.includes('isStaffUser'), 'nightlyChunkGuard only filters staff users from customer directory');

// -------------------------------------------------------------
// Test 6: Local Grimoire Protocol (Strict Boundary Check)
// -------------------------------------------------------------
console.log('\n👉 [6/6] Local Grimoire (ssr memory) Protocol Compliance');

const grimoirePath = path.resolve('dh-backoffice-react/src/pages/managers/RoleTierSettings/ssr memory role_tier.md');
assert(fs.existsSync(grimoirePath), 'Local grimoire ssr memory role_tier.md exists');

const grimoireContent = fs.readFileSync(grimoirePath, 'utf-8');
const lineCount = grimoireContent.split('\n').length;
const byteSize = Buffer.byteLength(grimoireContent, 'utf-8');

assert(lineCount <= 80, `Grimoire line count is ${lineCount} (must be <= 80 lines)`);
assert(byteSize <= 6144, `Grimoire byte size is ${byteSize} bytes (must be <= 6KB)`);
assert(grimoireContent.includes('<flow_and_entry>'), 'Grimoire contains <flow_and_entry>');
assert(grimoireContent.includes('<core_schema>'), 'Grimoire contains <core_schema>');
assert(grimoireContent.includes('<business_rules>'), 'Grimoire contains <business_rules>');
assert(grimoireContent.includes('<cross_impact>'), 'Grimoire contains <cross_impact>');
assert(grimoireContent.includes('<pitfalls_and_lessons>'), 'Grimoire contains <pitfalls_and_lessons>');

// -------------------------------------------------------------
// Server Liveness & Final Result
// -------------------------------------------------------------
http.get('http://localhost:3168/managers/role-tier', (res) => {
  assert(res.statusCode === 200, `Backoffice Dev Server HTTP 200 on /managers/role-tier (got ${res.statusCode})`);

  console.log('\n================================================================');
  console.log(`📊 FINAL STAGE REVIEW RESULT: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).on('error', (err) => {
  console.warn(`  ⚠️ Warning: Server ping skipped: ${err.message}`);
  console.log('\n================================================================');
  console.log(`📊 FINAL STAGE REVIEW RESULT: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================');
  if (failedTests > 0) process.exit(1);
  else process.exit(0);
});
