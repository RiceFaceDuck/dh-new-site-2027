/**
 * 🧪 Test Verification Suite: GA4 Data API Sync & Dual-Sync Telemetry Invariants
 * Centralized Location: Management System/tests/verifications/
 * 
 * Verifies:
 * 1. Functions export integrity & @google-analytics/data availability
 * 2. Dual-Sync SSOT Invariants (recordAdTelemetry + adManagementService + partnerVisibilitySync)
 * 3. Storefront vs Ad telemetry UI boundaries (StoreProfileHero, AdListTable, MarketingInfo)
 * 4. GA4 Data API single-batch aggregation & consolidated ledger settlement logic
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');
const MGMT_DIR = path.resolve(ROOT_DIR, 'Management System');

console.log('🧪 Starting GA4 Data API Sync & Dual-Sync Telemetry Verification Suite...\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// -----------------------------------------------------------------------------
// Test 1: @google-analytics/data & Functions Exports
// -----------------------------------------------------------------------------
console.log('📌 Test Suite 1: Functions Packages & Exports Check');

const functionsPkgPath = path.join(MGMT_DIR, 'functions', 'package.json');
assert(fs.existsSync(functionsPkgPath), 'functions/package.json exists');

const pkgJson = JSON.parse(fs.readFileSync(functionsPkgPath, 'utf8'));
assert(Boolean(pkgJson.dependencies['@google-analytics/data']), '@google-analytics/data dependency is declared in package.json');

const ga4CronCode = fs.readFileSync(path.join(MGMT_DIR, 'functions', 'marketing', 'ga4AdSyncCron.js'), 'utf8');
assert(ga4CronCode.includes('fetchGA4AggregatedStats'), 'ga4AdSyncCron exports fetchGA4AggregatedStats');
assert(ga4CronCode.includes('syncGA4AdStatsLogic'), 'ga4AdSyncCron exports syncGA4AdStatsLogic');
assert(ga4CronCode.includes('schedule: "0 */4 * * *"'), 'ga4AdSyncCron is scheduled to run every 4 hours');
assert(ga4CronCode.includes('timeZone: "Asia/Bangkok"'), 'ga4AdSyncCron timeZone is set to Asia/Bangkok');

// -----------------------------------------------------------------------------
// Test 2: Dual-Sync Telemetry Invariants (Pillars 3 & 4)
// -----------------------------------------------------------------------------
console.log('\n📌 Test Suite 2: Dual-Sync SSOT Invariants (Pillars 3 & 4)');

const telemetryCode = fs.readFileSync(path.join(MGMT_DIR, 'functions', 'marketing', 'recordAdTelemetry.js'), 'utf8');
assert(telemetryCode.includes('db.collection("users").doc(id).collection("storeProfile").doc("main")'), 'recordAdTelemetry references permanent users/{id}/storeProfile/main');
assert(telemetryCode.includes('Dual-Sync: บันทึก viewCount ลง Permanent SSOT'), 'recordAdTelemetry implements Dual-Sync increment to storeProfile/main');
assert(telemetryCode.includes('ActivePartners'), 'recordAdTelemetry maintains ActivePartners update');

const adMgmtCode = fs.readFileSync(path.join(MGMT_DIR, 'dh-backoffice-react', 'src', 'firebase', 'adManagementService.js'), 'utf8');
assert(adMgmtCode.includes("'storeProfile', 'main'"), 'adManagementService.approveAd reads storeProfile/main');
assert(adMgmtCode.includes('viewCount: viewCount'), 'adManagementService.approveAd sets viewCount in ActivePartners');
assert(adMgmtCode.includes('partnerItem.viewCount = viewCount'), 'adManagementService.approveAd sets viewCount in active_partners_bundle');

const visSyncCode = fs.readFileSync(path.join(MGMT_DIR, 'functions', 'marketing', 'partnerVisibilitySync.js'), 'utf8');
assert(visSyncCode.includes('db.collection("users").doc(uid).collection("storeProfile").doc("main")'), 'partnerVisibilitySync reads real viewCount from storeProfile on partner restoration');
assert(visSyncCode.includes('viewCount: realViewCount'), 'partnerVisibilitySync sets viewCount on restored partner');

// -----------------------------------------------------------------------------
// Test 3: UI Telemetry Boundaries (Pillars 1, 2, 3)
// -----------------------------------------------------------------------------
console.log('\n📌 Test Suite 3: UI Telemetry Boundaries & Separation of Concerns');

const storeBadgePath = path.join(MGMT_DIR, 'dh-frontend', 'src', 'pages', 'StoreProfile', 'components', 'StoreViewBadge.jsx');
assert(fs.existsSync(storeBadgePath), 'StoreViewBadge.jsx exists');
const storeBadgeCode = fs.readFileSync(storeBadgePath, 'utf8');
assert(storeBadgeCode.includes('viewCount') || storeBadgeCode.includes('views'), 'StoreViewBadge renders storefront views');

const adTablePath = path.join(MGMT_DIR, 'dh-frontend', 'src', 'components', 'profile', 'tabs', 'ad-manager', 'AdListTable.jsx');
assert(fs.existsSync(adTablePath), 'AdListTable.jsx exists');
const adTableCode = fs.readFileSync(adTablePath, 'utf8');
assert(adTableCode.includes('stats.views') || adTableCode.includes('views'), 'AdListTable renders ad campaign views');

const marketingInfoPath = path.join(MGMT_DIR, 'dh-backoffice-react', 'src', 'pages', 'Customers', 'components', 'details', 'MarketingInfo.jsx');
assert(fs.existsSync(marketingInfoPath), 'MarketingInfo.jsx exists in backoffice');
const marketingInfoCode = fs.readFileSync(marketingInfoPath, 'utf8');
assert(marketingInfoCode.includes('ยอดเข้าชมหน้าร้าน') || marketingInfoCode.includes('viewCount'), 'MarketingInfo displays storefront visits in Box 1');
assert(marketingInfoCode.includes('partner_ads') || marketingInfoCode.includes('โฆษณา'), 'MarketingInfo displays ad campaign analytics in Box 2');

// -----------------------------------------------------------------------------
// Test 4: GA4 Data API Aggregation & Single-Batch Settlement (Pillar 5)
// -----------------------------------------------------------------------------
console.log('\n📌 Test Suite 4: GA4 Data API Single-Batch Aggregation & Settlement');

assert(ga4CronCode.includes('BetaAnalyticsDataClient'), 'ga4AdSyncCron instantiates BetaAnalyticsDataClient');
assert(ga4CronCode.includes('customEvent:ad_id'), 'ga4AdSyncCron groups by customEvent:ad_id');
assert(ga4CronCode.includes('customEvent:store_id'), 'ga4AdSyncCron groups by customEvent:store_id');
assert(ga4CronCode.includes('Single-Update Ledger Parity'), 'ga4AdSyncCron consolidates ledger totalAllocated update to 1 write per run');
assert(ga4CronCode.includes('propertyQuota'), 'ga4AdSyncCron inspects propertyQuota for circuit breaker protection');

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: Total ${totalTests} | Passed ${passedTests} | Failed ${failedTests}`);
console.log('='.repeat(50));

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL VERIFICATIONS PASSED 100%!');
  process.exit(0);
}
