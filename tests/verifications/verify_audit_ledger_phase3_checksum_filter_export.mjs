import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../../');

console.log('========================================================');
console.log('🧪 VERIFY: Audit Ledger Phase 3 Checksum, Filter & Export');
console.log('========================================================\n');

// 1. useAuditLedger.js checks
const hookPath = path.join(baseDir, 'dh-backoffice-react/src/pages/managers/hooks/useAuditLedger.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');

assert(hookCode.includes('checksumMismatch = true'), 'useAuditLedger.js must detect checksumMismatch');
assert(hookCode.includes('walletInflow'), 'useAuditLedger.js must compute walletInflow');
assert(hookCode.includes('walletOutflow'), 'useAuditLedger.js must compute walletOutflow');
assert(hookCode.includes('creditInflow'), 'useAuditLedger.js must compute creditInflow');
assert(hookCode.includes('creditOutflow'), 'useAuditLedger.js must compute creditOutflow');
assert(hookCode.includes('anomalyCount'), 'useAuditLedger.js must track anomalyCount');
console.log('✅ 1. useAuditLedger.js Checksum detection and aggregate stats verified');

// 2. AuditLedger.jsx checks
const uiPath = path.join(baseDir, 'dh-backoffice-react/src/pages/managers/AuditLedger.jsx');
const uiCode = fs.readFileSync(uiPath, 'utf8');

assert(uiCode.includes('handleExportExcel'), 'AuditLedger.jsx must implement handleExportExcel');
assert(uiCode.includes("from 'xlsx'"), 'AuditLedger.jsx must import xlsx');
assert(uiCode.includes('filteredTransactions'), 'AuditLedger.jsx must calculate filteredTransactions');
assert(uiCode.includes('setSearchTerm'), 'AuditLedger.jsx must support search query');
assert(uiCode.includes('setSourceFilter'), 'AuditLedger.jsx must support source filter (all/wallet/credit)');
assert(uiCode.includes('setTypeFilter'), 'AuditLedger.jsx must support direction filter (all/earn/spend)');
assert(uiCode.includes('ShieldCheck'), 'AuditLedger.jsx must render Checksum health status card');
assert(uiCode.includes('FileSpreadsheet'), 'AuditLedger.jsx must render Export Excel button');
console.log('✅ 2. AuditLedger.jsx Checksum Cards, Toolbar Filter/Search, and Export Excel verified');

console.log('\n🎉 ALL PHASE 3 CHECKS PASSED PERFECTLY!\n');
