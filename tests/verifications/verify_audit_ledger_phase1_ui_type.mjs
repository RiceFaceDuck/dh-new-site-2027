import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../../');

console.log('========================================================');
console.log('🧪 VERIFY: Audit Ledger Phase 1 UI Rendering & Type Logic');
console.log('========================================================\n');

// 1. AuditLedger.jsx checks
const auditLedgerPath = path.join(baseDir, 'dh-backoffice-react/src/pages/managers/AuditLedger.jsx');
const auditLedgerCode = fs.readFileSync(auditLedgerPath, 'utf8');

assert(auditLedgerCode.includes('renderProp={({ height, width }) =>'), 'AuditLedger.jsx must use renderProp for AutoSizer v2');
assert(auditLedgerCode.includes('finalHeight = height ||'), 'AuditLedger.jsx must handle fallback height');
assert(auditLedgerCode.includes('finalWidth = width ||'), 'AuditLedger.jsx must handle fallback width');
assert(auditLedgerCode.includes('relative w-full h-full'), 'AuditLedger.jsx must provide relative container for AutoSizer');
console.log('✅ 1. AuditLedger.jsx AutoSizer v2 renderProp & responsive container verified');

// 2. useAuditLedger.js checks
const hookPath = path.join(baseDir, 'dh-backoffice-react/src/pages/managers/hooks/useAuditLedger.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');

assert(hookCode.includes("rawType === 'add' || rawType === 'deposit' || rawType === 'earn' || rawType === 'topup' || rawType === 'reversal'"), 'Credit type normalization must include deposit, add, earn, topup, reversal');
assert(hookCode.includes("rawType === 'refund' || rawType === 'deposit' || rawType === 'topup' || rawType === 'withdrawal_rejected' || rawType === 'reversal'"), 'Wallet type normalization must include refund, deposit, topup, withdrawal_rejected, reversal');
assert(hookCode.includes('Math.abs(Number(data.amount || 0))'), 'Amounts must be normalized to positive absolute values');
assert(hookCode.includes('data.timestamp?.toDate ? data.timestamp.toDate()'), 'Timestamp must safely handle toDate or Date');
console.log('✅ 2. useAuditLedger.js type normalization, safe timestamp, and absolute amounts verified');

console.log('\n🎉 ALL PHASE 1 CHECKS PASSED PERFECTLY!\n');
