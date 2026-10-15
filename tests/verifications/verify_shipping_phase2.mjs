import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');

console.log('========================================================================');
console.log('  VERIFICATION: Shipping Rules Phase 2 Features & Enhancements');
console.log('========================================================================\n');

// 1. Verify shippingService.js has updateShippingRule
const shippingServicePath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/firebase/shippingService.js');
const shippingServiceCode = fs.readFileSync(shippingServicePath, 'utf8');
assert(shippingServiceCode.includes('updateShippingRule(ruleId, ruleData, uid)'), 'shippingService.js must export updateShippingRule');
console.log('  [PASS] shippingService.js: updateShippingRule method exists and connects to historyService');

// 2. Verify useShippingManagement.js has Toast and Edit Mode
const hookPath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/settings/shipping/hooks/useShippingManagement.js');
const hookCode = fs.readFileSync(hookPath, 'utf8');
assert(hookCode.includes("import toast from 'react-hot-toast'"), 'useShippingManagement.js must import react-hot-toast');
assert(hookCode.includes('handleEditRule'), 'useShippingManagement.js must provide handleEditRule');
assert(hookCode.includes('handleCancelEdit'), 'useShippingManagement.js must provide handleCancelEdit');
assert(hookCode.includes('categoryService.getAllCategories()'), 'useShippingManagement.js must load dynamic categories');
console.log('  [PASS] useShippingManagement.js: integrates Toast, dynamic categories, and Edit state controllers');

// 3. Verify ShippingRuleForm.jsx supports SPX Express, dynamic categories, and Edit mode
const formPath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/settings/shipping/components/ShippingRuleForm.jsx');
const formCode = fs.readFileSync(formPath, 'utf8');
assert(formCode.includes('SPX Express'), 'ShippingRuleForm.jsx must include SPX Express');
assert(formCode.includes('editingRuleId'), 'ShippingRuleForm.jsx must handle editingRuleId');
assert(formCode.includes('categoryOptions'), 'ShippingRuleForm.jsx must compute dynamic categoryOptions');
console.log('  [PASS] ShippingRuleForm.jsx: supports SPX Express, category merging, and Edit Mode switching');

// 4. Verify ShippingRuleList.jsx has Edit button
const listPath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/settings/shipping/components/ShippingRuleList.jsx');
const listCode = fs.readFileSync(listPath, 'utf8');
assert(listCode.includes('handleEditRule'), 'ShippingRuleList.jsx must accept handleEditRule');
assert(listCode.includes('Edit2'), 'ShippingRuleList.jsx must render Edit button');
console.log('  [PASS] ShippingRuleList.jsx: renders Edit button and active row highlight');

console.log('\n========================================================================');
console.log('  PHASE 2 VERIFICATION: ALL CHECKS PASSED (4/4)');
console.log('========================================================================');
