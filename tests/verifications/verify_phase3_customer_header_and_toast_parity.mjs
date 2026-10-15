import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEADER_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/components/layout/CustomerHeader.jsx');
const FILTERS_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerFilters.js');
const ACTIONS_PATH = path.resolve(__dirname, '../../dh-backoffice-react/src/pages/Customers/hooks/useCustomerActions.js');

console.log('🧪 Starting Verification Suite: Phase 3 Customer UI/UX & Toast Hygiene Parity');

// 1. Files Exist
assert(fs.existsSync(HEADER_PATH), 'CustomerHeader.jsx must exist');
assert(fs.existsSync(FILTERS_PATH), 'useCustomerFilters.js must exist');
assert(fs.existsSync(ACTIONS_PATH), 'useCustomerActions.js must exist');
console.log('  ✅ PASS: All 3 target files exist');

// 2. Verify Role Filters in CustomerHeader.jsx
const headerCode = fs.readFileSync(HEADER_PATH, 'utf-8');
assert(headerCode.includes('value="role_mechanic"'), 'CustomerHeader must include role_mechanic option');
assert(headerCode.includes('value="role_vip"'), 'CustomerHeader must include role_vip option');
assert(headerCode.includes('Zap') && headerCode.includes('Crown'), 'CustomerHeader must import Zap and Crown icons');
console.log('  ✅ PASS: CustomerHeader includes Role filters (ร้านช่าง, VIP) with themed icons');

// 3. Verify Filter Logic in useCustomerFilters.js
const filtersCode = fs.readFileSync(FILTERS_PATH, 'utf-8');
assert(filtersCode.includes("quickFilter === 'role_mechanic'"), 'useCustomerFilters must handle role_mechanic');
assert(filtersCode.includes("quickFilter === 'role_vip'"), 'useCustomerFilters must handle role_vip');
console.log('  ✅ PASS: Filter engine supports dynamic pricing role segregation');

// 4. Verify Zero Legacy alert() in useCustomerActions.js
const actionsCode = fs.readFileSync(ACTIONS_PATH, 'utf-8');
const alertMatches = actionsCode.match(/\balert\s*\(/g);
assert(!alertMatches || alertMatches.length === 0, `All legacy alert() calls must be replaced with toast, found ${alertMatches ? alertMatches.length : 0}`);
assert(actionsCode.includes('toast.error'), 'Must use toast.error for notifications');
console.log('  ✅ PASS: 100% legacy alert() calls eliminated; modern toast notifications active');

console.log('\n🎉 ALL PHASE 3 VERIFICATIONS PASSED (4/4)');
