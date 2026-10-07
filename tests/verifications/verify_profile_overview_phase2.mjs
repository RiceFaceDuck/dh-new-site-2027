import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('🚀 Running Verification Test: Profile Overview Phase 2 (Timestamp Schema & SupportSettings SSOT)');

// 1. Verify PersonalInfoForm uses serverTimestamp
const personalInfoPath = path.resolve('dh-frontend/src/components/profile/forms/PersonalInfoForm.jsx');
assert(fs.existsSync(personalInfoPath), 'PersonalInfoForm.jsx exists');
const personalInfoSrc = fs.readFileSync(personalInfoPath, 'utf8');

assert(personalInfoSrc.includes('import { getFirestore, doc, setDoc, serverTimestamp }'), 'Imports serverTimestamp');
assert(personalInfoSrc.includes('updatedAt: serverTimestamp()'), 'Uses updatedAt: serverTimestamp()');
assert(!personalInfoSrc.includes('updatedAt: new Date()'), 'No client Date in updatedAt');
console.log('✅ 1. PersonalInfoForm timestamp schema verified');

// 2. Verify SocialLinksForm uses serverTimestamp
const socialLinksPath = path.resolve('dh-frontend/src/components/profile/forms/SocialLinksForm.jsx');
assert(fs.existsSync(socialLinksPath), 'SocialLinksForm.jsx exists');
const socialLinksSrc = fs.readFileSync(socialLinksPath, 'utf8');

assert(socialLinksSrc.includes('serverTimestamp'), 'SocialLinksForm imports serverTimestamp');
assert(socialLinksSrc.includes('updatedAt: serverTimestamp()'), 'SocialLinksForm uses updatedAt: serverTimestamp()');
assert(!socialLinksSrc.includes('lastUpdated: new Date().toISOString()'), 'Removed legacy string lastUpdated');
console.log('✅ 2. SocialLinksForm timestamp schema verified');

// 3. Verify SupportSettings points to SSOT and removed dead isSupportEnabled write
const supportSettingsPath = path.resolve('dh-frontend/src/components/profile/forms/SupportSettings.jsx');
assert(fs.existsSync(supportSettingsPath), 'SupportSettings.jsx exists');
const supportSettingsSrc = fs.readFileSync(supportSettingsPath, 'utf8');

assert(supportSettingsSrc.includes("navigate('/profile?tab=ads')"), 'Navigates to Ads & Marketing tab (SSOT)');
assert(!supportSettingsSrc.includes('isSupportEnabled: newValue'), 'Removed phantom isSupportEnabled write');
console.log('✅ 3. SupportSettings SSOT linking verified');

console.log('🎉 ALL PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY!');
