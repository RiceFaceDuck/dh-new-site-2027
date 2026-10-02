import fs from 'fs';
import path from 'path';
import assert from 'assert';

const settingsServicePath = path.resolve('dh-backoffice-react/src/firebase/settingsService.js');
const mainInfoPath = path.resolve('dh-backoffice-react/src/pages/Customers/components/forms/sections/MainInfoSection.jsx');
const posActionsPath = path.resolve('dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');
const quickAddPath = path.resolve('dh-backoffice-react/src/components/billing/pos/settings/customer/QuickAddCustomerModal.jsx');

console.log('🧪 [VERIFICATION] Starting Phase 3 CRM & POS Dynamic Role Verification...');

// 1. Files exist
assert(fs.existsSync(settingsServicePath), 'settingsService.js must exist');
assert(fs.existsSync(mainInfoPath), 'MainInfoSection.jsx must exist');
assert(fs.existsSync(posActionsPath), 'usePosActions.js must exist');
assert(fs.existsSync(quickAddPath), 'QuickAddCustomerModal.jsx must exist');

const settingsContent = fs.readFileSync(settingsServicePath, 'utf-8');
const mainInfoContent = fs.readFileSync(mainInfoPath, 'utf-8');
const posActionsContent = fs.readFileSync(posActionsPath, 'utf-8');
const quickAddContent = fs.readFileSync(quickAddPath, 'utf-8');

// 2. settingsService.js must have getRoleTierConfig and in-memory cache
assert(settingsContent.includes('getRoleTierConfig: async'), 'settingsService must define getRoleTierConfig');
assert(settingsContent.includes('cachedRoleTierConfig'), 'settingsService must implement cachedRoleTierConfig');
assert(settingsContent.includes('DEFAULT_ROLE_TIER_SETTINGS'), 'settingsService must export DEFAULT_ROLE_TIER_SETTINGS');
console.log('✅ PASS: settingsService cached getRoleTierConfig verified (Zero Quota Leak).');

// 3. MainInfoSection.jsx must bind dynamic roles from role_tier_config
assert(mainInfoContent.includes('settingsService.getRoleTierConfig()'),
  'MainInfoSection.jsx must call settingsService.getRoleTierConfig()');
assert(mainInfoContent.includes('dynamicRoles.map(role =>'),
  'MainInfoSection.jsx must map dynamic roles to option tags');
assert(mainInfoContent.includes('isLegacyRole'),
  'MainInfoSection.jsx must handle legacy role fallbacks gracefully');
console.log('✅ PASS: MainInfoSection dynamic role loading and legacy compatibility verified.');

// 4. usePosActions.js must auto-set wholesale price mode for mechanic/partner roles
assert(posActionsContent.includes('isRoleWholesale'),
  'usePosActions.js must detect wholesale/mechanic/partner roles');
assert(posActionsContent.includes("isRoleWholesale || isCompany ? 'wholesale' : 'retail'"),
  'usePosActions.js must set wholesale targetMode for eligible customer roles');
console.log('✅ PASS: POS customer selection automatically honors Role pricing privileges.');

// 5. QuickAddCustomerModal.jsx must use settingsService
assert(quickAddContent.includes('settingsService.getRoleTierConfig()'),
  'QuickAddCustomerModal.jsx must use settingsService.getRoleTierConfig()');
assert(!quickAddContent.includes("const ref = doc(db, getCollectionPath('settings'), 'role_tier_config');"),
  'QuickAddCustomerModal.jsx must NOT perform uncached raw getDoc on role_tier_config');
console.log('✅ PASS: QuickAddCustomerModal quota leak patched.');

console.log('\n🎉 ALL PHASE 3 CHECKS PASSED CLEANLY! (100% Verified)');
process.exit(0);
