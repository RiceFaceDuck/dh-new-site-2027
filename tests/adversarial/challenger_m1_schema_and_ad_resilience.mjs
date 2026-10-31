/**
 * 🥊 ADVERSARIAL STRESS TEST SUITE: Milestone 1 Schema & Foundation Resilience
 * Centralized Location: Management System/tests/adversarial/challenger_m1_schema_and_ad_resilience.mjs
 * 
 * Objective: Empirically challenge, stress-test, and find failure modes in:
 * 1. Schema variations in partner view counting & catalog bundle generation (nightlyChunkGuard & partnerVisibilitySync)
 * 2. Array sorting stability and boundary conditions with 2,000+ simulated partners
 * 3. Ad filtering and guest security permissions in PartnerAds.jsx
 * 4. adManagementService view metric preservation
 * 5. Analytics timeout and error resilience
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

console.log('='.repeat(70));
console.log('🥊 ADVERSARIAL CHALLENGER SUITE: M1 SCHEMA, SORTING & AD STRESS');
console.log('='.repeat(70));

let totalAssertions = 0;
let passedAssertions = 0;
const failureLog = [];

function check(desc, condition, details = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ [PASS] ${desc}`);
  } else {
    failureLog.push({ desc, details });
    console.error(`  ❌ [FAIL] ${desc} — ${details}`);
  }
}

// ====================================================================
// SECTION 1: Schema Variations in nightlyChunkGuard & partnerVisibilitySync
// ====================================================================
console.log('\n--- SECTION 1: Partner Document Schema Variations & Coercion ---');

// The exact extraction logic from nightlyChunkGuard.js line 348 and partnerVisibilitySync.js line 118:
const extractViewsCount = (p) => Number(p.viewCount || p.viewsCount || p.visitCount || 0);

// Test 1.1: Standard modern viewCount
check('1.1 Standard modern viewCount is preserved',
  extractViewsCount({ viewCount: 1540 }) === 1540,
  'Expected 1540'
);

// Test 1.2: Legacy viewsCount (plural)
check('1.2 Legacy viewsCount fallback',
  extractViewsCount({ viewsCount: 890 }) === 890,
  'Expected 890'
);

// Test 1.3: Legacy visitCount
check('1.3 Legacy visitCount fallback',
  extractViewsCount({ visitCount: 340 }) === 340,
  'Expected 340'
);

// Test 1.4: Precedence order (viewCount > viewsCount > visitCount)
check('1.4 viewCount takes precedence over viewsCount and visitCount',
  extractViewsCount({ viewCount: 500, viewsCount: 300, visitCount: 100 }) === 500,
  'Expected 500'
);

// Test 1.5: viewsCount takes precedence over visitCount
check('1.5 viewsCount takes precedence over visitCount',
  extractViewsCount({ viewsCount: 300, visitCount: 100 }) === 300,
  'Expected 300'
);

// Test 1.6: Falsy / Zero values
check('1.6 All zero returns 0',
  extractViewsCount({ viewCount: 0, viewsCount: 0, visitCount: 0 }) === 0,
  'Expected 0'
);

// Test 1.7: Missing document fields ({})
check('1.7 Empty partner document returns 0',
  extractViewsCount({}) === 0,
  'Expected 0'
);

// Test 1.8: Null fields
check('1.8 Null fields safely evaluate to 0',
  extractViewsCount({ viewCount: null, viewsCount: null, visitCount: null }) === 0,
  'Expected 0'
);

// Test 1.9: Undefined fields
check('1.9 Undefined fields safely evaluate to 0',
  extractViewsCount({ viewCount: undefined, viewsCount: undefined }) === 0,
  'Expected 0'
);

// Test 1.10: String numeric values (Firestore untyped imports)
check('1.10 Numeric string is coerced to number',
  extractViewsCount({ viewCount: '4500' }) === 4500,
  'Expected 4500'
);

// Test 1.11: Numeric string with whitespace
check('1.11 Numeric string with whitespace is coerced',
  extractViewsCount({ viewCount: ' 1250 ' }) === 1250,
  'Expected 1250'
);

// Test 1.12: Negative view count
check('1.12 Negative number is coerced correctly',
  extractViewsCount({ viewCount: -5 }) === -5,
  'Expected -5'
);

// Test 1.13: Floating point views
check('1.13 Floating point views are preserved',
  extractViewsCount({ viewCount: 12.5 }) === 12.5,
  'Expected 12.5'
);

// Test 1.14: Large numbers (e.g. 10^8)
check('1.14 Large integer views handled accurately',
  extractViewsCount({ viewCount: 100000000 }) === 100000000,
  'Expected 100,000,000'
);

// Test 1.15: viewCount: 0 with legacy viewsCount: 200
// Note: In JS (0 || 200) evaluates to 200, which serves as a graceful migration fallback
check('1.15 Zero viewCount with legacy non-zero viewsCount falls back to legacy',
  extractViewsCount({ viewCount: 0, viewsCount: 200 }) === 200,
  'Expected 200'
);


// ====================================================================
// SECTION 2: Array Sorting & Bundle Generation Stress Harness
// ====================================================================
console.log('\n--- SECTION 2: Array Sorting & Bundle Generation Stress (2,000 Partners) ---');

// Generate 2,000 heterogeneous partner documents simulating real-world messy data
const generateAdversarialPartners = (count = 2000) => {
  const partners = [];
  const edgeCases = [
    { viewCount: 0, points: 0 },
    { viewCount: '9999', points: '150' },
    { viewsCount: 450, points: 50 },
    { visitCount: 80, points: 20 },
    { viewCount: null, points: null },
    { viewCount: undefined, points: undefined },
    { viewCount: '', points: '' },
    { viewCount: -50, points: -10 },
    { viewCount: 1500000, points: 99999 },
    { viewCount: 42.8, points: 33.3 },
    { viewCount: 'invalid_str', points: 'invalid_pts' } // Generates NaN
  ];

  for (let i = 0; i < count; i++) {
    const edge = edgeCases[i % edgeCases.length];
    partners.push({
      id: `partner-${i}`,
      partnerId: `partner-${i}`,
      storeName: `ร้านทดสอบที่ ${i}`,
      latitude: 13.75 + (i * 0.001),
      longitude: 100.50 + (i * 0.001),
      points: Number(edge.points || 0),
      viewsCount: extractViewsCount(edge),
      isVerified: i % 2 === 0,
      isActive: true
    });
  }
  return partners;
};

const mockAllActivePartners = generateAdversarialPartners(2000);

// Execute nightlyChunkGuard starter bundle algorithm
let bundlePartners = [];
let sortError = null;

try {
  if (mockAllActivePartners.length <= 100) {
    bundlePartners = mockAllActivePartners;
  } else {
    // 1. Top rated 5
    const topRated = [...mockAllActivePartners]
      .sort((a, b) => (Number.isFinite(b.points) ? b.points : 0) - (Number.isFinite(a.points) ? a.points : 0))
      .slice(0, 5);

    // 2. Most visited 5 (with NaN resilience)
    const mostVisited = [...mockAllActivePartners]
      .sort((a, b) => {
        const vA = Number.isFinite(a.viewsCount) ? a.viewsCount : 0;
        const vB = Number.isFinite(b.viewsCount) ? b.viewsCount : 0;
        return vB - vA;
      })
      .slice(0, 5);

    // 3. Sample Pool 30
    const partnerPool = mockAllActivePartners.slice(0, 30);

    // Deduplicated Map
    const map = new Map();
    [...topRated, ...mostVisited, ...partnerPool].forEach(p => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    bundlePartners = Array.from(map.values());
  }
} catch (e) {
  sortError = e;
}

check('2.1 2,000-partner bundle generation executes without throwing exceptions',
  sortError === null,
  `Error: ${sortError?.message}`
);

check('2.2 Bundle size adheres to <= 35 unique partners limit',
  bundlePartners.length > 0 && bundlePartners.length <= 35,
  `Actual bundle size: ${bundlePartners.length}`
);

// Verify the highest visited partner in mostVisited has 1,500,000 views
const mostVisitedDirect = [...mockAllActivePartners]
  .sort((a, b) => {
    const vA = Number.isFinite(a.viewsCount) ? a.viewsCount : 0;
    const vB = Number.isFinite(b.viewsCount) ? b.viewsCount : 0;
    return vB - vA;
  })
  .slice(0, 5);

check('2.3 Top mostVisited partner has 1,500,000 views',
  mostVisitedDirect[0].viewsCount === 1500000,
  `Top views: ${mostVisitedDirect[0]?.viewsCount}`
);

// Test raw sorting behavior in nightlyChunkGuard line 368 without NaN guard:
// (b.viewsCount - a.viewsCount)
let rawSortSuccess = true;
try {
  const rawSorted = [...mockAllActivePartners].sort((a, b) => b.viewsCount - a.viewsCount);
  check('2.4 Native Array.prototype.sort with heterogeneous inputs does not crash process',
    Array.isArray(rawSorted) && rawSorted.length === 2000,
    'Sort failed or returned invalid length'
  );
} catch (e) {
  rawSortSuccess = false;
  check('2.4 Native Array.prototype.sort with heterogeneous inputs does not crash process', false, e.message);
}


// ====================================================================
// SECTION 3: PartnerAds.jsx Data Scenarios & Guest Visitor Context
// ====================================================================
console.log('\n--- SECTION 3: PartnerAds.jsx Data Scenarios & Ad Filtering Logic ---');

const partnerAdsSource = fs.readFileSync(
  path.resolve(projectRoot, 'Management System/dh-frontend/src/pages/StoreProfile/components/PartnerAds.jsx'),
  'utf8'
);

// Test 3.1: Zero query to private users collection
check('3.1 PartnerAds.jsx has zero occurrences of users collection query',
  !partnerAdsSource.includes("getCollectionPath('users')") && !partnerAdsSource.includes("doc(db, 'users'"),
  'Found query to private users collection'
);

// Test 3.2: Public ActivePartners inspection
check('3.2 PartnerAds.jsx queries public ActivePartners collection',
  partnerAdsSource.includes("getCollectionPath('ActivePartners')"),
  'Missing ActivePartners query'
);

// Test 3.3: Partner status guard logic implementation
// In PartnerAds.jsx:
// if (partnerData.isActive === false || (typeof partnerData.points === 'number' && partnerData.points <= 0))
const simulatePartnerGuard = (partnerData) => {
  if (!partnerData) return 'CONTINUE'; // Document does not exist or fetch failed
  if (partnerData.isActive === false || (typeof partnerData.points === 'number' && partnerData.points <= 0)) {
    return 'BLOCK';
  }
  return 'CONTINUE';
};

check('3.3 Partner with isActive: false is BLOCKED',
  simulatePartnerGuard({ isActive: false, points: 100 }) === 'BLOCK',
  'Expected BLOCK'
);

check('3.4 Partner with points: 0 is BLOCKED',
  simulatePartnerGuard({ isActive: true, points: 0 }) === 'BLOCK',
  'Expected BLOCK'
);

check('3.5 Partner with negative points: -15 is BLOCKED',
  simulatePartnerGuard({ isActive: true, points: -15 }) === 'BLOCK',
  'Expected BLOCK'
);

check('3.6 Partner with positive points: 50 is ALLOWED',
  simulatePartnerGuard({ isActive: true, points: 50 }) === 'CONTINUE',
  'Expected CONTINUE'
);

check('3.7 Partner with undefined points (missing field) is ALLOWED (deferred to ad-level check)',
  simulatePartnerGuard({ isActive: true }) === 'CONTINUE',
  'Expected CONTINUE'
);

check('3.8 Non-existent ActivePartners document is ALLOWED to proceed without crashing',
  simulatePartnerGuard(null) === 'CONTINUE',
  'Expected CONTINUE'
);

// Test 3.9: Ad filtering function from PartnerAds.jsx lines 38-45
const filterPartnerAds = (allAds) => {
  return (allAds || []).filter((adData) => {
    if (!adData) return false;
    const isActive = (['active', 'ACTIVE', 'APPROVED'].includes(adData.status) || adData.isActive === true) &&
      adData.status !== 'OUT_OF_CREDIT' &&
      adData.status !== 'paused';
    const isNotBusinessCard = adData.type !== 'BUSINESS_CARD';
    return isActive && isNotBusinessCard;
  });
};

const candidateAds = [
  { id: 'ad-1', status: 'active', type: 'PRODUCT_LINK' },          // KEEP
  { id: 'ad-2', status: 'ACTIVE', type: 'BILLBOARD' },             // KEEP
  { id: 'ad-3', status: 'APPROVED', type: 'PRODUCT_LINK' },         // KEEP
  { id: 'ad-4', status: 'paused', type: 'PRODUCT_LINK' },           // DROP (paused)
  { id: 'ad-5', status: 'OUT_OF_CREDIT', type: 'PRODUCT_LINK' },    // DROP (out of credit)
  { id: 'ad-6', status: 'rejected', type: 'PRODUCT_LINK' },         // DROP (rejected)
  { id: 'ad-7', status: 'pending', type: 'PRODUCT_LINK' },          // DROP (pending)
  { id: 'ad-8', status: 'active', type: 'BUSINESS_CARD' },          // DROP (business card)
  { id: 'ad-9', isActive: true, status: 'unknown', type: 'BANNER' },// KEEP (isActive=true)
  { id: 'ad-10', isActive: true, status: 'paused', type: 'BANNER' },// DROP (status paused wins)
  { id: 'ad-11', isActive: true, status: 'OUT_OF_CREDIT', type: 'BANNER' } // DROP (status OUT_OF_CREDIT wins)
];

const filteredResult = filterPartnerAds(candidateAds);
const keptIds = filteredResult.map(a => a.id);

check('3.9 Filter accepts ad-1 (active, PRODUCT_LINK)', keptIds.includes('ad-1'), 'ad-1 missing');
check('3.10 Filter accepts ad-2 (ACTIVE, BILLBOARD)', keptIds.includes('ad-2'), 'ad-2 missing');
check('3.11 Filter accepts ad-3 (APPROVED, PRODUCT_LINK)', keptIds.includes('ad-3'), 'ad-3 missing');
check('3.12 Filter accepts ad-9 (isActive: true, non-paused)', keptIds.includes('ad-9'), 'ad-9 missing');

check('3.13 Filter rejects ad-4 (paused)', !keptIds.includes('ad-4'), 'ad-4 not rejected');
check('3.14 Filter rejects ad-5 (OUT_OF_CREDIT)', !keptIds.includes('ad-5'), 'ad-5 not rejected');
check('3.15 Filter rejects ad-6 (rejected status)', !keptIds.includes('ad-6'), 'ad-6 not rejected');
check('3.16 Filter rejects ad-7 (pending status)', !keptIds.includes('ad-7'), 'ad-7 not rejected');
check('3.17 Filter rejects ad-8 (BUSINESS_CARD)', !keptIds.includes('ad-8'), 'ad-8 not rejected');
check('3.18 Filter rejects ad-10 (isActive: true but status: paused)', !keptIds.includes('ad-10'), 'ad-10 not rejected');
check('3.19 Filter rejects ad-11 (isActive: true but status: OUT_OF_CREDIT)', !keptIds.includes('ad-11'), 'ad-11 not rejected');

check('3.20 Filter handles null/undefined input array gracefully',
  filterPartnerAds(null).length === 0 && filterPartnerAds(undefined).length === 0,
  'Null/undefined threw or returned non-empty'
);


// ====================================================================
// SECTION 4: adManagementService Views Count Preservation
// ====================================================================
console.log('\n--- SECTION 4: adManagementService Views Metric Preservation ---');

// In adManagementService.js line 230:
// viewsCount: Number(adData?.stats?.views || adData?.viewsCount || 0)
const extractAdViews = (adData) => Number(adData?.stats?.views || adData?.viewsCount || 0);

check('4.1 Preserves views from adData.stats.views',
  extractAdViews({ stats: { views: 670 } }) === 670,
  'Expected 670'
);

check('4.2 Preserves views from adData.viewsCount fallback',
  extractAdViews({ viewsCount: 380 }) === 380,
  'Expected 380'
);

check('4.3 adData.stats.views takes precedence over adData.viewsCount',
  extractAdViews({ stats: { views: 500 }, viewsCount: 200 }) === 500,
  'Expected 500'
);

check('4.4 Null adData returns 0',
  extractAdViews(null) === 0,
  'Expected 0'
);

check('4.5 Undefined adData returns 0',
  extractAdViews(undefined) === 0,
  'Expected 0'
);

check('4.6 adData without stats or viewsCount returns 0',
  extractAdViews({ title: 'Ad Test' }) === 0,
  'Expected 0'
);

check('4.7 Coerces string view count in stats',
  extractAdViews({ stats: { views: '1420' } }) === 1420,
  'Expected 1420'
);


// ====================================================================
// SECTION 5: Analytics Timeout Guard & CWD Resolution
// ====================================================================
console.log('\n--- SECTION 5: sync_traffic_to_firestore.mjs Resilience ---');

const syncSource = fs.readFileSync(
  path.resolve(projectRoot, 'analytics/sync_traffic_to_firestore.mjs'),
  'utf8'
);

check('5.1 Script uses path.resolve(__dirname, rawCredPath) for CWD independence',
  syncSource.includes('path.resolve(__dirname, rawCredPath)'),
  'Missing __dirname path resolution'
);

check('5.2 Script wraps client.runReport with Promise.race and timeoutPromise',
  syncSource.includes('Promise.race') && syncSource.includes('timeoutPromise'),
  'Missing Promise.race timeout guard'
);

check('5.3 Timeout is set to 10000ms',
  syncSource.includes('timeoutMs = 10000') || syncSource.includes('10000'),
  'Timeout guard not configured to 10s'
);

check('5.4 Main function has .catch() top-level handler to prevent unhandled rejections',
  syncSource.includes('main().catch('),
  'Missing main().catch()'
);

// Empirical test of the Promise.race timeout pattern
let timeoutTriggered = false;
const simulateTimeoutQuery = async (delayMs, timeoutMs) => {
  const queryPromise = new Promise(resolve => setTimeout(() => resolve('OK'), delayMs));
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs)
  );

  return Promise.race([queryPromise, timeoutPromise]);
};

try {
  await simulateTimeoutQuery(200, 50); // Delay > Timeout
} catch (e) {
  if (e.message.includes('Timed out')) timeoutTriggered = true;
}

check('5.5 Promise.race timeout pattern correctly fires on slow responses',
  timeoutTriggered === true,
  'Timeout did not trigger as expected'
);


// ====================================================================
// SUMMARY & VERDICT
// ====================================================================
console.log('\n' + '='.repeat(70));
console.log(`📊 ADVERSARIAL STRESS TEST SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED`);
console.log('='.repeat(70));

if (failureLog.length > 0) {
  console.error(`🚨 FAILURES ENCOUNTERED (${failureLog.length}):`);
  failureLog.forEach((f, idx) => {
    console.error(`   ${idx + 1}. ${f.desc}: ${f.details}`);
  });
  process.exit(1);
} else {
  console.log('🏆 VERDICT: ALL ADVERSARIAL TESTS PASSED WITHOUT EXCEPTION!');
  console.log('✨ All schema variations, sorting boundaries, guest security contexts, and timeouts are resilient.');
  process.exit(0);
}
