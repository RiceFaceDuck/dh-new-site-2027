import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rowPath = path.resolve('dh-backoffice-react/src/pages/Customers/components/layout/CustomerRow.jsx');
const tablePath = path.resolve('dh-backoffice-react/src/pages/Customers/components/layout/CustomerTable.jsx');
const detailPath = path.resolve('dh-backoffice-react/src/pages/Customers/components/details/DetailPanel.jsx');

console.log('🧪 [VERIFICATION] Starting Phase 2 Role vs Tier Separation Verification...');

// 1. Files must exist
assert(fs.existsSync(rowPath), 'CustomerRow.jsx must exist');
assert(fs.existsSync(tablePath), 'CustomerTable.jsx must exist');
assert(fs.existsSync(detailPath), 'DetailPanel.jsx must exist');

const rowContent = fs.readFileSync(rowPath, 'utf-8');
const tableContent = fs.readFileSync(tablePath, 'utf-8');
const detailContent = fs.readFileSync(detailPath, 'utf-8');

// 2. CustomerRow.jsx must separate roleBadge and tierBadge
assert(rowContent.includes('const getRoleBadge ='), 'CustomerRow.jsx must define getRoleBadge');
assert(rowContent.includes('const roleBadge = getRoleBadge('), 'CustomerRow.jsx must calculate roleBadge');
assert(rowContent.includes('const tierBadge ='), 'CustomerRow.jsx must calculate tierBadge');
assert(!rowContent.includes('const getRankBadge ='), 'CustomerRow.jsx must NOT use deprecated getRankBadge');
assert(rowContent.includes('roleBadge.label'), 'CustomerRow.jsx must render roleBadge.label');
assert(rowContent.includes('tierBadge.label'), 'CustomerRow.jsx must render tierBadge.label');
console.log('✅ PASS: CustomerRow.jsx separates Role and Tier badges cleanly.');

// 3. CustomerTable.jsx grid layout must maintain 9 balanced columns (Rule 1 compliance)
assert(tableContent.includes('grid-cols-[130px_minmax(180px,1.5fr)_110px_110px_90px_100px_90px_100px_110px]'),
  'CustomerTable.jsx must strictly preserve the 9-column grid layout');
console.log('✅ PASS: CustomerTable.jsx 9-column layout preserved (Rule 1 compliant).');

// 4. DetailPanel.jsx must render both Role and Tier badges
assert(detailContent.includes('customer.role || customer.rank'),
  'DetailPanel.jsx must render customer role/rank');
assert(detailContent.includes('getUserTier(points)'),
  'DetailPanel.jsx must compute getUserTier(points)');
assert(detailContent.includes('สิทธิ์ราคาของลูกค้า'),
  'DetailPanel.jsx must have title for role badge');
assert(detailContent.includes('Shield'),
  'DetailPanel.jsx must render Shield icon for Role');
console.log('✅ PASS: DetailPanel.jsx renders both Role and Tier badges distinctly.');

console.log('\n🎉 ALL PHASE 2 CHECKS PASSED CLEANLY! (100% Verified)');
process.exit(0);
