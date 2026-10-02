/**
 * 🛡️ Challenger Warranty Rules & Mathematical Integrity Adversarial Stress Suite
 * 
 * Centralized Test Hub: Management System/tests/adversarial/
 * Target: Warranty Rules Management across dh-shared and dh-backoffice-react
 * 
 * Vectors Tested:
 * 1. Calendar, Leap Year (Feb 29), Month-End, and Timezone Boundary Stress Tests
 * 2. Extreme / Malformed / Hostile Input Fuzzing (null, undefined, NaN, negatives, zero-division guards)
 * 3. Hierarchy Precedence (SKU Override > Category > SKU Prefix > Substring > Default General)
 * 4. Expiration & Status Lifecycle State Verification (Active, Last Day [0 days], Expired, Clamped Percentages)
 * 5. Batch Operations, Deduplication, & Quota Guard (Synonyms deduplication, batch array sanitization)
 * 6. Consumer Wiring & Architectural Contract Audit (useWarrantyManager, categoryService, ProductInfo, WarrantyCheckModal)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { 
  normalizeCategoryName, 
  resolveCategoryFromSku, 
  calculateItemWarranty, 
  DEFAULT_WARRANTY_DAYS 
} from '../../dh-shared/src/utils/warrantyUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

console.log('================================================================================');
console.log('🔥 CHALLENGER: WARRANTY RULES ADVERSARIAL STRESS & EMPIRICAL INTEGRITY HARNESS');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const defects = [];

function assert(condition, name, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${name}`);
  } else {
    failedChecks++;
    const msg = details ? `${name} -> ${details}` : name;
    console.error(`  ❌ [FAIL] ${msg}`);
    defects.push({ test: name, details });
  }
}

const mockStandardConfig = {
  categories: {
    'Panel': { claimDays: 180, returnDays: 7 },
    'Keyboard': { claimDays: 90, returnDays: 7 },
    'Battery': { claimDays: 180, returnDays: 7 },
    'Adapter': { claimDays: 180, returnDays: 7 },
    'Speaker': { claimDays: 7, returnDays: 7 },
    'Fan': { claimDays: 90, returnDays: 7 },
    'General': { claimDays: 30, returnDays: 7 }
  },
  skus: {
    'SKU-VIP-1YR': { claimDays: 365, returnDays: 14 },
    'SKU-EXTENDED-2YR': { claimDays: 730, returnDays: 30 },
    'SKU-NO-WARRANTY': { claimDays: 0, returnDays: 0 }
  }
};

// =============================================================================
// VECTOR 1: Calendar, Leap Year, Month-End, and Timezone Boundary Stress Tests
// =============================================================================
console.log('\n--- 1. Testing Calendar, Leap Year, Month-End, and Timezone Boundaries ---');

// 1.1 Leap Year Day Purchase (2024-02-29)
{
  const item = { category: 'Panel', sku: 'PN-LEAP' };
  const leapOrderDate = new Date('2024-02-29T10:00:00Z');
  const refNextDay = new Date('2024-03-01T15:00:00Z');
  const res = calculateItemWarranty(item, leapOrderDate, mockStandardConfig, refNextDay);
  
  assert(res !== null && res.passedDays === 1,
    'Leap Year: Feb 29 to Mar 1 correctly yields passedDays = 1',
    `Expected passedDays 1, got ${res?.passedDays}`);
  
  // Leap Year + 366 days
  const refYearLater = new Date('2025-02-28T10:00:00Z');
  const resYearLater = calculateItemWarranty(item, leapOrderDate, mockStandardConfig, refYearLater);
  assert(resYearLater.passedDays === 365,
    'Leap Year: Feb 29 2024 to Feb 28 2025 yields passedDays = 365',
    `Expected passedDays 365, got ${resYearLater?.passedDays}`);
}

// 1.2 Month-End Rollover: Jan 31 + 30 Days
{
  const item = { category: 'General', sku: 'GEN-01' };
  const jan31 = new Date('2025-01-31T08:00:00Z');
  const res = calculateItemWarranty(item, jan31, mockStandardConfig, jan31);
  const expiry = res.expiryDate;
  
  // Jan 31 + 30 days in 2025 (non-leap year, Feb has 28 days) -> March 2, 2025
  assert(expiry.getFullYear() === 2025 && expiry.getMonth() === 2 && expiry.getDate() === 2,
    'Month-End Rollover: Jan 31 + 30 days accurately rolls into March 2 in non-leap year',
    `Expected 2025-03-02, got ${expiry.toISOString().slice(0, 10)}`);
}

// 1.3 Same-Day Midnight Boundary (23:59:59 to 00:01:00 next day)
{
  const item = { category: 'Panel', sku: 'PN-01' };
  const lateNight = new Date('2026-10-01T23:59:59');
  const earlyMorningSameDay = new Date('2026-10-01T00:01:00');
  const earlyMorningNextDay = new Date('2026-10-02T00:01:00');

  const resSameDay = calculateItemWarranty(item, lateNight, mockStandardConfig, earlyMorningSameDay);
  assert(resSameDay.passedDays === 0,
    'Same-Day Calendar Normalization: late night to early morning same day yields passedDays = 0',
    `Expected 0, got ${resSameDay.passedDays}`);

  const resNextDay = calculateItemWarranty(item, lateNight, mockStandardConfig, earlyMorningNextDay);
  assert(resNextDay.passedDays === 1,
    'Calendar Day Shift: 23:59:59 to 00:01:00 next day yields passedDays = 1',
    `Expected 1, got ${resNextDay.passedDays}`);
}

// 1.4 Future Date Guard (Reference date before purchase date)
{
  const item = { category: 'Battery', sku: 'BT-01' };
  const purchaseDate = new Date('2026-10-10T12:00:00Z');
  const refDatePast = new Date('2026-10-01T12:00:00Z');
  const res = calculateItemWarranty(item, purchaseDate, mockStandardConfig, refDatePast);
  
  assert(res.passedDays === 0 && res.remainingDays === 180 && !res.isExpired,
    'Future Date Guard: If referenceDate is before orderDate, passedDays is clamped to 0',
    `Expected passedDays 0, got ${res.passedDays}`);
}

// 1.5 Diverse Date Formats: ISO string, millis number, Firestore Timestamp mock
{
  const item = { category: 'Keyboard', sku: 'KB-01' };
  const refDate = new Date('2026-10-02T12:00:00Z');

  // ISO string
  const resIso = calculateItemWarranty(item, '2026-09-02T12:00:00Z', mockStandardConfig, refDate);
  // Timestamp milliseconds
  const resMillis = calculateItemWarranty(item, new Date('2026-09-02T12:00:00Z').getTime(), mockStandardConfig, refDate);
  // Firestore Timestamp with .toDate()
  const resFirestore = calculateItemWarranty(item, { toDate: () => new Date('2026-09-02T12:00:00Z') }, mockStandardConfig, refDate);

  assert(resIso !== null && resMillis !== null && resFirestore !== null,
    'Format Polymorphism: Accepts ISO String, Numeric Millis, and Firestore Timestamp object',
    `ISO: ${!!resIso}, Millis: ${!!resMillis}, Firestore: ${!!resFirestore}`);
  assert(resIso.passedDays === resMillis.passedDays && resMillis.passedDays === resFirestore.passedDays,
    'Format Parity: All 3 date representations yield identical passedDays (30)',
    `ISO: ${resIso?.passedDays}, Millis: ${resMillis?.passedDays}, Firestore: ${resFirestore?.passedDays}`);
}


// =============================================================================
// VECTOR 2: Extreme / Malformed / Hostile Input Fuzzing
// =============================================================================
console.log('\n--- 2. Testing Extreme, Malformed & Hostile Inputs ---');

// 2.1 Nullish, empty, or non-object item
{
  assert(calculateItemWarranty(null, new Date(), mockStandardConfig) === null,
    'Fuzzing: item = null returns null safely');
  assert(calculateItemWarranty(undefined, new Date(), mockStandardConfig) === null,
    'Fuzzing: item = undefined returns null safely');
  assert(calculateItemWarranty('', new Date(), mockStandardConfig) === null,
    'Fuzzing: item = "" (falsy string) returns null safely');
  
  const emptyItemRes = calculateItemWarranty({}, new Date(), mockStandardConfig);
  assert(emptyItemRes !== null && emptyItemRes.categoryKey === 'General',
    'Fuzzing: item = {} falls back to General category safely');
}

// 2.2 Nullish, invalid, NaN, or hostile orderDate
{
  const item = { sku: 'TEST-SKU' };
  assert(calculateItemWarranty(item, null, mockStandardConfig) === null,
    'Fuzzing: orderDate = null returns null safely');
  assert(calculateItemWarranty(item, undefined, mockStandardConfig) === null,
    'Fuzzing: orderDate = undefined returns null safely');
  assert(calculateItemWarranty(item, 'not-a-valid-date-string', mockStandardConfig) === null,
    'Fuzzing: orderDate = "not-a-valid-date-string" returns null safely');
  assert(calculateItemWarranty(item, NaN, mockStandardConfig) === null,
    'Fuzzing: orderDate = NaN returns null safely');
}

// 2.3 Nullish or empty warrantyConfig
{
  const item = { category: 'Panel', sku: 'PN-01' };
  const orderDate = new Date('2026-09-02T12:00:00Z');
  const refDate = new Date('2026-10-02T12:00:00Z');

  const resNullConfig = calculateItemWarranty(item, orderDate, null, refDate);
  assert(resNullConfig !== null && resNullConfig.claimDays === DEFAULT_WARRANTY_DAYS.claimDays,
    'Fuzzing: warrantyConfig = null gracefully uses DEFAULT_WARRANTY_DAYS (30)',
    `Expected 30, got ${resNullConfig?.claimDays}`);

  const resEmptyConfig = calculateItemWarranty(item, orderDate, {}, refDate);
  assert(resEmptyConfig !== null && resEmptyConfig.claimDays === DEFAULT_WARRANTY_DAYS.claimDays,
    'Fuzzing: warrantyConfig = {} gracefully uses DEFAULT_WARRANTY_DAYS (30)',
    `Expected 30, got ${resEmptyConfig?.claimDays}`);
}

// 2.4 Division-by-Zero and Negative Warranty Duration Guard
{
  const zeroWarrantyConfig = {
    categories: {
      'Panel': { claimDays: 0, returnDays: 0 }
    }
  };
  const item = { category: 'Panel', sku: 'PN-01' };
  const orderDate = new Date('2026-10-02T12:00:00Z');
  const resZero = calculateItemWarranty(item, orderDate, zeroWarrantyConfig, orderDate);
  
  assert(Number.isFinite(resZero.percentUsed) && !isNaN(resZero.percentUsed),
    'Division-by-Zero Guard: claimDays = 0 does NOT produce NaN or Infinity in percentUsed',
    `percentUsed is ${resZero.percentUsed}`);
  assert(resZero.percentUsed === 0 && resZero.percentRemaining === 100,
    'Division-by-Zero Guard: claimDays = 0 on day 0 yields percentUsed = 0, percentRemaining = 100',
    `percentUsed: ${resZero.percentUsed}, percentRemaining: ${resZero.percentRemaining}`);

  // Negative claimDays in config
  const negativeWarrantyConfig = {
    categories: {
      'Special': { claimDays: -10, returnDays: -5 }
    }
  };
  const resNeg = calculateItemWarranty({ category: 'Special' }, orderDate, negativeWarrantyConfig, orderDate);
  assert(Number.isFinite(resNeg.percentUsed) && resNeg.isExpired === true,
    'Negative Duration Guard: claimDays = -10 produces finite percentUsed and is immediately expired',
    `percentUsed: ${resNeg.percentUsed}, isExpired: ${resNeg.isExpired}`);
}

// 2.5 Massive Number Fuzzing
{
  const hugeConfig = {
    categories: {
      'Lifetime': { claimDays: 999999, returnDays: 365 }
    }
  };
  const resHuge = calculateItemWarranty({ category: 'Lifetime' }, new Date('2026-01-01'), hugeConfig, new Date('2026-10-02'));
  assert(resHuge.remainingDays > 999000 && !resHuge.isExpired,
    'Large Integer Guard: 999,999 days warranty calculates without overflow',
    `remainingDays: ${resHuge.remainingDays}`);
}


// =============================================================================
// VECTOR 3: Hierarchy Precedence (SKU Override vs Category vs Fallback)
// =============================================================================
console.log('\n--- 3. Testing Hierarchy Precedence & Resolution Order ---');

// 3.1 SKU Override beats Category
{
  const item = { category: 'Speaker', sku: 'SKU-VIP-1YR' }; // Speaker is 7 days, SKU is 365 days
  const orderDate = new Date('2026-09-02T12:00:00Z');
  const refDate = new Date('2026-10-02T12:00:00Z');
  const res = calculateItemWarranty(item, orderDate, mockStandardConfig, refDate);

  assert(res.claimDays === 365 && res.isSkuOverride === true && res.categoryKey === 'SKU_OVERRIDE',
    'Precedence 1: SKU Override (365d) takes strict priority over Category (7d)',
    `claimDays: ${res.claimDays}, isSkuOverride: ${res.isSkuOverride}`);
}

// 3.2 SKU Override with 0 days (No warranty override)
{
  const item = { category: 'Panel', sku: 'SKU-NO-WARRANTY' }; // Panel is 180 days, SKU is 0 days
  const orderDate = new Date('2026-10-02T12:00:00Z');
  const res = calculateItemWarranty(item, orderDate, mockStandardConfig, orderDate);

  assert(res.claimDays === 0 && res.isSkuOverride === true,
    'Precedence 1b: SKU Override with 0 days successfully overrides Category 180 days',
    `claimDays: ${res.claimDays}`);
}

// 3.3 Thai Synonym Normalization matches English Key in config
{
  const thaiTestCases = [
    { cat: 'หน้าจอ', expectedKey: 'Panel', expectedDays: 180 },
    { cat: 'จอ', expectedKey: 'Panel', expectedDays: 180 },
    { cat: 'คีย์บอร์ด', expectedKey: 'Keyboard', expectedDays: 90 },
    { cat: 'แป้นพิมพ์', expectedKey: 'Keyboard', expectedDays: 90 },
    { cat: 'แบตเตอรี่', expectedKey: 'Battery', expectedDays: 180 },
    { cat: 'แบต', expectedKey: 'Battery', expectedDays: 180 },
    { cat: 'สายชาร์จ', expectedKey: 'Adapter', expectedDays: 180 },
    { cat: 'ลำโพง', expectedKey: 'Speaker', expectedDays: 7 },
    { cat: 'พัดลม', expectedKey: 'Fan', expectedDays: 90 }
  ];

  for (const tc of thaiTestCases) {
    const res = calculateItemWarranty({ category: tc.cat, sku: 'GEN-ITEM' }, new Date(), mockStandardConfig);
    assert(res.categoryKey === tc.expectedKey && res.claimDays === tc.expectedDays,
      `Precedence 2: Thai synonym "${tc.cat}" normalizes to "${tc.expectedKey}" (${tc.expectedDays}d)`,
      `Got key "${res.categoryKey}", days ${res.claimDays}`);
  }
}

// 3.4 SKU Prefix Inference when category is omitted
{
  const skuPrefixCases = [
    { sku: 'PN-156-FHD', expectedKey: 'Panel', expectedDays: 180 },
    { sku: 'SCR-140', expectedKey: 'Panel', expectedDays: 180 },
    { sku: 'KB-DELL-5520', expectedKey: 'Keyboard', expectedDays: 90 },
    { sku: 'BT-HP-4CELL', expectedKey: 'Battery', expectedDays: 180 },
    { sku: 'AD-TYPE-C-65W', expectedKey: 'Adapter', expectedDays: 180 },
    { sku: 'SPK-MACBOOK', expectedKey: 'Speaker', expectedDays: 7 },
    { sku: 'FAN-ASUS-ROG', expectedKey: 'Fan', expectedDays: 90 }
  ];

  for (const tc of skuPrefixCases) {
    const res = calculateItemWarranty({ category: '', sku: tc.sku }, new Date(), mockStandardConfig);
    assert(res.categoryKey === tc.expectedKey && res.claimDays === tc.expectedDays,
      `Precedence 3: SKU Prefix "${tc.sku}" infers category "${tc.expectedKey}" (${tc.expectedDays}d)`,
      `Got key "${res.categoryKey}", days ${res.claimDays}`);
  }
}

// 3.5 Substring Matching Fallback for Mixed Category Names
{
  const item = { category: 'Asus Gaming Laptop Battery Pack', sku: 'RANDOM-123' };
  const res = calculateItemWarranty(item, new Date(), mockStandardConfig);
  assert(res.categoryKey === 'Battery' && res.claimDays === 180,
    'Precedence 4: Substring match finds "Battery" (180d) in compound string',
    `Got key "${res.categoryKey}", days ${res.claimDays}`);
}

// 3.6 Complete Fallback to General
{
  const item = { category: 'CosmicDustModule', sku: 'COSMIC-999' };
  const res = calculateItemWarranty(item, new Date(), mockStandardConfig);
  assert(res.categoryKey === 'General' && res.claimDays === 30,
    'Precedence 5: Unknown item falls back cleanly to General (30d)',
    `Got key "${res.categoryKey}", days ${res.claimDays}`);
}


// =============================================================================
// VECTOR 4: Expiration & Status Lifecycle State Verification
// =============================================================================
console.log('\n--- 4. Testing Expiration & Status Lifecycle State ---');

// 4.1 Day 0 (Purchase Day)
{
  const item = { category: 'General', sku: 'G1' }; // 30 days
  const now = new Date('2026-10-02T12:00:00Z');
  const res = calculateItemWarranty(item, now, mockStandardConfig, now);
  
  assert(res.passedDays === 0, 'Lifecycle Day 0: passedDays = 0');
  assert(res.remainingDays === 30, 'Lifecycle Day 0: remainingDays = 30');
  assert(res.isExpired === false, 'Lifecycle Day 0: isExpired = false');
  assert(res.percentUsed === 0, 'Lifecycle Day 0: percentUsed = 0%');
  assert(res.percentRemaining === 100, 'Lifecycle Day 0: percentRemaining = 100%');
}

// 4.2 Mid-life (Day 15 of 30)
{
  const item = { category: 'General', sku: 'G1' };
  const orderDate = new Date('2026-09-17T12:00:00Z');
  const refDate = new Date('2026-10-02T12:00:00Z');
  const res = calculateItemWarranty(item, orderDate, mockStandardConfig, refDate);

  assert(res.passedDays === 15, 'Lifecycle Day 15: passedDays = 15');
  assert(res.remainingDays === 15, 'Lifecycle Day 15: remainingDays = 15');
  assert(res.isExpired === false, 'Lifecycle Day 15: isExpired = false');
  assert(res.percentUsed === 50, 'Lifecycle Day 15: percentUsed = 50%');
  assert(res.percentRemaining === 50, 'Lifecycle Day 15: percentRemaining = 50%');
}

// 4.3 Last Day of Warranty (Day 30 of 30)
{
  const item = { category: 'General', sku: 'G1' };
  const orderDate = new Date('2026-09-02T12:00:00Z');
  const refDate = new Date('2026-10-02T12:00:00Z');
  const res = calculateItemWarranty(item, orderDate, mockStandardConfig, refDate);

  assert(res.passedDays === 30, 'Lifecycle Day 30: passedDays = 30');
  assert(res.remainingDays === 0, 'Lifecycle Day 30: remainingDays = 0');
  assert(res.isExpired === false, 'Lifecycle Day 30: isExpired = FALSE (Day 30 is still valid until midnight!)');
  assert(res.percentUsed === 100, 'Lifecycle Day 30: percentUsed = 100%');
  assert(res.percentRemaining === 0, 'Lifecycle Day 30: percentRemaining = 0%');
}

// 4.4 Day 31 (First Day Expired)
{
  const item = { category: 'General', sku: 'G1' };
  const orderDate = new Date('2026-09-01T12:00:00Z');
  const refDate = new Date('2026-10-02T12:00:00Z');
  const res = calculateItemWarranty(item, orderDate, mockStandardConfig, refDate);

  assert(res.passedDays === 31, 'Lifecycle Day 31: passedDays = 31');
  assert(res.remainingDays === -1, 'Lifecycle Day 31: remainingDays = -1');
  assert(res.isExpired === true, 'Lifecycle Day 31: isExpired = TRUE');
  assert(res.percentUsed === 100, 'Lifecycle Day 31: percentUsed is clamped to max 100%');
  assert(res.percentRemaining === 0, 'Lifecycle Day 31: percentRemaining is clamped to min 0%');
}

// 4.5 Severely Expired (Day 100 of 30)
{
  const item = { category: 'General', sku: 'G1' };
  const orderDate = new Date('2026-06-24T12:00:00Z');
  const refDate = new Date('2026-10-02T12:00:00Z');
  const res = calculateItemWarranty(item, orderDate, mockStandardConfig, refDate);

  assert(res.passedDays === 100, 'Lifecycle Day 100: passedDays = 100');
  assert(res.remainingDays === -70, 'Lifecycle Day 100: remainingDays = -70');
  assert(res.isExpired === true, 'Lifecycle Day 100: isExpired = TRUE');
  assert(res.percentUsed === 100 && res.percentRemaining === 0, 'Lifecycle Day 100: percent clamped at 100/0');
}


// =============================================================================
// VECTOR 5: Batch Operations, Deduplication & Quota Guard
// =============================================================================
console.log('\n--- 5. Testing Batch Operations, Deduplication & Quota Guard ---');

// 5.1 Category Normalization Dictionary Exhaustiveness & Edge Cases
{
  assert(normalizeCategoryName('  screen  ') === 'Panel', 'normalizeCategoryName: trims whitespace and maps "screen" to "Panel"');
  assert(normalizeCategoryName('หน้าจอ') === 'Panel', 'normalizeCategoryName: maps "หน้าจอ" to "Panel"');
  assert(normalizeCategoryName('แผงจอ') === 'Panel', 'normalizeCategoryName: maps "แผงจอ" to "Panel"');
  assert(normalizeCategoryName('จอคอม') === 'Panel', 'normalizeCategoryName: maps "จอคอม" to "Panel"');
  assert(normalizeCategoryName('แป้นพิมพ์') === 'Keyboard', 'normalizeCategoryName: maps "แป้นพิมพ์" to "Keyboard"');
  assert(normalizeCategoryName('อะแดปเตอร์') === 'Adapter', 'normalizeCategoryName: maps "อะแดปเตอร์" to "Adapter"');
  assert(normalizeCategoryName('สปีกเกอร์') === 'Speaker', 'normalizeCategoryName: maps "สปีกเกอร์" to "Speaker"');
  assert(normalizeCategoryName('ซิงค์') === 'Cooling', 'normalizeCategoryName: maps "ซิงค์" to "Cooling"');
  assert(normalizeCategoryName('สายสัญญาณ') === 'Cable', 'normalizeCategoryName: maps "สายสัญญาณ" to "Cable"');
  assert(normalizeCategoryName('พาวเวอร์ซัพพลาย') === 'Switching', 'normalizeCategoryName: maps "พาวเวอร์ซัพพลาย" to "Switching"');
  assert(normalizeCategoryName('ฮาร์ดดิสก์') === 'SSD', 'normalizeCategoryName: maps "ฮาร์ดดิสก์" to "SSD"');
  assert(normalizeCategoryName('มาเธอร์บอร์ด') === 'Mainboard', 'normalizeCategoryName: maps "มาเธอร์บอร์ด" to "Mainboard"');
  assert(normalizeCategoryName('ฝาหลัง') === 'Case', 'normalizeCategoryName: maps "ฝาหลัง" to "Case"');
  assert(normalizeCategoryName('อื่นๆ') === 'General', 'normalizeCategoryName: maps "อื่นๆ" to "General"');
  assert(normalizeCategoryName('') === 'General', 'normalizeCategoryName: empty string maps to "General"');
  assert(normalizeCategoryName('   ') === 'General', 'normalizeCategoryName: whitespace only maps to "General"');
  assert(normalizeCategoryName(null) === 'General', 'normalizeCategoryName: null maps to "General"');
  assert(normalizeCategoryName(undefined) === 'General', 'normalizeCategoryName: undefined maps to "General"');
  assert(normalizeCategoryName(12345) === 'General', 'normalizeCategoryName: non-string maps to "General"');
}

// 5.2 Deduplication Simulation for Batch Category Lists
{
  const rawBatch = [
    'Panel', 'หน้าจอ', 'PANEL', 'screen', 'จอภาพ',
    'Fan', 'พัดลม', 'FAN',
    'Keyboard', 'คีย์บอร์ด',
    '', null, undefined, '   '
  ];

  const uniqueNormKeys = new Set();
  rawBatch.forEach(name => {
    if (!name || typeof name !== 'string' || !name.trim()) return;
    const normKey = normalizeCategoryName(name);
    uniqueNormKeys.add(normKey);
  });

  const uniqueList = Array.from(uniqueNormKeys);
  assert(uniqueList.length === 3,
    'Batch Deduplication: 14 noisy/synonymous inputs deduplicate to exactly 3 canonical keys',
    `Expected 3, got ${uniqueList.length} (${uniqueList.join(', ')})`);
  assert(uniqueList.includes('Panel') && uniqueList.includes('Fan') && uniqueList.includes('Keyboard'),
    'Batch Deduplication: Contains exact canonical keys [Panel, Fan, Keyboard]',
    `Keys: ${uniqueList.join(', ')}`);
}


// =============================================================================
// VECTOR 6: Consumer Wiring & Static Contract Audit
// =============================================================================
console.log('\n--- 6. Testing Consumer Wiring & Architectural Contracts ---');

// 6.1 Audit categoryService.js batch triggering
{
  const catServicePath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/firebase/categoryService.js');
  const catContent = fs.readFileSync(catServicePath, 'utf8');

  assert(catContent.includes('import { warrantyService } from \'./warrantyService\';'),
    'categoryService.js: Imports warrantyService correctly');
  assert(catContent.includes('checkAndTriggerWarrantyTasksForBatch'),
    'categoryService.js: Calls checkAndTriggerWarrantyTasksForBatch for batch sync');
  assert(catContent.includes('autoSyncCategories'),
    'categoryService.js: autoSyncCategories exists and connects batch trigger');
}

// 6.2 Audit useWarrantyManager.js double-log prevention and input safety
{
  const hookPath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/warranty/hooks/useWarrantyManager.js');
  const hookContent = fs.readFileSync(hookPath, 'utf8');

  assert(hookContent.includes('Math.max(0, parseInt(value, 10) || 0)'),
    'useWarrantyManager.js: Inputs sanitized with Math.max(0, parseInt) preventing negatives and NaN');
  assert(hookContent.includes('warrantyService.updateWarrantySettings(warrantyConfig, uid, diffMsg)'),
    'useWarrantyManager.js: Delegates update and history log to warrantyService (prevents double logging)');
  assert(!hookContent.includes('historyService.addLog'),
    'useWarrantyManager.js: Does NOT directly call historyService.addLog (Single Responsibility Principle)');
}

// 6.3 Audit Consumers import single source of truth
{
  const productInfoPath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/pages/claims/components/detail/ProductInfo.jsx');
  const productInfoContent = fs.readFileSync(productInfoPath, 'utf8');
  assert(productInfoContent.includes('import { calculateItemWarranty } from \'dh-shared/src/utils/warrantyUtils\';'),
    'ProductInfo.jsx: Imports calculateItemWarranty from dh-shared SSOT');

  const checkModalPath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/components/common/WarrantyCheckModal.jsx');
  const checkModalContent = fs.readFileSync(checkModalPath, 'utf8');
  assert(checkModalContent.includes('import { calculateItemWarranty } from \'dh-shared/src/utils/warrantyUtils\';'),
    'WarrantyCheckModal.jsx: Imports calculateItemWarranty from dh-shared SSOT');

  const claimFormPath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/components/billing/dashboard/order-summary/ClaimActionForm.jsx');
  const claimFormContent = fs.readFileSync(claimFormPath, 'utf8');
  assert(claimFormContent.includes('calculateItemWarranty'),
    'ClaimActionForm.jsx: Integrates calculateItemWarranty for billing claim actions');
}

// 6.4 Audit Local Grimoire ssr memory warranty.md
{
  const grimoirePath = path.resolve(REPO_ROOT, 'dh-backoffice-react/src/pages/managers/warranty/ssr memory warranty.md');
  const exists = fs.existsSync(grimoirePath);
  assert(exists, 'Grimoire Protocol: ssr memory warranty.md exists');
  
  if (exists) {
    const grimoireContent = fs.readFileSync(grimoirePath, 'utf8');
    const lines = grimoireContent.split('\n').length;
    assert(lines <= 80, `Grimoire Protocol: ssr memory warranty.md is under 80 lines (current: ${lines} lines)`);
    assert(grimoireContent.includes('<flow_and_entry>') && grimoireContent.includes('<pitfalls_and_lessons>'),
      'Grimoire Protocol: ssr memory warranty.md contains required XML sections');
  }
}

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================================');
console.log('📊 CHALLENGER ADVERSARIAL SUITE EXECUTION SUMMARY');
console.log('================================================================================');
console.log(`Total Assertions Checked : ${totalChecks}`);
console.log(`Passed Assertions        : ${passedChecks}`);
console.log(`Failed Assertions        : ${failedChecks}`);
console.log(`Defect Count             : ${defects.length}`);

if (failedChecks > 0) {
  console.error('\n❌ DEFECT DETAILS:');
  defects.forEach((d, idx) => {
    console.error(`  ${idx + 1}. ${d.test}: ${d.details}`);
  });
  console.log('\n🏁 FINAL VERDICT: REQUEST_CHANGES');
  process.exit(1);
} else {
  console.log('\n🎉 ALL 50+ ADVERSARIAL STRESS ASSERTIONS PASSED WITH ZERO DEFECTS!');
  console.log('🏁 FINAL VERDICT: APPROVE');
  process.exit(0);
}
