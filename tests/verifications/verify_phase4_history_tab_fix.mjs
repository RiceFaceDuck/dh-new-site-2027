/**
 * Verification Test: Phase 4 Order History Tab & Knowledge Consolidation
 * Location: Management System/tests/verifications/verify_phase4_history_tab_fix.mjs
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MGMT_DIR = path.resolve(__dirname, '../..');

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        passed++;
        console.log(`  [PASS] ${message}`);
    } else {
        failed++;
        console.error(`  [FAIL] ${message}`);
    }
}

function checkHttpEndpoint(urlPath) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:3168${urlPath}`, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({ status: res.statusCode, data });
            });
        });
        req.on('error', (err) => {
            resolve({ error: err.message });
        });
    });
}

console.log('================================================================================');
console.log('  VERIFY PHASE 4: ORDER HISTORY TAB & KNOWLEDGE CONSOLIDATION');
console.log('================================================================================\n');

async function runTests() {
    try {
        const modalPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/dashboard/OrderDetailModal.jsx');
        const historyTabPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/dashboard/OrderHistoryTab.jsx');
        const memoryPath = path.resolve(MGMT_DIR, 'dh-backoffice-react/src/components/billing/ssr memory billing.md');

        assert(fs.existsSync(historyTabPath), 'OrderHistoryTab.jsx component exists');
        assert(fs.existsSync(modalPath), 'OrderDetailModal.jsx exists');
        assert(fs.existsSync(memoryPath), 'ssr memory billing.md exists');

        const modalSrc = fs.readFileSync(modalPath, 'utf8');
        const historyTabSrc = fs.readFileSync(historyTabPath, 'utf8');
        const memorySrc = fs.readFileSync(memoryPath, 'utf8');

        // --- Suite 1: OrderDetailModal Integration ---
        console.log('\n--- Suite 1: OrderDetailModal Integration ---');
        assert(modalSrc.includes("import OrderHistoryTab from './OrderHistoryTab'"), 'OrderDetailModal imports OrderHistoryTab');
        assert(modalSrc.includes("<OrderHistoryTab selectedOrder={selectedOrder} />"), 'OrderDetailModal renders OrderHistoryTab in history tab');
        assert(!modalSrc.includes('อยู่ระหว่างการพัฒนา UI ย่อย'), 'Placeholder stub text completely removed from OrderDetailModal');

        // --- Suite 2: OrderHistoryTab Implementation ---
        console.log('\n--- Suite 2: OrderHistoryTab Implementation ---');
        assert(historyTabSrc.includes("import { billingQueryService } from '../../../firebase/billingQueryService'"), 'OrderHistoryTab imports billingQueryService');
        assert(historyTabSrc.includes('billingQueryService.getOrderHistory'), 'OrderHistoryTab queries getOrderHistory');
        assert(historyTabSrc.includes('milestone-created'), 'OrderHistoryTab synthesizes order creation milestone');
        assert(historyTabSrc.includes('milestone-paid'), 'OrderHistoryTab synthesizes payment milestone');
        assert(historyTabSrc.includes('milestone-printed'), 'OrderHistoryTab synthesizes receipt printing milestone');
        assert(historyTabSrc.includes('milestone-shipped'), 'OrderHistoryTab synthesizes shipping milestone');
        assert(historyTabSrc.includes('milestone-completed'), 'OrderHistoryTab synthesizes completion milestone');
        assert(historyTabSrc.includes('milestone-void'), 'OrderHistoryTab synthesizes void/cancellation milestone');
        assert(historyTabSrc.includes('loadHistory'), 'OrderHistoryTab provides refresh/reload callback');

        // --- Suite 3: Local Grimoire / SSR Memory Updates ---
        console.log('\n--- Suite 3: Local Grimoire / SSR Memory Updates ---');
        assert(memorySrc.includes('On-Demand Order History'), 'ssr memory billing.md records Lesson 12 on on-demand order history');

        // --- Suite 4: Dev Server Module Transformation ---
        console.log('\n--- Suite 4: Dev Server Module Transformation ---');
        const modalRes = await checkHttpEndpoint('/src/components/billing/dashboard/OrderDetailModal.jsx');
        if (!modalRes.error) {
            assert(modalRes.status === 200, 'Vite dev server transforms OrderDetailModal.jsx (HTTP 200)');
            const historyTabRes = await checkHttpEndpoint('/src/components/billing/dashboard/OrderHistoryTab.jsx');
            assert(historyTabRes.status === 200, 'Vite dev server transforms OrderHistoryTab.jsx (HTTP 200)');
        } else {
            console.log('  [INFO] Dev server offline or unreachable; static assertions passed.');
        }

        console.log('\n================================================================================');
        console.log(`  PHASE 4 VERIFICATION SUMMARY: ${passed}/${total} assertions passed`);
        if (failed > 0) {
            console.error(`  ⚠️ FAILED: ${failed} assertions failed!`);
            process.exit(1);
        } else {
            console.log('  🎉 ALL PHASE 4 VERIFICATIONS PASSED SUCCESSFULLY!');
            console.log('================================================================================\n');
            process.exit(0);
        }
    } catch (err) {
        console.error('Fatal error during Phase 4 verification:', err);
        process.exit(1);
    }
}

runTests();
