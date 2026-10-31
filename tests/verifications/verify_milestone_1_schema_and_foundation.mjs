/**
 * 🧪 Test Suite: Milestone 1 Verification (Schema Normalization & Foundation Fixes)
 * Centralized Path: Management System/tests/verifications/verify_milestone_1_schema_and_foundation.mjs
 * 
 * Verifies:
 * 1. nightlyChunkGuard.js: viewsCount extraction accepts p.viewCount || p.viewsCount || p.visitCount || 0
 * 2. partnerVisibilitySync.js: toBundleItem viewsCount extraction accepts p.viewCount || p.viewsCount || p.visitCount || 0
 * 3. adManagementService.js: preserve existing views in active_partners_bundle
 * 4. PartnerAds.jsx: guest permission bug fixed (no forbidden users/{partnerId} getDoc), public active status verified
 * 5. sync_traffic_to_firestore.mjs: CWD-independent path resolution, timeout guard, and top-level .catch()
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

console.log('==================================================================');
console.log('🚀 RUNNING VERIFICATION: MILESTONE 1 SCHEMA & FOUNDATION FIXES');
console.log('==================================================================');

// ------------------------------------------------------------------
// Test 1: nightlyChunkGuard.js viewsCount Schema Normalization
// ------------------------------------------------------------------
const nightlyChunkGuardPath = path.resolve(projectRoot, 'Management System/functions/inventory/nightlyChunkGuard.js');
assert(fs.existsSync(nightlyChunkGuardPath), '❌ nightlyChunkGuard.js does not exist');
const nightlyContent = fs.readFileSync(nightlyChunkGuardPath, 'utf8');
assert(
  nightlyContent.includes('viewsCount: Number(p.viewCount || p.viewsCount || p.visitCount || 0)'),
  '❌ nightlyChunkGuard.js must support p.viewCount in viewsCount extraction'
);
console.log('✅ [PASS] Test 1: nightlyChunkGuard.js normalizes viewsCount to accept p.viewCount');

// ------------------------------------------------------------------
// Test 2: partnerVisibilitySync.js viewsCount Schema Normalization
// ------------------------------------------------------------------
const partnerVisibilityPath = path.resolve(projectRoot, 'Management System/functions/marketing/partnerVisibilitySync.js');
assert(fs.existsSync(partnerVisibilityPath), '❌ partnerVisibilitySync.js does not exist');
const visibilityContent = fs.readFileSync(partnerVisibilityPath, 'utf8');
assert(
  visibilityContent.includes('viewsCount: Number(p.viewCount || p.viewsCount || p.visitCount || 0)'),
  '❌ partnerVisibilitySync.js toBundleItem must support p.viewCount in viewsCount extraction'
);
console.log('✅ [PASS] Test 2: partnerVisibilitySync.js toBundleItem normalizes viewsCount to accept p.viewCount');

// ------------------------------------------------------------------
// Test 3: adManagementService.js Views Count Preservation
// ------------------------------------------------------------------
const adServicePath = path.resolve(projectRoot, 'Management System/dh-backoffice-react/src/firebase/adManagementService.js');
assert(fs.existsSync(adServicePath), '❌ adManagementService.js does not exist');
const adServiceContent = fs.readFileSync(adServicePath, 'utf8');
assert(
  adServiceContent.includes('viewsCount: Number(adData?.stats?.views || adData?.viewsCount || 0)'),
  '❌ adManagementService.js must preserve adData viewsCount instead of hardcoding 0'
);
console.log('✅ [PASS] Test 3: adManagementService.js preserves existing viewsCount when approving ad');

// ------------------------------------------------------------------
// Test 4: PartnerAds.jsx Guest Security Rules Bug Fix
// ------------------------------------------------------------------
const partnerAdsPath = path.resolve(projectRoot, 'Management System/dh-frontend/src/pages/StoreProfile/components/PartnerAds.jsx');
assert(fs.existsSync(partnerAdsPath), '❌ PartnerAds.jsx does not exist');
const partnerAdsContent = fs.readFileSync(partnerAdsPath, 'utf8');
assert(
  !partnerAdsContent.includes("getCollectionPath('users'), partnerId"),
  '❌ PartnerAds.jsx must not query private users/{partnerId} collection'
);
assert(
  partnerAdsContent.includes('ActivePartners'),
  '❌ PartnerAds.jsx must check public ActivePartners collection for status'
);
assert(
  partnerAdsContent.includes('const allAds = await getUserPartnerAds(partnerId)'),
  '❌ PartnerAds.jsx must call getUserPartnerAds'
);
console.log('✅ [PASS] Test 4: PartnerAds.jsx eliminates forbidden users query and uses public ActivePartners guard');

// ------------------------------------------------------------------
// Test 5: sync_traffic_to_firestore.mjs Hardening (CWD, Timeout, Catch)
// ------------------------------------------------------------------
const syncScriptPath = path.resolve(projectRoot, 'analytics/sync_traffic_to_firestore.mjs');
assert(fs.existsSync(syncScriptPath), '❌ sync_traffic_to_firestore.mjs does not exist');
const syncScriptContent = fs.readFileSync(syncScriptPath, 'utf8');
assert(
  syncScriptContent.includes('path.resolve(__dirname, rawCredPath)'),
  '❌ sync_traffic_to_firestore.mjs must resolve credentials relative to __dirname'
);
assert(
  syncScriptContent.includes('timeoutMs = 10000') || syncScriptContent.includes('timeoutPromise'),
  '❌ sync_traffic_to_firestore.mjs must contain a timeout guard for client.runReport'
);
assert(
  syncScriptContent.includes('main().catch('),
  '❌ sync_traffic_to_firestore.mjs must wrap main() with .catch()'
);
console.log('✅ [PASS] Test 5: sync_traffic_to_firestore.mjs has CWD-safe paths, timeout guard, and top-level .catch()');

console.log('==================================================================');
console.log('🎯 ALL 5/5 MILESTONE 1 VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('==================================================================');
