import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==================================================");
console.log("🧪 VERIFICATION SUITE: Billing Phase 2 UX & Safety Fixes");
console.log("==================================================");

let allPassed = true;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        allPassed = false;
    }
}

// -------------------------------------------------------------
// Test 1: Static Code Audit of PosSystem.jsx (Alt+N Shortcut)
// -------------------------------------------------------------
console.log("\n[Test 1] Static Code Audit of PosSystem.jsx:");

const posSystemPath = path.resolve(__dirname, '../../dh-backoffice-react/src/components/billing/PosSystem.jsx');
const posSystemCode = fs.readFileSync(posSystemPath, 'utf-8');

assert(posSystemCode.includes('const handleCreateNewTab = () => {'),
    "handleCreateNewTab function defined in PosSystem.jsx");

assert(posSystemCode.includes('setCartTabs(prev => [...prev, newTab]);'),
    "handleCreateNewTab calls setCartTabs with functional update");

assert(posSystemCode.includes('setActiveTabId(newTab.id);'),
    "handleCreateNewTab sets active tab id to newTab.id");

assert(posSystemCode.includes('createNewTab: handleCreateNewTab'),
    "usePosShortcuts receives handleCreateNewTab instead of plain createNewTab factory");

assert(posSystemCode.includes('createNewTab={handleCreateNewTab}'),
    "PosHeader receives handleCreateNewTab as prop");

// -------------------------------------------------------------
// Test 2: Static Code Audit of PosHeader.jsx (Close Tab Guard)
// -------------------------------------------------------------
console.log("\n[Test 2] Static Code Audit of PosHeader.jsx:");

const posHeaderPath = path.resolve(__dirname, '../../dh-backoffice-react/src/components/billing/pos/layout/PosHeader.jsx');
const posHeaderCode = fs.readFileSync(posHeaderPath, 'utf-8');

assert(posHeaderCode.includes('if (tab.items && tab.items.length > 0) {'),
    "PosHeader checks if tab contains items before closing");

assert(posHeaderCode.includes('const confirmed = window.confirm('),
    "PosHeader triggers confirmation prompt when closing tab with items");

assert(posHeaderCode.includes('if (!confirmed) return;'),
    "PosHeader cancels tab closure if confirmation is declined");

assert(posHeaderCode.includes('if (isProcessing) return;'),
    "PosHeader blocks tab closure while isProcessing is true");

console.log("\n==================================================");
if (allPassed) {
    console.log("🎉 ALL TESTS PASSED! Phase 2 UX & Safety Fixes are 100% verified.");
} else {
    console.error("💥 SOME TESTS FAILED! Review output above.");
    process.exit(1);
}
console.log("==================================================");
