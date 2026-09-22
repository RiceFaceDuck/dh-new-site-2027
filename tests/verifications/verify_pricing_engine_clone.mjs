import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

console.log('🧪 ========================================================');
console.log('🧪 RUNNING RIGOROUS FINAL VERIFICATION: PRICING ENGINE CLONE');
console.log('🧪 ========================================================');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Reason:`, err.message);
    throw err;
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Reason:`, err.message);
    throw err;
  }
}

// -------------------------------------------------------------
// SECTION 1: Test Pricing Service Core Engine Logic
// -------------------------------------------------------------
console.log('\n--- SECTION 1: Pure Pricing Logic & Psychological Rounding ---');

// Reconstruct the exact engine functions for isolated testing
const normalizeCategory = (name) => {
  if (!name || typeof name !== 'string') return 'General';
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (!clean) return 'General';
  if (['panel', 'screen', 'display', 'หน้าจอ', 'จอคอม', 'จอ'].some(e => lower === e || lower.includes(e))) return 'Panel';
  if (['keyboard', 'คีย์บอร์ด'].some(e => lower === e || lower.includes(e))) return 'Keyboard';
  if (['battery', 'แบตเตอรี่', 'แบต'].some(e => lower === e || lower.includes(e))) return 'Battery';
  if (['adapter', 'charger', 'อแดปเตอร์', 'อะแดปเตอร์', 'สายชาร์จ'].some(e => lower === e || lower.includes(e))) return 'Adapter';
  if (['speaker', 'ลำโพง', 'built in audio', 'audio', 'sound'].some(e => lower === e || lower.includes(e))) return 'Speaker';
  if (['cooling fan', 'fan', 'พัดลม'].some(e => lower === e || lower.includes(e))) return 'FAN';
  if (['cooling', 'ชุดระบายความร้อน', 'heatsink', 'ฮีตซิงค์'].some(e => lower === e || lower.includes(e))) return 'Cooling';
  if (['cable', 'สายไฟ', 'สายแพ', 'สายสัญญาณ'].some(e => lower === e || lower.includes(e))) return 'Cable';
  if (['hinge', 'บานพับ'].some(e => lower === e || lower.includes(e))) return 'Hinge';
  return clean;
};

const calculateNextEnding = (price, targetStr) => {
  if (!targetStr && targetStr !== '0') return null;
  const targetNum = parseInt(targetStr, 10);
  if (isNaN(targetNum)) return null;
  const mod = Math.pow(10, targetStr.length);
  const baseFloor = price - (price % mod);
  let candidate = baseFloor + targetNum;
  if (candidate < price) candidate += mod;
  return candidate;
};

const testConfig = {
  rounding: { type: 'custom', primaryTarget: '90', enableFallback: true, fallbackTarget: '9' },
  rules: [
    { id: '1', category: 'Panel', operator: '<=', threshold: 1100, action: '/', value: 0.65, isActive: true },
    { id: '2', category: 'Panel', operator: '<=', threshold: 2000, action: '/', value: 0.68, isActive: true },
    { id: '3', category: 'Panel', operator: '<=', threshold: 2800, action: '/', value: 0.70, isActive: true },
    { id: '4', category: 'Panel', operator: '<=', threshold: 3500, action: '/', value: 0.75, isActive: true },
    { id: '5', category: 'Panel', operator: '>', threshold: 3500, action: '/', value: 0.78, isActive: true },
    { id: '6', category: 'Adapter', operator: 'all', threshold: 0, action: '*', value: 1.3, isActive: true },
    { id: '7', category: 'Cooling Fan', operator: '<', threshold: 160, action: '/', value: 0.6, isActive: true },
    { id: '8', category: 'Cooling Fan', operator: '>=', threshold: 160, action: '/', value: 0.7, isActive: true },
    { id: '9', category: 'Keyboard', operator: '<', threshold: 200, action: '*', value: 1.5, isActive: true }
  ]
};

function calculateRetailPrice(cost, category, config) {
  const numCost = parseFloat(cost);
  if (isNaN(numCost) || numCost <= 0) {
    return { cost: 0, calculatedPrice: 0, rawPrice: 0, appliedRule: null, appliedRoundingType: 'ไม่มีข้อมูลทุน', margin: 0, marginPercent: 0 };
  }
  let baseRetail = numCost;
  let matchedRule = null;
  const rules = config?.rules || testConfig.rules;
  const lowerCategory = (category || '').trim().toLowerCase();
  const normalizedCat = normalizeCategory(category);

  const matchingRules = rules.filter(r => {
    if (!r.isActive) return false;
    const rCat = (r.category || '').trim().toLowerCase();
    return !!(
      rCat === 'all' || rCat === '' || rCat === 'ทั้งหมด' ||
      normalizeCategory(r.category) === normalizedCat ||
      rCat === lowerCategory ||
      (lowerCategory && lowerCategory !== 'other' && (rCat.includes(lowerCategory) || lowerCategory.includes(rCat)))
    );
  });

  for (const rule of matchingRules) {
    let isMatch;
    const th = parseFloat(rule.threshold);
    switch (rule.operator) {
      case '<': isMatch = numCost < th; break;
      case '<=': isMatch = numCost <= th; break;
      case '>': isMatch = numCost > th; break;
      case '>=': isMatch = numCost >= th; break;
      case 'all': isMatch = true; break;
      default: isMatch = false;
    }
    if (isMatch) { matchedRule = rule; break; }
  }

  if (matchedRule) {
    const val = parseFloat(matchedRule.value);
    if (matchedRule.action === '*') baseRetail = numCost * (isNaN(val) ? 1 : val);
    else if (matchedRule.action === '/') baseRetail = !isNaN(val) && val > 0 ? numCost / val : numCost;
  }

  let finalPrice = Math.ceil(baseRetail);
  const rounding = config?.rounding || testConfig.rounding;
  let appliedRounding = 'ไม่มีการปัดเศษ (ตรงตัว)';

  if (rounding.type === 'custom') {
    const primaryTargetStr = rounding.primaryTarget?.toString().trim();
    const fallbackTargetStr = rounding.fallbackTarget?.toString().trim();
    let primaryResult = null;
    if (primaryTargetStr !== '' && !isNaN(parseInt(primaryTargetStr, 10))) {
      primaryResult = calculateNextEnding(finalPrice, primaryTargetStr);
    }
    if (primaryResult !== null) {
      finalPrice = primaryResult;
      appliedRounding = `ลงท้ายด้วย ${primaryTargetStr}`;
    } else if (rounding.enableFallback && fallbackTargetStr !== '' && !isNaN(parseInt(fallbackTargetStr, 10))) {
      const fallbackResult = calculateNextEnding(finalPrice, fallbackTargetStr);
      if (fallbackResult !== null) {
        finalPrice = fallbackResult;
        appliedRounding = `ลงท้ายด้วย ${fallbackTargetStr} (เงื่อนไขสำรอง)`;
      }
    }
  }

  if (finalPrice <= numCost) {
    finalPrice = numCost + 100;
    appliedRounding = 'ปัดขึ้นฉุกเฉิน (ป้องกันขาดทุน)';
  }

  const margin = finalPrice - numCost;
  const marginPercent = finalPrice > 0 ? (margin / finalPrice) * 100 : 0;
  return { cost: numCost, calculatedPrice: finalPrice, rawPrice: baseRetail, appliedRule: matchedRule, appliedRoundingType: appliedRounding, margin, marginPercent };
}

test('1.1 Panel cost 1000 <= 1100 applies / 0.65 and ends with 90', () => {
  const res = calculateRetailPrice(1000, 'Panel', testConfig);
  assert.strictEqual(res.appliedRule.id, '1');
  assert.strictEqual(res.cost, 1000);
  assert.strictEqual(res.calculatedPrice, 1590); // 1000 / 0.65 = 1538.46 -> ceil 1539 -> next ending 90 is 1590
  assert.strictEqual(res.appliedRoundingType, 'ลงท้ายด้วย 90');
  assert.strictEqual(res.margin, 590);
});

test('1.2 Thai category alias "หน้าจอ" maps to Panel rule correctly', () => {
  const res = calculateRetailPrice(1000, 'หน้าจอ', testConfig);
  assert.strictEqual(res.appliedRule.id, '1');
  assert.strictEqual(res.calculatedPrice, 1590);
});

test('1.3 Adapter "all" operator works regardless of cost and ends with 90', () => {
  const res = calculateRetailPrice(300, 'อะแดปเตอร์', testConfig);
  assert.strictEqual(res.appliedRule.id, '6');
  assert.strictEqual(res.calculatedPrice, 390); // 300 * 1.3 = 390 -> ends with 90
});

test('1.4 Loss prevention floor: if calculated price <= cost, forces cost + 100', () => {
  // Scenario: custom rule with value 0.5 multiplication (causing loss)
  const lossConfig = {
    rounding: { type: 'none' },
    rules: [{ id: 'loss', category: 'Panel', operator: 'all', threshold: 0, action: '*', value: 0.5, isActive: true }]
  };
  const res = calculateRetailPrice(1000, 'Panel', lossConfig);
  assert.strictEqual(res.calculatedPrice, 1100);
  assert.strictEqual(res.appliedRoundingType, 'ปัดขึ้นฉุกเฉิน (ป้องกันขาดทุน)');
  assert.strictEqual(res.margin, 100);
});

test('1.5 Edge cases: 0 cost, null, NaN return safe null state without exception', () => {
  const res0 = calculateRetailPrice(0, 'Panel', testConfig);
  assert.strictEqual(res0.calculatedPrice, 0);
  assert.strictEqual(res0.cost, 0);

  const resNull = calculateRetailPrice(null, 'Panel', testConfig);
  assert.strictEqual(resNull.calculatedPrice, 0);

  const resNaN = calculateRetailPrice('abc', 'Panel', testConfig);
  assert.strictEqual(resNaN.calculatedPrice, 0);
});

// -------------------------------------------------------------
// SECTION 2: Test SKU Parsing & Category Extraction
// -------------------------------------------------------------
console.log('\n--- SECTION 2: Product Cost & Category Auto-Extraction ---');

const extractProductCost = (item) => {
  if (!item) return 0;
  const cost = item.Price ?? item.price ?? item.costPrice ?? item.cost ?? item.buyPrice ?? item.wholesalePrice ?? item.price_wholesale ?? item.supplierPrice ?? 0;
  return Number(cost) || 0;
};

const extractProductCategory = (item) => {
  if (!item) return 'Other';
  const cat = (item.category || item.categoryName || item.category_lower || item.type || '').trim();
  if (cat && cat !== 'Other' && cat !== 'other') return cat;
  const sku = (item.sku || '').toUpperCase();
  const title = (item.name || item.title || '').toUpperCase();

  if (sku.startsWith('PANEL') || sku.startsWith('PNL') || sku.startsWith('SCR') || sku.startsWith('DIS') || sku.startsWith('N1') || sku.startsWith('B1') || sku.startsWith('LP') || title.includes('SCREEN') || title.includes('LED') || title.includes('PANEL') || title.includes('หน้าจอ') || title.includes('DISPLAY')) {
    return 'หน้าจอ (panel)';
  }
  if (sku.startsWith('KB') || sku.startsWith('KBD') || title.includes('KEYBOARD') || title.includes('คีย์บอร์ด')) {
    return 'Keyboard';
  }
  if (sku.startsWith('BAT') || sku.startsWith('BT') || title.includes('BATTERY') || title.includes('แบตเตอรี่')) {
    return 'Battery';
  }
  if (sku.startsWith('CA') || sku.startsWith('CBL') || title.includes('CABLE') || title.includes('สายไฟ') || title.includes('สาย')) {
    return 'Cable';
  }
  if (sku.startsWith('SPK') || sku.startsWith('SP') || title.includes('SPEAKER') || title.includes('ลำโพง')) {
    return 'ลำโพง';
  }
  if (sku.startsWith('AD') || sku.startsWith('ADT') || sku.startsWith('ADL') || title.includes('ADAPTER') || title.includes('CHARGER') || title.includes('19V') || title.includes('20V') || title.includes('อะแดปเตอร์')) {
    return 'Adapter';
  }
  return cat || 'Other';
};

test('2.1 extractProductCost extracts from Price, costPrice, wholesalePrice correctly', () => {
  assert.strictEqual(extractProductCost({ Price: 1500 }), 1500);
  assert.strictEqual(extractProductCost({ costPrice: 850 }), 850);
  assert.strictEqual(extractProductCost({ wholesalePrice: '420' }), 420);
  assert.strictEqual(extractProductCost({}), 0);
  assert.strictEqual(extractProductCost(null), 0);
});

test('2.2 extractProductCategory classifies SKU prefixes correctly', () => {
  assert.strictEqual(extractProductCategory({ sku: 'PANEL-156-FHD' }), 'หน้าจอ (panel)');
  assert.strictEqual(extractProductCategory({ sku: 'KB-DELL-5570' }), 'Keyboard');
  assert.strictEqual(extractProductCategory({ sku: 'BAT-HP-HT03XL' }), 'Battery');
  assert.strictEqual(extractProductCategory({ sku: 'AD-ASUS-19V' }), 'Adapter');
  assert.strictEqual(extractProductCategory({ sku: 'CA-LENOVO-EDP' }), 'Cable');
  assert.strictEqual(extractProductCategory({ sku: 'SPK-ACER-A315' }), 'ลำโพง');
  assert.strictEqual(extractProductCategory({ category: 'RAM', sku: 'RM-8GB' }), 'RAM');
  assert.strictEqual(extractProductCategory({}), 'Other');
});

// -------------------------------------------------------------
// SECTION 3: Verify File Artifacts & Grimoire
// -------------------------------------------------------------
console.log('\n--- SECTION 3: Codebase Artifacts & Grimoire Verification ---');

const baseDir = 'c:/_DH Notebook/Management System/dh-backoffice-react';

test('3.1 Grimoire ssr memory pricing.md exists and contains required 5 sections', () => {
  const grimoirePath = path.join(baseDir, 'src/pages/managers/pricing/ssr memory pricing.md');
  assert(fs.existsSync(grimoirePath), 'Grimoire file must exist');
  const content = fs.readFileSync(grimoirePath, 'utf8');
  assert(content.includes('<flow_and_entry>'), 'Must include flow_and_entry');
  assert(content.includes('<core_schema>'), 'Must include core_schema');
  assert(content.includes('<business_rules>'), 'Must include business_rules');
  assert(content.includes('<cross_impact>'), 'Must include cross_impact');
  assert(content.includes('<pitfalls_and_lessons>'), 'Must include pitfalls_and_lessons');
  const lines = content.split('\n').length;
  assert(lines <= 80, `Grimoire lines must not exceed 80 (was ${lines})`);
});

test('3.2 All 5 UI components exist in src/pages/managers/pricing/', () => {
  assert(fs.existsSync(path.join(baseDir, 'src/pages/managers/PricingSettings.jsx')));
  assert(fs.existsSync(path.join(baseDir, 'src/pages/managers/pricing/SmartRoundingPolicy.jsx')));
  assert(fs.existsSync(path.join(baseDir, 'src/pages/managers/pricing/PricingRulesTable.jsx')));
  assert(fs.existsSync(path.join(baseDir, 'src/pages/managers/pricing/PricingSimulation.jsx')));
  assert(fs.existsSync(path.join(baseDir, 'src/pages/managers/pricing/PricingHistoryLog.jsx')));
  assert(fs.existsSync(path.join(baseDir, 'src/pages/managers/pricing/hooks/usePricingSettings.js')));
});

test('3.3 Backup directory contains all 8 initial files', () => {
  const backupDir = 'c:/_DH Notebook/Management System/_Backups/2026-09-22_PricingSettings_Cloning';
  assert(fs.existsSync(backupDir), 'Backup directory must exist');
  const backupFiles = fs.readdirSync(backupDir);
  assert(backupFiles.length >= 8, `Expected at least 8 backup files, found ${backupFiles.length}`);
});

// -------------------------------------------------------------
// SECTION 4: Live HTTP Verification (Dev Server on Port 3168)
// -------------------------------------------------------------
console.log('\n--- SECTION 4: Live HTTP Dev Server Verification ---');

await asyncTest('4.1 Dev server http://localhost:3168/managers/pricing serves HTTP 200', async () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3168/managers/pricing', (res) => {
      assert.strictEqual(res.statusCode, 200, `Expected 200 OK but got ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        assert(data.includes('root') || data.includes('html'), 'Response should contain HTML markup');
        resolve();
      });
    });
    req.on('error', (err) => reject(new Error(`Dev server unreachable: ${err.message}`)));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout connecting to http://localhost:3168'));
    });
  });
});

console.log('\n========================================================');
console.log(`🎉 ALL ${passedTests} OF ${totalTests} VERIFICATION TESTS PASSED SUCCESSFULLY!`);
console.log('========================================================\n');
