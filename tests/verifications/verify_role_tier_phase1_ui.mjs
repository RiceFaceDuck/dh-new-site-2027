import fs from 'fs';
import path from 'path';
import assert from 'assert';

const pagePath = path.resolve('dh-backoffice-react/src/pages/managers/RoleTierSettings/RoleTierSettingsPage.jsx');
const hookPath = path.resolve('dh-backoffice-react/src/pages/managers/RoleTierSettings/hooks/useRoleTierSettingsState.js');

console.log('🧪 [VERIFICATION] Starting Phase 1 UI & UTF-8 Verification...');

// 1. Verify files exist
assert(fs.existsSync(pagePath), 'RoleTierSettingsPage.jsx must exist');
assert(fs.existsSync(hookPath), 'useRoleTierSettingsState.js must exist');

const pageContent = fs.readFileSync(pagePath, 'utf-8');
const hookContent = fs.readFileSync(hookPath, 'utf-8');

// 2. Check for Mojibake / TIS-620 corrupted characters
const mojibakePatterns = [
  /เธ/, /เน\x8/, /เน€เธ/, /เธฃ/, /เธฅ/, /เธŠ/, /เธ„/, /๐Ÿ/, /โญ/
];

for (const pattern of mojibakePatterns) {
  assert(!pattern.test(pageContent), `RoleTierSettingsPage.jsx must NOT contain mojibake pattern: ${pattern}`);
  assert(!pattern.test(hookContent), `useRoleTierSettingsState.js must NOT contain mojibake pattern: ${pattern}`);
}
console.log('✅ PASS: Zero Mojibake detected across RoleTierSettings files.');

// 3. Verify clean Thai UTF-8 keywords are present
const expectedThaiStrings = [
  'ระบบจัดลำดับขั้นและสิทธิ์ลูกค้า (Role & Tier Management)',
  'ลำดับชั้นสิทธิ์และประเภทลูกค้า (Customer Roles & Hierarchy)',
  'ระดับแต้มสะสม Gamification (Tiers & Multipliers)',
  'คู่มือการใช้งาน (Guide)',
  'บันทึกการตั้งค่า Role/Tier',
  'ราคาปลีก (Retail)',
  'ราคาส่ง (Wholesale)'
];

for (const str of expectedThaiStrings) {
  assert(pageContent.includes(str), `RoleTierSettingsPage.jsx must include clean Thai string: "${str}"`);
}
console.log('✅ PASS: Clean Thai UTF-8 strings verified.');

// 4. Verify useRoleTierSettingsState hook usage
assert(pageContent.includes("import { useRoleTierSettingsState, DEFAULT_ROLE_TIER_SETTINGS } from './hooks/useRoleTierSettingsState';"),
  'RoleTierSettingsPage.jsx must import useRoleTierSettingsState from hooks');
assert(pageContent.includes('const { settings, loading, saveSettings } = useRoleTierSettingsState();'),
  'RoleTierSettingsPage.jsx must call useRoleTierSettingsState');
assert(!pageContent.includes('function useRoleTierSettings()'),
  'RoleTierSettingsPage.jsx must not have duplicate local useRoleTierSettings hook');
console.log('✅ PASS: Hook integration verified (SRP compliance).');

// 5. Verify Guide Modal presence
assert(pageContent.includes('function RoleTierGuideModal'),
  'RoleTierSettingsPage.jsx must define RoleTierGuideModal component');
assert(pageContent.includes('<RoleTierGuideModal'),
  'RoleTierSettingsPage.jsx must render <RoleTierGuideModal');
assert(pageContent.includes('isGuideOpen'),
  'RoleTierSettingsPage.jsx must bind isGuideOpen state');
console.log('✅ PASS: RoleTierGuideModal is properly implemented and rendered.');

console.log('\n🎉 ALL PHASE 1 CHECKS PASSED CLEANLY! (100% Verified)');
process.exit(0);
