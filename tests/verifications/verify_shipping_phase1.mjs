import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');

console.log('========================================================================');
console.log('  VERIFICATION: Shipping Rules Phase 1 Integrity & Quota Fixes');
console.log('========================================================================\n');

// 1. Verify shippingService.js filters out deletedAt
const shippingServicePath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/firebase/shippingService.js');
assert(fs.existsSync(shippingServicePath), 'shippingService.js exists');
const shippingServiceCode = fs.readFileSync(shippingServicePath, 'utf8');

assert(
  shippingServiceCode.includes('.filter(r => !r.deletedAt)'),
  'shippingService.js must filter out soft-deleted rules with deletedAt'
);
console.log('  [PASS] shippingService.js: filters out soft-deleted rules with !r.deletedAt');

// 2. Verify storefrontSettingsService.js filters out deletedAt
const storefrontServicePath = path.resolve(REPO_ROOT, 'dh-frontend/src/firebase/storefrontSettingsService.js');
assert(fs.existsSync(storefrontServicePath), 'storefrontSettingsService.js exists');
const storefrontServiceCode = fs.readFileSync(storefrontServicePath, 'utf8');

assert(
  storefrontServiceCode.includes('.filter(r => !r.deletedAt)'),
  'storefrontSettingsService.js must filter out soft-deleted rules with deletedAt'
);
console.log('  [PASS] storefrontSettingsService.js: filters out soft-deleted rules with !r.deletedAt');

// 3. Verify PosSystem.jsx caching accepts empty array []
const posSystemPath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/components/billing/PosSystem.jsx');
assert(fs.existsSync(posSystemPath), 'PosSystem.jsx exists');
const posSystemCode = fs.readFileSync(posSystemPath, 'utf8');

assert(
  posSystemCode.includes('if (Array.isArray(parsed)) {'),
  'PosSystem.jsx must accept empty array [] in sessionStorage without requiring length > 0'
);
assert(
  !posSystemCode.includes('if (Array.isArray(parsed) && parsed.length > 0)'),
  'PosSystem.jsx must not reject empty array [] with parsed.length > 0'
);
console.log('  [PASS] PosSystem.jsx: accepts empty array [] without quota-leaking cache misses');

console.log('\n========================================================================');
console.log('  PHASE 1 VERIFICATION: ALL CHECKS PASSED (3/3)');
console.log('========================================================================');
