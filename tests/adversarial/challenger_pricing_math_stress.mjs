import assert from 'node:assert';
import { 
  calculateRetailPrice, 
  normalizeCategory, 
  calculateNextEnding, 
  sanitizeCost,
  defaultPricingConfig 
} from '../../dh-shared/src/utils/pricingEngine.js';

console.log('================================================================');
console.log('⚔️  CHALLENGER: ADVERSARIAL STRESS TEST — RETAIL PRICING ENGINE');
console.log('⚔️  Target: Management System/dh-shared/src/utils/pricingEngine.js');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
    findings.push({ name, error: err.message, stack: err.stack });
  }
}

// -------------------------------------------------------------
// SUITE 1: Comma, Space & Currency Symbol Sanitization
// -------------------------------------------------------------
console.log('\n--- [SUITE 1] Comma, Space & Currency Symbol Sanitization ---');

runTest('1.1 Standard comma string "1,500" parsed as 1500', () => {
  assert.strictEqual(sanitizeCost("1,500"), 1500);
});

runTest('1.2 Large multi-comma number "12,345,678.90" parsed as 12345678.9', () => {
  assert.strictEqual(sanitizeCost("12,345,678.90"), 12345678.9);
});

runTest('1.3 Padded comma string " 1,200 " parsed as 1200', () => {
  assert.strictEqual(sanitizeCost(" 1,200 "), 1200);
});

runTest('1.4 Postfix currency "1,500 THB" parsed as 1500', () => {
  // parseFloat parses until first non-digit: "1500 THB" -> 1500
  assert.strictEqual(sanitizeCost("1,500 THB"), 1500);
});

runTest('1.5 Prefix currency "$1,500": evaluates behavior (does not return NaN)', () => {
  const result = sanitizeCost("$1,500");
  assert(!isNaN(result), "Must never return NaN");
  assert(typeof result === 'number', "Must return numeric type");
  // Document behavior: replace(/,/g, '') leaves '$1500', parseFloat("$1500") is NaN -> sanitized to 0
  console.log(`     ℹ️  Note: sanitizeCost("$1,500") returns ${result} (currency prefix '$' treated as invalid number -> safe fallback 0)`);
  assert.strictEqual(result, 0);
});

runTest('1.6 Thai Baht prefix "฿1,500": evaluates behavior (safe fallback 0, no NaN)', () => {
  const result = sanitizeCost("฿1,500");
  assert(!isNaN(result), "Must never return NaN");
  assert.strictEqual(result, 0);
});

runTest('1.7 Extreme messy commas ",1,,500," parsed cleanly', () => {
  const result = sanitizeCost(",1,,500,");
  assert.strictEqual(result, 1500);
});

runTest('1.8 Full calculateRetailPrice integration with comma cost "1,500"', () => {
  const res = calculateRetailPrice("1,500", "Panel", defaultPricingConfig);
  assert.strictEqual(res.cost, 1500);
  assert(!isNaN(res.calculatedPrice));
  assert(res.calculatedPrice > 1500);
});


// -------------------------------------------------------------
// SUITE 2: Wildcard Category Guard & Substring Traps
// -------------------------------------------------------------
console.log('\n--- [SUITE 2] Wildcard Category Guard & Substring Traps ---');

const baseRules = [
  { id: 'rule_panel', category: 'Panel', operator: '<=', threshold: 2000, action: '/', value: 0.70, isActive: true },
  { id: 'rule_all', category: 'ALL', operator: 'all', threshold: 0, action: '*', value: 1.20, isActive: true },
];

runTest('2.1 Rule with empty category "" is ignored and does NOT hijack evaluation', () => {
  const configWithBuggyEmptyRule = {
    rounding: { type: 'none' },
    rules: [
      { id: 'hijack_empty_string', category: '', operator: 'all', threshold: 0, action: '*', value: 0.1, isActive: true },
      ...baseRules
    ]
  };
  const res = calculateRetailPrice(1000, 'Panel', configWithBuggyEmptyRule);
  assert.strictEqual(res.appliedRule.id, 'rule_panel');
});

runTest('2.2 Rule with null category is ignored and does NOT hijack evaluation', () => {
  const configWithNullRule = {
    rounding: { type: 'none' },
    rules: [
      { id: 'hijack_null', category: null, operator: 'all', threshold: 0, action: '*', value: 0.1, isActive: true },
      ...baseRules
    ]
  };
  const res = calculateRetailPrice(1000, 'Panel', configWithNullRule);
  assert.strictEqual(res.appliedRule.id, 'rule_panel');
});

runTest('2.3 Rule with whitespace category "   " is cleanly guarded', () => {
  const configWithWhitespaceRule = {
    rounding: { type: 'none' },
    rules: [
      { id: 'hijack_spaces', category: '   ', operator: 'all', threshold: 0, action: '*', value: 0.1, isActive: true },
      ...baseRules
    ]
  };
  const res = calculateRetailPrice(1000, 'Panel', configWithWhitespaceRule);
  assert.strictEqual(res.appliedRule.id, 'rule_panel');
});

runTest('2.4 Product with empty category "" vs category-specific rule: must NOT match specific rule, falls to ALL', () => {
  const config = {
    rounding: { type: 'none' },
    rules: [
      { id: 'rule_panel', category: 'Panel', operator: '<=', threshold: 2000, action: '/', value: 0.70, isActive: true },
      { id: 'rule_all', category: 'ALL', operator: 'all', threshold: 0, action: '*', value: 1.20, isActive: true },
    ]
  };
  const res = calculateRetailPrice(1000, '', config);
  assert.strictEqual(res.appliedRule?.id, 'rule_all');
  assert.strictEqual(res.calculatedPrice, 1200);
});

runTest('2.5 Product with null category: falls through cleanly to ALL rule', () => {
  const config = {
    rounding: { type: 'none' },
    rules: [
      { id: 'rule_panel', category: 'Panel', operator: '<=', threshold: 2000, action: '/', value: 0.70, isActive: true },
      { id: 'rule_all', category: 'ALL', operator: 'all', threshold: 0, action: '*', value: 1.20, isActive: true },
    ]
  };
  const res = calculateRetailPrice(1000, null, config);
  assert.strictEqual(res.appliedRule?.id, 'rule_all');
  assert.strictEqual(res.calculatedPrice, 1200);
});

runTest('2.6 Product category "other" does NOT trigger partial substring match with "motherboard"', () => {
  const config = {
    rounding: { type: 'none' },
    rules: [
      { id: 'rule_mb', category: 'motherboard', operator: 'all', threshold: 0, action: '*', value: 1.5, isActive: true },
      { id: 'rule_all', category: 'ALL', operator: 'all', threshold: 0, action: '*', value: 1.1, isActive: true }
    ]
  };
  // 'other' has explicit guard `lowerCategory !== 'other'` preventing substring match with 'motherboard'
  const res = calculateRetailPrice(1000, 'other', config);
  assert.strictEqual(res.appliedRule.id, 'rule_all', 'Must not match motherboard via substring "other"');
});

runTest('2.7 Thai category aliases match correctly ("หน้าจอ" -> Panel, "คีย์บอร์ด" -> Keyboard)', () => {
  assert.strictEqual(normalizeCategory('หน้าจอ'), 'Panel');
  assert.strictEqual(normalizeCategory('คีย์บอร์ด'), 'Keyboard');
  assert.strictEqual(normalizeCategory('แบตเตอรี่'), 'Battery');
  assert.strictEqual(normalizeCategory('สายชาร์จ'), 'Adapter');
  assert.strictEqual(normalizeCategory('ลำโพง'), 'Speaker');
});


// -------------------------------------------------------------
// SUITE 3: Loss Prevention Floor & Boundary Behavior
// -------------------------------------------------------------
console.log('\n--- [SUITE 3] Loss Prevention Floor & Boundary Behavior ---');

runTest('3.1 Large discount rule (e.g. 50% discount on cost 1000) triggers loss prevention floor (cost + 100)', () => {
  const lossConfig = {
    rounding: { type: 'none' },
    rules: [{ id: 'loss_rule', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 0.5, isActive: true }]
  };
  const res = calculateRetailPrice(1000, 'Panel', lossConfig);
  // Without floor, price would be 500. Floor must kick in to 1000 + 100 = 1100.
  assert.strictEqual(res.calculatedPrice, 1100);
  assert.strictEqual(res.appliedRoundingType, 'ปัดขึ้นฉุกเฉิน (ป้องกันขาดทุน)');
  assert.strictEqual(res.margin, 100);
});

runTest('3.2 Low markup behavior: cost = 50, markup = 1%', () => {
  const lowMarkupConfig = {
    rounding: { type: 'none' },
    rules: [{ id: 'low_markup', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 1.01, isActive: true }]
  };
  const res = calculateRetailPrice(50, 'Panel', lowMarkupConfig);
  // Math.ceil(50 * 1.01) = 51. Since 51 > 50, finalPrice <= numCost check is FALSE!
  console.log(`     ℹ️  Observation: cost = 50, markup = 1% yields calculatedPrice = ${res.calculatedPrice}, margin = ${res.margin}`);
  assert.strictEqual(res.calculatedPrice, 51);
  assert(res.calculatedPrice > res.cost, "Price is higher than cost");
  // Document whether price drops below cost + 100:
  if (res.calculatedPrice < res.cost + 100) {
    console.log(`     ⚠️  EMPIRICAL FINDING: When markup > 0% but profit < 100 (e.g. price 51), price is BELOW cost + 100 (${res.cost + 100})!`);
    console.log(`         Reason: The engine guards 'if (finalPrice <= numCost)', triggering emergency +100 ONLY on breakeven/loss, not as an absolute minimum profit floor.`);
  }
});

runTest('3.3 Low markup behavior: cost = 1000, markup = 1% with custom round90', () => {
  const lowMarkupRound90Config = {
    rounding: { type: 'custom', primaryTarget: '90' },
    rules: [{ id: 'low_markup', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 1.01, isActive: true }]
  };
  const res = calculateRetailPrice(1000, 'Panel', lowMarkupRound90Config);
  // 1000 * 1.01 = 1010 -> next ending 90 is 1090.
  console.log(`     ℹ️  Observation: cost = 1000, markup = 1% yields calculatedPrice = ${res.calculatedPrice}, margin = ${res.margin}`);
  assert.strictEqual(res.calculatedPrice, 1090);
  if (res.calculatedPrice < res.cost + 100) {
    console.log(`     ⚠️  EMPIRICAL FINDING: Price 1090 is below cost + 100 (1100). Profit is 90 THB.`);
  }
});

runTest('3.4 Zero cost (cost = 0) returns safe null-state object', () => {
  const res = calculateRetailPrice(0, 'Panel', defaultPricingConfig);
  assert.strictEqual(res.cost, 0);
  assert.strictEqual(res.calculatedPrice, 0);
  assert.strictEqual(res.rawPrice, 0);
  assert.strictEqual(res.appliedRule, null);
  assert.strictEqual(res.appliedRoundingType, 'ไม่มีข้อมูลทุน');
  assert.strictEqual(res.margin, 0);
  assert.strictEqual(res.marginPercent, 0);
});

runTest('3.5 Negative cost (cost = -100) returns safe null-state object without error', () => {
  const res = calculateRetailPrice(-100, 'Panel', defaultPricingConfig);
  assert.strictEqual(res.cost, 0);
  assert.strictEqual(res.calculatedPrice, 0);
  assert.strictEqual(res.appliedRoundingType, 'ไม่มีข้อมูลทุน');
});

runTest('3.6 Non-numeric cost (cost = "abc") returns safe null-state object', () => {
  const res = calculateRetailPrice("abc", 'Panel', defaultPricingConfig);
  assert.strictEqual(res.cost, 0);
  assert.strictEqual(res.calculatedPrice, 0);
  assert.strictEqual(res.appliedRoundingType, 'ไม่มีข้อมูลทุน');
});

runTest('3.7 Division by zero in rule action: action="/" with value=0 does not produce Infinity or NaN', () => {
  const divZeroConfig = {
    rounding: { type: 'none' },
    rules: [{ id: 'div_zero', category: 'Panel', operator: 'all', threshold: 0, action: '/', value: 0, isActive: true }]
  };
  const res = calculateRetailPrice(500, 'Panel', divZeroConfig);
  assert(!isNaN(res.calculatedPrice));
  assert(isFinite(res.calculatedPrice));
  // Engine guards: `!isNaN(val) && val > 0 ? numCost / val : numCost` -> falls back to numCost = 500.
  // Then finalPrice <= numCost (500 <= 500) triggers loss prevention -> 500 + 100 = 600.
  assert.strictEqual(res.calculatedPrice, 600);
});


// -------------------------------------------------------------
// SUITE 4: Psychological Rounding & Decimal Costs
// -------------------------------------------------------------
console.log('\n--- [SUITE 4] Psychological Rounding & Decimal Costs ---');

runTest('4.1 Psychological rounding round90 (ends in 90)', () => {
  assert.strictEqual(calculateNextEnding(154, '90'), 190);
  assert.strictEqual(calculateNextEnding(190, '90'), 190, "Idempotent when already ending in 90");
  assert.strictEqual(calculateNextEnding(191, '90'), 290);
});

runTest('4.2 Psychological rounding round00 (ends in 00)', () => {
  assert.strictEqual(calculateNextEnding(154, '00'), 200);
  assert.strictEqual(calculateNextEnding(200, '00'), 200, "Idempotent when already ending in 00");
  assert.strictEqual(calculateNextEnding(201, '00'), 300);
});

runTest('4.3 Psychological rounding with 3-digit target "100"', () => {
  // calculateNextEnding(154, '100'): targetStr.length is 3, mod is 1000.
  // baseFloor = 154 - 154 = 0. candidate = 100 < 154 -> candidate += 1000 = 1100.
  const res154 = calculateNextEnding(154, '100');
  assert.strictEqual(res154, 1100);
  // calculateNextEnding(1100, '100') -> 1100
  assert.strictEqual(calculateNextEnding(1100, '100'), 1100);
  console.log(`     ℹ️  Note: Target '100' looks for numbers ending with '100' modulo 1000 (e.g. 100, 1100, 2100). For multiples of 100, use '00'.`);
});

runTest('4.4 Decimal cost 154.33 with default config', () => {
  // Panel rule 1: cost <= 1100 -> / 0.65 -> 154.33 / 0.65 = 237.43 -> ceil 238 -> next 90 is 290
  const res = calculateRetailPrice(154.33, 'Panel', defaultPricingConfig);
  assert.strictEqual(res.cost, 154.33);
  assert.strictEqual(res.calculatedPrice, 290);
  assert.strictEqual(res.appliedRoundingType, 'ลงท้ายด้วย 90');
});

runTest('4.5 Decimal cost 999.99 with default config', () => {
  // 999.99 / 0.65 = 1538.446 -> ceil 1539 -> next 90 is 1590
  const res = calculateRetailPrice(999.99, 'Panel', defaultPricingConfig);
  assert.strictEqual(res.cost, 999.99);
  assert.strictEqual(res.calculatedPrice, 1590);
  assert.strictEqual(res.appliedRoundingType, 'ลงท้ายด้วย 90');
});

runTest('4.6 Micro decimal cost 0.05', () => {
  const res = calculateRetailPrice(0.05, 'Panel', defaultPricingConfig);
  assert.strictEqual(res.cost, 0.05);
  // 0.05 / 0.65 = 0.0769 -> ceil 1 -> next 90 is 90
  assert.strictEqual(res.calculatedPrice, 90);
  assert(res.margin > 0);
});

runTest('4.7 Fallback rounding activation when primary target is invalid', () => {
  const fallbackConfig = {
    rounding: { type: 'custom', primaryTarget: '', enableFallback: true, fallbackTarget: '9' },
    rules: [{ id: 'r1', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 1.1, isActive: true }]
  };
  const res = calculateRetailPrice(100, 'Panel', fallbackConfig);
  // 100 * 1.1 = 110 -> next ending 9 is 119
  assert.strictEqual(res.calculatedPrice, 119);
  assert.strictEqual(res.appliedRoundingType, 'ลงท้ายด้วย 9 (เงื่อนไขสำรอง)');
});

runTest('4.8 Rounding type "none" preserves exact ceil integer without psychological jump', () => {
  const noneConfig = {
    rounding: { type: 'none' },
    rules: [{ id: 'r1', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 1.25, isActive: true }]
  };
  const res = calculateRetailPrice(100, 'Panel', noneConfig);
  // 100 * 1.25 = 125 -> Math.ceil(125) = 125
  assert.strictEqual(res.calculatedPrice, 125);
  assert.strictEqual(res.appliedRoundingType, 'ไม่มีการปัดเศษ (ตรงตัว)');
});


// -------------------------------------------------------------
// SUITE 5: Top-Down Priority & Shadowing Determinism
// -------------------------------------------------------------
console.log('\n--- [SUITE 5] Top-Down Priority & Shadowing Determinism ---');

runTest('5.1 First matching rule in array order always wins (Top-Down determinism)', () => {
  const config = {
    rounding: { type: 'none' },
    rules: [
      { id: 'rule_first', category: 'Panel', operator: '<=', threshold: 1000, action: '*', value: 2.0, isActive: true },
      { id: 'rule_second', category: 'Panel', operator: '<=', threshold: 1000, action: '*', value: 1.5, isActive: true }
    ]
  };
  const res = calculateRetailPrice(500, 'Panel', config);
  assert.strictEqual(res.appliedRule.id, 'rule_first');
  assert.strictEqual(res.calculatedPrice, 1000);
});

runTest('5.2 Reversing rule order flips the winning rule deterministically', () => {
  const config = {
    rounding: { type: 'none' },
    rules: [
      { id: 'rule_second', category: 'Panel', operator: '<=', threshold: 1000, action: '*', value: 1.5, isActive: true },
      { id: 'rule_first', category: 'Panel', operator: '<=', threshold: 1000, action: '*', value: 2.0, isActive: true }
    ]
  };
  const res = calculateRetailPrice(500, 'Panel', config);
  assert.strictEqual(res.appliedRule.id, 'rule_second');
  assert.strictEqual(res.calculatedPrice, 750);
});

runTest('5.3 Shadowing: Broader rule placed first shadows narrower rule below it', () => {
  const config = {
    rounding: { type: 'none' },
    rules: [
      { id: 'broad_rule', category: 'Panel', operator: '<=', threshold: 2000, action: '*', value: 1.2, isActive: true },
      { id: 'narrow_rule', category: 'Panel', operator: '<=', threshold: 500, action: '*', value: 1.8, isActive: true }
    ]
  };
  // Cost 400 satisfies both <= 2000 and <= 500. broad_rule matches first and shadows narrow_rule.
  const res = calculateRetailPrice(400, 'Panel', config);
  assert.strictEqual(res.appliedRule.id, 'broad_rule');
  assert.strictEqual(res.calculatedPrice, 480);
});

runTest('5.4 Global "all" rule placed at top shadows all category rules below it', () => {
  const config = {
    rounding: { type: 'none' },
    rules: [
      { id: 'global_all', category: 'ALL', operator: 'all', threshold: 0, action: '*', value: 1.1, isActive: true },
      { id: 'specific_panel', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 1.5, isActive: true }
    ]
  };
  const res = calculateRetailPrice(1000, 'Panel', config);
  assert.strictEqual(res.appliedRule.id, 'global_all', 'Top-level ALL rule shadows specific category rule');
  assert.strictEqual(res.calculatedPrice, 1100);
});

runTest('5.5 Inactive rules (isActive: false) are skipped completely', () => {
  const config = {
    rounding: { type: 'none' },
    rules: [
      { id: 'inactive_rule', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 3.0, isActive: false },
      { id: 'active_rule', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 1.2, isActive: true }
    ]
  };
  const res = calculateRetailPrice(1000, 'Panel', config);
  assert.strictEqual(res.appliedRule.id, 'active_rule');
  assert.strictEqual(res.calculatedPrice, 1200);
});


// -------------------------------------------------------------
// SUMMARY & VERDICT
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`⚔️  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL ${totalTests})`);
console.log('================================================================\n');

if (failedTests > 0) {
  console.error('❌ ADVERSARIAL STRESS TEST DETECTED CRITICAL FAILURES!');
  process.exit(1);
} else {
  console.log('🎉 ALL ADVERSARIAL STRESS TEST CASES PASSED EMPIRICALLY!');
  process.exit(0);
}
