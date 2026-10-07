import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

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

console.log('🔍 [Phase 2 P1 Verification] Verifying CustomerRow, CustomerHeader, StatsService, and UserClaimsTrigger...');

// 1. Verify CustomerRow.jsx fallback for logisticText
const customerRowPath = path.join(projectRoot, 'dh-backoffice-react/src/pages/Customers/components/layout/CustomerRow.jsx');
const customerRowContent = fs.readFileSync(customerRowPath, 'utf8');

assert(
  customerRowContent.includes('customer.logisticProvider || customer.preferredCourier || customer.courier || customer.shippingMethod || \'-\''),
  'CustomerRow.jsx provides complete courier fallback (logisticProvider -> preferredCourier -> courier -> shippingMethod -> "-")'
);

// 2. Verify CustomerHeader.jsx onRefresh passing useCache = false
const customerHeaderPath = path.join(projectRoot, 'dh-backoffice-react/src/pages/Customers/components/layout/CustomerHeader.jsx');
const customerHeaderContent = fs.readFileSync(customerHeaderPath, 'utf8');

assert(
  customerHeaderContent.includes('onClick={() => onRefresh(false)}'),
  'CustomerHeader.jsx calls onRefresh(false) on refresh button click to clear cache and pull fresh data'
);

// 3. Verify customerOrderStatsService.js missing catalog cache guard
const statsServicePath = path.join(projectRoot, 'dh-backoffice-react/src/pages/Customers/services/customerOrderStatsService.js');
const statsServiceContent = fs.readFileSync(statsServicePath, 'utf8');

assert(
  statsServiceContent.includes('activeCatalogMemoryCache?.missing') &&
  statsServiceContent.includes('STATS_CACHE_TTL_MS'),
  'customerOrderStatsService.js implements activeCatalogMemoryCache.missing TTL guard to eliminate ghost reads on missing catalog'
);

// 4. Verify userClaimsTrigger.js mapping and export
const claimsTriggerPath = path.join(projectRoot, 'functions/auth/userClaimsTrigger.js');
const claimsTriggerContent = fs.readFileSync(claimsTriggerPath, 'utf8');

assert(
  fs.existsSync(claimsTriggerPath),
  'functions/auth/userClaimsTrigger.js exists'
);

assert(
  claimsTriggerContent.includes("'เจ้าของ'") &&
  claimsTriggerContent.includes("'ผู้จัดการ'") &&
  claimsTriggerContent.includes("'พนักงานแพ็ค'") &&
  claimsTriggerContent.includes("'บัญชี'"),
  'userClaimsTrigger.js correctly maps Thai role strings (owner, manager, packer, staff)'
);

import { pathToFileURL } from 'url';

// 5. Dynamic import of userClaimsTrigger mapRoleToClaims
const { mapRoleToClaims } = await import(pathToFileURL(claimsTriggerPath).href);

const adminClaims = mapRoleToClaims('เจ้าของ');
assert(adminClaims.role === 'admin' && adminClaims.isAdmin === true && adminClaims.isStaff === true, 'Thai "เจ้าของ" maps to admin with isAdmin=true');

const managerClaims = mapRoleToClaims('ผู้จัดการ');
assert(managerClaims.role === 'manager' && managerClaims.isManager === true && managerClaims.isAdmin === false, 'Thai "ผู้จัดการ" maps to manager');

const packerClaims = mapRoleToClaims('พนักงานแพ็ค');
assert(packerClaims.role === 'packer' && packerClaims.isStaff === true && packerClaims.isManager === false, 'Thai "พนักงานแพ็ค" maps to packer with isStaff=true');

const customerClaims = mapRoleToClaims('member');
assert(customerClaims.role === 'customer' && customerClaims.isStaff === false, 'Unknown or member maps to customer');

// 6. Verify functions/index.js exports userClaimsTrigger
const functionsIndexPath = path.join(projectRoot, 'functions/index.js');
const functionsIndexContent = fs.readFileSync(functionsIndexPath, 'utf8');

assert(
  functionsIndexContent.includes("require('./auth/userClaimsTrigger')") &&
  functionsIndexContent.includes('...userClaimsTrigger'),
  'functions/index.js exports userClaimsTrigger'
);

console.log(`\n==============================================`);
console.log(`Phase 2 P1 Verification Summary: ${passCount} Passed, ${failCount} Failed`);
console.log(`==============================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
