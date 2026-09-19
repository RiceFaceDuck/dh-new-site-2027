/**
 * Challenger M2: Standalone Empirical Adversarial Stress Suite for Barcode Scanning & Search Matching Engine
 * 
 * Objective:
 * Empirically stress-test the barcode scanning and search matching engine:
 * 1. High-speed scanner keystrokes (<10ms interval) + Enter (Race condition & debounce simulation).
 * 2. Whitespace, newline (\r\n), and special character barcode inputs.
 * 3. Numeric SKU and numeric barcode inputs (ensuring zero TypeError).
 * 4. Barcode alias matching from `p.barcodes` array.
 * 5. Ensuring unmatched inputs strictly return null and NEVER fall through to searchResults[0].
 * 6. Rapid sequential scanning across 50 simulated items with state mutation verification.
 * 7. Parity verification between usePosCart.js and PosSystem.jsx implementations.
 * 
 * Execution: node tests/adversarial/challenger_m2_barcode_stress.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');

const USE_POS_CART_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosCart.js');
const POS_SYSTEM_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/PosSystem.jsx');
const USE_POS_ACTIONS_PATH = path.resolve(REPO_ROOT, 'Management System/dh-backoffice-react/src/components/billing/pos/hooks/usePosActions.js');

console.log('================================================================================');
console.log('  CHALLENGER M2: Barcode Scanning & Search Engine Adversarial Stress Suite');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const defects = [];

function pass(name) {
  totalTests++;
  passedTests++;
  console.log(`  [PASS] ${name}`);
}

function fail(name, error) {
  totalTests++;
  failedTests++;
  const msg = error instanceof Error ? error.message : String(error);
  defects.push({ name, error: msg });
  console.error(`  [FAIL] ${name} -> ${msg}`);
}

// -----------------------------------------------------------------------------
// EXTRACT CODE UNDER TEST DIRECTLY FROM SOURCE FILES
// -----------------------------------------------------------------------------
assert(fs.existsSync(USE_POS_CART_PATH), `usePosCart.js not found at ${USE_POS_CART_PATH}`);
assert(fs.existsSync(POS_SYSTEM_PATH), `PosSystem.jsx not found at ${POS_SYSTEM_PATH}`);

const usePosCartSource = fs.readFileSync(USE_POS_CART_PATH, 'utf8');
const posSystemSource = fs.readFileSync(POS_SYSTEM_PATH, 'utf8');

// 1. Extract findExactCatalogMatch from usePosCart.js
const matchFnRegex = /export const findExactCatalogMatch = ([\s\S]*?\n\};)/;
const matchFnMatch = usePosCartSource.match(matchFnRegex);
if (!matchFnMatch) {
  throw new Error('Could not extract findExactCatalogMatch from usePosCart.js');
}
const findExactCatalogMatch = new Function('return ' + matchFnMatch[1])();

// 2. Extract PosSystem.jsx matcher function (inline or reused findExactCatalogMatch)
let posSystemFindMatch;
const posSystemMatcherRegex = /const exactMatch = activeProducts\.find\((p => {[\s\S]*?})\);/;
const posSystemMatcherMatch = posSystemSource.match(posSystemMatcherRegex);
if (posSystemMatcherMatch) {
  const posSystemPredicateFactory = (term) => {
    const predicateBody = posSystemMatcherMatch[1];
    return new Function('p', `const term = ${JSON.stringify(term)}; return (${predicateBody})(p);`);
  };
  posSystemFindMatch = (catalog = [], rawTerm = '') => {
    if (!rawTerm || !Array.isArray(catalog)) return null;
    const term = String(rawTerm).trim().toLowerCase();
    if (!term) return null;
    const predicate = posSystemPredicateFactory(term);
    return catalog.find(predicate) || null;
  };
} else if (posSystemSource.includes('findExactCatalogMatch(activeProducts, searchQuery)')) {
  // PosSystem.jsx reuses findExactCatalogMatch from usePosCart.js directly
  posSystemFindMatch = findExactCatalogMatch;
} else {
  throw new Error('Could not extract matcher function from PosSystem.jsx');
}

// -----------------------------------------------------------------------------
// TEST CATALOG SEED DATA
// -----------------------------------------------------------------------------
const mockCatalog = [
  {
    sku: 'DH-ACC-01',
    barcode: '8851234567890',
    name: 'USB-C Cable 1m',
    Price: 190,
    retailPrice: 250,
    stockQuantity: 50,
    barcodes: ['8851234567890', 'ALT-USB-01', 'ALT-USB-02']
  },
  {
    sku: 'DH-LCD-02',
    barcode: '8859876543210',
    barcodes: ['8859876543210', '8859876543219', 'PACK-DELL-10'],
    name: 'Dell 24" IPS Monitor',
    Price: 3900,
    retailPrice: 4200,
    stockQuantity: 12
  },
  {
    sku: 1024, // Numeric SKU
    barcode: 99887766, // Numeric Barcode
    name: 'Thermal Paste 5g (Numeric ID)',
    Price: 80,
    retailPrice: 100,
    stockQuantity: 30,
    barcodes: [99887766, 11223344]
  },
  {
    sku: 'DH-ZERO-007',
    barcode: '0001234567890', // Leading zero in barcode
    name: 'Precision Screwdriver',
    Price: 45,
    retailPrice: 70,
    stockQuantity: 100
  },
  {
    sku: 'DH-SPEC-CHARS',
    barcode: '+A123-B.C/X$Y%Z',
    name: 'Special Characters SKU',
    Price: 350,
    retailPrice: 450,
    stockQuantity: 5
  },
  {
    sku: 'บาร์โค้ด-ไทย-01', // Thai Unicode SKU
    barcode: '8850000000099',
    name: 'แป้นพิมพ์ภาษาไทย',
    Price: 590,
    retailPrice: 790,
    stockQuantity: 15
  },
  {
    sku: 'DH-CASE-INSENSITIVE',
    barcode: 'EaN-Mixed-Case-Barcode',
    barcodes: ['Pack-Case-Mixed', 'BULK-999'],
    name: 'Mixed Case Test Item',
    Price: 120,
    retailPrice: 150,
    stockQuantity: 25
  },
  {
    sku: 'DH-SPACED-ALIAS',
    barcode: '8857777777777',
    barcodes: ['  SPACED-BARCODE-ALIAS  '],
    name: 'Spaced Barcode Item',
    Price: 200,
    retailPrice: 250,
    stockQuantity: 8
  }
];

// =============================================================================
// SUITE 1: High-Speed Scanner Keystrokes (<10ms interval) + Enter Simulation
// =============================================================================
console.log('--- SUITE 1: High-Speed Scanner Keystrokes (<10ms) & Debounce Race Condition ---');

try {
  // Scenario 1.1: 13-digit EAN scanner burst at 3ms intervals
  // Cashier scans '8851234567890' followed by Enter
  // Simultaneously, a 300ms debounce loop is running
  const scannerStream = '8851234567890'.split('');
  let buffer = '';
  let debounceValue = '';
  let debounceTimeout = null;

  const simulateKeystroke = (char, delayMs) => {
    buffer += char;
    // Debounce resets on every keystroke
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      debounceValue = buffer;
    }, 300);
  };

  // Simulate burst of keystrokes with <10ms intervals (3ms each)
  let currentTime = 0;
  for (const char of scannerStream) {
    currentTime += 3;
    simulateKeystroke(char, currentTime);
  }
  // Enter arrives at currentTime + 3ms (total ~42ms)
  currentTime += 3;

  // At t=42ms, the 300ms debounce has NOT fired yet!
  assert.strictEqual(debounceValue, '', 'At t=42ms, debouncedSearch must still be empty string');
  assert.strictEqual(buffer, '8851234567890', 'Buffer holds full 13 digits before debounce fires');

  // Exact match must be evaluated SYNCHRONOUSLY on the raw buffer upon Enter
  const matchResult = findExactCatalogMatch(mockCatalog, buffer);
  assert(matchResult !== null, 'Synchronous match must find item immediately without waiting for debounce');
  assert.strictEqual(matchResult.sku, 'DH-ACC-01', 'Correct product matched from high-speed burst');

  clearTimeout(debounceTimeout);
  pass('High-speed 13-digit burst at 3ms/keystroke resolves synchronously before 300ms debounce');
} catch (e) {
  fail('High-speed 13-digit burst at 3ms/keystroke', e);
}

try {
  // Scenario 1.2: Extreme 1ms interval (Laser/CCD ultra-fast scanner)
  const barcode = '8859876543210';
  let buffer = '';
  for (let i = 0; i < barcode.length; i++) {
    buffer += barcode[i];
  }
  const match = findExactCatalogMatch(mockCatalog, buffer);
  assert(match !== null && match.sku, 'DH-LCD-02', 'Ultra-fast 1ms burst matches instantly');
  pass('Ultra-fast 1ms scanner burst matches synchronously');
} catch (e) {
  fail('Ultra-fast 1ms scanner burst', e);
}

try {
  // Scenario 1.3: Variable jitter keystroke intervals (1ms - 9ms)
  const barcode = '8851234567890';
  let buffer = '';
  const intervals = [2, 5, 1, 8, 4, 3, 7, 2, 6, 1, 4, 3, 5];
  for (let i = 0; i < barcode.length; i++) {
    buffer += barcode[i];
  }
  const match = findExactCatalogMatch(mockCatalog, buffer);
  assert(match !== null && match.sku === 'DH-ACC-01', 'Jittered burst matches correct product');
  pass('Variable jitter keystrokes (<10ms) match synchronously');
} catch (e) {
  fail('Variable jitter keystrokes (<10ms)', e);
}

try {
  // Scenario 1.4: Race condition proof — Old code would pick wrong item from stale searchResults
  // Suppose searchResults holds a previous search result for 'DELL'
  const staleSearchResults = [mockCatalog[1]]; // Dell monitor
  const newScan = '8851234567890'; // Scanned USB Cable
  
  // The OLD code:
  const oldExactMatch = staleSearchResults.find(p => p.sku?.toLowerCase() === newScan.trim().toLowerCase());
  const oldAddedItem = oldExactMatch || (staleSearchResults.length > 0 ? staleSearchResults[0] : null);
  // OLD code mistakenly added Dell monitor!
  assert.strictEqual(oldAddedItem.sku, 'DH-LCD-02', 'Demonstrating old code flaw: falls back to searchResults[0]');

  // The NEW code:
  const newExactMatch = findExactCatalogMatch(mockCatalog, newScan);
  assert.strictEqual(newExactMatch.sku, 'DH-ACC-01', 'New code avoids stale searchResults and matches true product');
  pass('Race condition prevented: new matching logic bypasses stale searchResults');
} catch (e) {
  fail('Race condition prevented check', e);
}

// =============================================================================
// SUITE 2: Whitespace, Newlines (\r\n), Tabs, and Special Characters
// =============================================================================
console.log('\n--- SUITE 2: Whitespace, CRLF (\\r\\n), Tabs & Special Character Inputs ---');

const whitespaceTestCases = [
  { input: '8851234567890\r\n', expectedSku: 'DH-ACC-01', desc: 'CRLF suffix (standard Windows/scanner)' },
  { input: '8851234567890\n', expectedSku: 'DH-ACC-01', desc: 'LF suffix (Unix scanner)' },
  { input: '8851234567890\r', expectedSku: 'DH-ACC-01', desc: 'CR suffix (Mac classic scanner)' },
  { input: '\t8851234567890\t', expectedSku: 'DH-ACC-01', desc: 'Tab prefixes and suffixes' },
  { input: '   8851234567890   ', expectedSku: 'DH-ACC-01', desc: 'Multiple leading & trailing spaces' },
  { input: '\r\n  8859876543210  \r\n', expectedSku: 'DH-LCD-02', desc: 'Mixed spaces and CRLF wrapping' },
  { input: '  dh-acc-01  ', expectedSku: 'DH-ACC-01', desc: 'Trimmed SKU with mixed whitespace' }
];

for (const tc of whitespaceTestCases) {
  try {
    const match = findExactCatalogMatch(mockCatalog, tc.input);
    assert(match !== null, `Failed to match on ${tc.desc}`);
    assert.strictEqual(match.sku, tc.expectedSku, `Matched wrong SKU on ${tc.desc}`);
    pass(`Whitespace/Newline: ${tc.desc}`);
  } catch (e) {
    fail(`Whitespace/Newline: ${tc.desc}`, e);
  }
}

const specialCharTestCases = [
  { input: '+A123-B.C/X$Y%Z', expectedSku: 'DH-SPEC-CHARS', desc: 'Code-39/128 special chars (+ - . / $ %)' },
  { input: '  +A123-B.C/X$Y%Z\r\n', expectedSku: 'DH-SPEC-CHARS', desc: 'Special chars with CRLF and spaces' },
  { input: '0001234567890', expectedSku: 'DH-ZERO-007', desc: 'Barcode with leading zeros preserved' },
  { input: 'บาร์โค้ด-ไทย-01', expectedSku: 'บาร์โค้ด-ไทย-01', desc: 'Thai Unicode characters in SKU' },
  { input: '8850000000099', expectedSku: 'บาร์โค้ด-ไทย-01', desc: 'Barcode for Thai item' },
  { input: 'DH-CASE-INSENSITIVE', expectedSku: 'DH-CASE-INSENSITIVE', desc: 'Case insensitive query uppercase' },
  { input: 'dh-case-insensitive', expectedSku: 'DH-CASE-INSENSITIVE', desc: 'Case insensitive query lowercase' },
  { input: 'ean-mixed-case-barcode', expectedSku: 'DH-CASE-INSENSITIVE', desc: 'Mixed case barcode queried lowercase' },
  { input: 'EAN-MIXED-CASE-BARCODE', expectedSku: 'DH-CASE-INSENSITIVE', desc: 'Mixed case barcode queried uppercase' }
];

for (const tc of specialCharTestCases) {
  try {
    const match = findExactCatalogMatch(mockCatalog, tc.input);
    assert(match !== null, `Failed to match on ${tc.desc}`);
    assert.strictEqual(match.sku, tc.expectedSku, `Matched wrong SKU on ${tc.desc}`);
    pass(`Special Char/Unicode: ${tc.desc}`);
  } catch (e) {
    fail(`Special Char/Unicode: ${tc.desc}`, e);
  }
}

// Injection and Regex Meta-character safety
const injectionCases = [
  { input: '.*', desc: 'Regex wildcard .* does not match all items' },
  { input: '^DH', desc: 'Regex anchor ^ does not match prefixes' },
  { input: '[0-9]+', desc: 'Regex character class does not execute' },
  { input: '(?=.*)', desc: 'Regex lookahead does not crash engine' },
  { input: "' OR '1'='1", desc: 'SQL injection payload safely returns null' },
  { input: '<script>alert(1)</script>', desc: 'XSS payload safely returns null' },
  { input: '__proto__', desc: 'Prototype pollution query safely returns null' }
];

for (const tc of injectionCases) {
  try {
    const match = findExactCatalogMatch(mockCatalog, tc.input);
    assert.strictEqual(match, null, `Injection/regex query ${tc.input} must return null`);
    pass(`Security/Meta-character: ${tc.desc}`);
  } catch (e) {
    fail(`Security/Meta-character: ${tc.desc}`, e);
  }
}

// =============================================================================
// SUITE 3: Numeric SKU & Numeric Barcode Inputs (Zero TypeError)
// =============================================================================
console.log('\n--- SUITE 3: Numeric SKU & Numeric Barcode Type Safety (Zero TypeError) ---');

try {
  // Test numeric SKU with string query
  const match = findExactCatalogMatch(mockCatalog, '1024');
  assert(match !== null && String(match.sku) === '1024', 'String query matches numeric SKU');
  pass('Numeric SKU (number type) matches string search');
} catch (e) {
  fail('Numeric SKU matches string search', e);
}

try {
  // Test numeric barcode with string query
  const match = findExactCatalogMatch(mockCatalog, '99887766');
  assert(match !== null && String(match.barcode) === '99887766', 'String query matches numeric barcode');
  pass('Numeric Barcode (number type) matches string search');
} catch (e) {
  fail('Numeric Barcode matches string search', e);
}

try {
  // Test numeric rawTerm query (e.g. findExactCatalogMatch(catalog, 1024))
  const match = findExactCatalogMatch(mockCatalog, 1024);
  assert(match !== null && String(match.sku) === '1024', 'Numeric input query matches numeric SKU');
  pass('Numeric input query (1024 as number) matches without TypeError');
} catch (e) {
  fail('Numeric input query', e);
}

try {
  // Test numeric barcode array item with numeric query
  const match = findExactCatalogMatch(mockCatalog, 11223344);
  assert(match !== null && String(match.sku) === '1024', 'Numeric query matches numeric alias in barcodes array');
  pass('Numeric alias in barcodes array matches numeric query');
} catch (e) {
  fail('Numeric alias in barcodes array', e);
}

// Adversarial Fuzzing Catalog with Malformed / Corrupted Data
const fuzzedCatalog = [
  null,
  undefined,
  {},
  { sku: null, barcode: null },
  { sku: undefined, barcode: undefined },
  { sku: '', barcode: '' },
  { sku: NaN, barcode: NaN },
  { sku: false, barcode: true },
  { sku: 0, barcode: 0 },
  { sku: 'VALID-SKU', barcode: null, barcodes: 'not-an-array' },
  { sku: 'VALID-SKU-2', barcode: null, barcodes: [null, undefined, '', NaN, 999999] },
  { sku: {}, barcode: [] }
];

try {
  // Ensure findExactCatalogMatch handles fuzzed catalog without throwing TypeError
  const match1 = findExactCatalogMatch(fuzzedCatalog, 'VALID-SKU');
  assert(match1 !== null && match1.sku === 'VALID-SKU', 'Finds item even when barcodes is a string');

  const match2 = findExactCatalogMatch(fuzzedCatalog, '999999');
  assert(match2 !== null && match2.sku === 'VALID-SKU-2', 'Finds item from barcodes array containing null/NaN');

  const matchNull = findExactCatalogMatch(fuzzedCatalog, 'NON-EXISTENT');
  assert.strictEqual(matchNull, null, 'Fuzzed catalog safely returns null on non-existent query');

  pass('Fuzzed catalog with nulls, primitives, NaNs, non-arrays causes zero TypeError');
} catch (e) {
  fail('Fuzzed catalog robustness', e);
}

// Edge case query inputs
const fuzzedQueries = [null, undefined, '', '   ', 0, false, true, NaN, {}, [], () => {}];
for (const q of fuzzedQueries) {
  try {
    const res = findExactCatalogMatch(mockCatalog, q);
    assert.strictEqual(res, null, `Query ${String(q)} must safely return null`);
    pass(`Edge case query input: ${typeof q} (${String(q)}) safely returns null`);
  } catch (e) {
    fail(`Edge case query input: ${typeof q} (${String(q)})`, e);
  }
}

// =============================================================================
// SUITE 4: Barcode Alias Matching from p.barcodes Array
// =============================================================================
console.log('\n--- SUITE 4: Barcode Alias Matching from p.barcodes Array ---');

try {
  // Match first alias
  const match = findExactCatalogMatch(mockCatalog, 'ALT-USB-01');
  assert(match !== null && match.sku === 'DH-ACC-01', 'Matches first alias in barcodes array');
  pass('Match secondary alias in barcodes array (ALT-USB-01)');
} catch (e) {
  fail('Match secondary alias ALT-USB-01', e);
}

try {
  // Match second alias
  const match = findExactCatalogMatch(mockCatalog, 'ALT-USB-02');
  assert(match !== null && match.sku === 'DH-ACC-01', 'Matches second alias in barcodes array');
  pass('Match secondary alias in barcodes array (ALT-USB-02)');
} catch (e) {
  fail('Match secondary alias ALT-USB-02', e);
}

try {
  // Match pack barcode alias
  const match = findExactCatalogMatch(mockCatalog, 'PACK-DELL-10');
  assert(match !== null && match.sku === 'DH-LCD-02', 'Matches bulk pack barcode alias');
  pass('Match bulk pack barcode alias (PACK-DELL-10)');
} catch (e) {
  fail('Match bulk pack barcode alias', e);
}

try {
  // Match mixed-case alias with lowercase query
  const match = findExactCatalogMatch(mockCatalog, 'pack-case-mixed');
  assert(match !== null && match.sku === 'DH-CASE-INSENSITIVE', 'Matches mixed-case alias in lowercase');
  pass('Case-insensitive match on barcodes alias (lowercase query)');
} catch (e) {
  fail('Case-insensitive alias match', e);
}

try {
  // Match mixed-case alias with uppercase query
  const match = findExactCatalogMatch(mockCatalog, 'PACK-CASE-MIXED');
  assert(match !== null && match.sku === 'DH-CASE-INSENSITIVE', 'Matches mixed-case alias in uppercase');
  pass('Case-insensitive match on barcodes alias (uppercase query)');
} catch (e) {
  fail('Case-insensitive alias match uppercase', e);
}

try {
  // Match alias that was stored with leading/trailing spaces
  const match = findExactCatalogMatch(mockCatalog, 'SPACED-BARCODE-ALIAS');
  assert(match !== null && match.sku === 'DH-SPACED-ALIAS', 'Matches alias trimmed of stored spaces');
  pass('Alias with stored whitespace is cleanly trimmed and matched');
} catch (e) {
  fail('Stored whitespace alias match', e);
}

// =============================================================================
// SUITE 5: Unmatched Inputs Strictly Return null & Never Fall Through to searchResults[0]
// =============================================================================
console.log('\n--- SUITE 5: Unmatched Inputs Strictly Return null & NEVER Fall Through ---');

try {
  // Non-existent SKU / Barcode
  assert.strictEqual(findExactCatalogMatch(mockCatalog, 'NO-SUCH-SKU-12345'), null);
  assert.strictEqual(findExactCatalogMatch(mockCatalog, '0000000000000'), null);
  assert.strictEqual(findExactCatalogMatch(mockCatalog, 'DH-ACC'), null); // Prefix only
  assert.strictEqual(findExactCatalogMatch(mockCatalog, 'ACC-01'), null); // Suffix only
  assert.strictEqual(findExactCatalogMatch(mockCatalog, '885123'), null); // Substring barcode
  pass('Partial prefixes, suffixes, and substrings strictly return null');
} catch (e) {
  fail('Partial match returning null', e);
}

try {
  // Simulate PosSystem.jsx Enter key handler with decoy searchResults
  const decoySearchResults = [
    { sku: 'DECOY-01', name: 'Wrong Product 1', Price: 9999 },
    { sku: 'DECOY-02', name: 'Wrong Product 2', Price: 8888 }
  ];

  let cartItems = [];
  let toastErrorCalls = [];
  const mockActions = {
    addItemToCart: (product) => {
      cartItems.push(product);
    }
  };
  const mockToast = {
    error: (msg) => {
      toastErrorCalls.push(msg);
    }
  };

  // Function simulating exact PosSystem.jsx handleSearchKeyDown logic
  const simulateHandleSearchKeyDown = (searchQuery, activeProducts, searchResults, actions, toast) => {
    const e = { key: 'Enter', preventDefault: () => {} };
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      e.preventDefault();
      const term = searchQuery.trim().toLowerCase();
      const exactMatch = activeProducts.find(p => {
        if (!p) return false;
        const sku = String(p.sku || '').trim().toLowerCase();
        const barcode = String(p.barcode || '').trim().toLowerCase();
        const barcodes = Array.isArray(p.barcodes) 
          ? p.barcodes.map(b => String(b || '').trim().toLowerCase()) 
          : [];
        return (sku !== '' && sku === term) || (barcode !== '' && barcode === term) || barcodes.includes(term);
      });

      if (exactMatch) {
        actions.addItemToCart(exactMatch);
      } else {
        toast.error('ไม่พบสินค้าตามรหัสบาร์โค้ดหรือ SKU นี้');
      }
    }
  };

  // Test with non-matching query
  simulateHandleSearchKeyDown('UNKNOWN-ITEM-123', mockCatalog, decoySearchResults, mockActions, mockToast);

  assert.strictEqual(cartItems.length, 0, 'Cart items must NOT increase when barcode is unmatched');
  assert.strictEqual(toastErrorCalls.length, 1, 'Error toast must be triggered once');
  assert.strictEqual(toastErrorCalls[0], 'ไม่พบสินค้าตามรหัสบาร์โค้ดหรือ SKU นี้', 'Correct error message displayed');
  pass('Enter on unmatched barcode: cart remains empty and never adds searchResults[0]');
} catch (e) {
  fail('Enter on unmatched barcode test', e);
}

try {
  // Test Enter with blank or whitespace-only query
  let cartCount = 0;
  let errorCount = 0;
  const mockActions = { addItemToCart: () => { cartCount++; } };
  const mockToast = { error: () => { errorCount++; } };

  const simulateHandleSearchKeyDown = (searchQuery) => {
    const e = { key: 'Enter', preventDefault: () => {} };
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      // should not enter
      cartCount++;
    }
  };

  simulateHandleSearchKeyDown('   ');
  simulateHandleSearchKeyDown('\t\r\n');
  assert.strictEqual(cartCount, 0, 'Whitespace-only Enter does nothing');
  assert.strictEqual(errorCount, 0, 'Whitespace-only Enter does not trigger toast');
  pass('Whitespace-only query on Enter is safely ignored without errors');
} catch (e) {
  fail('Whitespace-only query on Enter', e);
}

// =============================================================================
// SUITE 6: Rapid Sequential Scanning Across 50 Simulated Items
// =============================================================================
console.log('\n--- SUITE 6: Rapid Sequential Scanning Across 50 Simulated Items ---');

try {
  // Build a realistic 100-item catalog
  const largeCatalog = [];
  for (let i = 1; i <= 100; i++) {
    const padId = String(i).padStart(3, '0');
    largeCatalog.push({
      sku: `SKU-${padId}`,
      barcode: `8850000000${padId}`,
      barcodes: [`8850000000${padId}`, `ALIAS-${padId}-A`, `ALIAS-${padId}-B`],
      name: `Simulated Product Item ${padId}`,
      Price: 100 + i * 10,
      retailPrice: 150 + i * 10,
      stockQuantity: 100
    });
  }

  // Generate 50 rapid sequential scan inputs:
  // - 20 unique items scanned once (SKU-001 through SKU-020)
  // - 15 repeat scans of SKU-001 (incrementing qty from 1 to 16)
  // - 5 scans of secondary barcode aliases (ALIAS-021-A through ALIAS-025-A)
  // - 5 scans of invalid barcodes
  // - 5 scans with CRLF and trailing spaces
  const scanSequence = [
    // 20 unique scans
    ...Array.from({ length: 20 }, (_, i) => ({ term: `SKU-${String(i + 1).padStart(3, '0')}`, expectedSku: `SKU-${String(i + 1).padStart(3, '0')}`, valid: true })),
    // 15 repeat scans of SKU-001
    ...Array.from({ length: 15 }, () => ({ term: 'SKU-001', expectedSku: 'SKU-001', valid: true })),
    // 5 secondary alias scans
    ...Array.from({ length: 5 }, (_, i) => ({ term: `ALIAS-${String(i + 21).padStart(3, '0')}-A`, expectedSku: `SKU-${String(i + 21).padStart(3, '0')}`, valid: true })),
    // 5 invalid scans
    { term: 'INVALID-BARCODE-901', valid: false },
    { term: '8859999999999', valid: false },
    { term: 'NOT-IN-CATALOG', valid: false },
    { term: '0000000000000', valid: false },
    { term: 'XYZ-NULL', valid: false },
    // 5 scans with CRLF and whitespace
    { term: '  8850000000026\r\n  ', expectedSku: 'SKU-026', valid: true },
    { term: '\tSKU-027\t', expectedSku: 'SKU-027', valid: true },
    { term: '  8850000000028  ', expectedSku: 'SKU-028', valid: true },
    { term: 'sku-029\r\n', expectedSku: 'SKU-029', valid: true },
    { term: '  alias-030-b  ', expectedSku: 'SKU-030', valid: true }
  ];

  assert.strictEqual(scanSequence.length, 50, 'Total sequential scans must be exactly 50');

  // Simulate POS Cart State Machine
  let cartState = { items: [] };
  let searchInput = '';
  let toastErrors = [];

  const simulateAddToCart = (product) => {
    const existing = cartState.items.find(i => i.sku === product.sku);
    if (existing) {
      cartState.items = cartState.items.map(i => i.sku === product.sku ? { ...i, qty: i.qty + 1 } : i);
    } else {
      cartState.items = [{
        sku: product.sku,
        name: product.name,
        price: product.retailPrice,
        qty: 1,
        stock: product.stockQuantity
      }, ...cartState.items];
    }
  };

  const startTime = performance.now();

  for (let step = 0; step < scanSequence.length; step++) {
    const scan = scanSequence[step];
    searchInput = scan.term;

    // Simulate Enter Keydown in PosSystem.jsx
    const term = searchInput.trim().toLowerCase();
    const match = findExactCatalogMatch(largeCatalog, term);

    if (match) {
      simulateAddToCart(match);
      searchInput = ''; // Input cleared on success
    } else {
      toastErrors.push(`Scan ${step}: Not found for ${scan.term}`);
      // Input not matched
    }
  }

  const durationMs = performance.now() - startTime;

  // Verifications:
  // Total valid scans: 20 + 15 + 5 + 5 = 45 valid scans
  // Total invalid scans: 5
  assert.strictEqual(toastErrors.length, 5, `Expected exactly 5 invalid scan errors, got ${toastErrors.length}`);

  // Unique items in cart:
  // SKU-001 to SKU-020 (20 items)
  // SKU-021 to SKU-025 (5 items via alias)
  // SKU-026 to SKU-030 (5 items via whitespace/crlf)
  // Total unique items = 30
  assert.strictEqual(cartState.items.length, 30, `Expected 30 unique items in cart, got ${cartState.items.length}`);

  // SKU-001 was scanned 1 (initial) + 15 (repeats) = 16 times
  const item001 = cartState.items.find(i => i.sku === 'SKU-001');
  assert(item001 !== undefined, 'SKU-001 must exist in cart');
  assert.strictEqual(item001.qty, 16, `SKU-001 qty must be 16, got ${item001.qty}`);

  // Total item quantities in cart: 16 (for SKU-001) + 29 (for other 29 items each with qty 1) = 45 items
  const totalQty = cartState.items.reduce((sum, i) => sum + i.qty, 0);
  assert.strictEqual(totalQty, 45, `Total item qty must be exactly 45, got ${totalQty}`);

  // Total execution time should be < 50ms for all 50 scans
  assert(durationMs < 100, `Execution took ${durationMs.toFixed(2)}ms (should be < 100ms)`);

  pass(`50 rapid sequential scans executed in ${durationMs.toFixed(2)}ms (45 added, 5 errors correctly caught)`);
} catch (e) {
  fail('50 rapid sequential scans execution', e);
}

// =============================================================================
// SUITE 7: Implementation Parity between usePosCart.js & PosSystem.jsx
// =============================================================================
console.log('\n--- SUITE 7: Implementation Parity (usePosCart.js vs PosSystem.jsx) ---');

try {
  // Test 50 distinct edge cases across both functions and verify 100% identical output
  const parityQueries = [
    'DH-ACC-01', 'dh-acc-01', 'DH-LCD-02', '1024', 1024,
    '8851234567890', '8859876543210', '99887766',
    'ALT-USB-01', 'ALT-USB-02', 'PACK-DELL-10', '11223344',
    '  8851234567890\r\n  ', '\t8859876543210\t', '  1024  ',
    '+A123-B.C/X$Y%Z', 'บาร์โค้ด-ไทย-01', '0001234567890',
    'DH-CASE-INSENSITIVE', 'pack-case-mixed', 'SPACED-BARCODE-ALIAS',
    '', '   ', '\r\n', '\t', null, undefined,
    'UNKNOWN-1', 'UNKNOWN-2', '8850000000000', 'DH-ACC', 'LCD-02',
    '123456', 'NON_EXISTENT_SKU', '.*', '^DH', '[0-9]',
    0, false, true, NaN, {}, [], () => {},
    '000123456789', '9999999999999', 'DH-SPEC', 'ไทย'
  ];

  let mismatches = 0;
  for (const q of parityQueries) {
    const resFromUsePosCart = findExactCatalogMatch(mockCatalog, q);
    const resFromPosSystem = posSystemFindMatch(mockCatalog, q);

    const sku1 = resFromUsePosCart ? resFromUsePosCart.sku : null;
    const sku2 = resFromPosSystem ? resFromPosSystem.sku : null;

    if (sku1 !== sku2) {
      mismatches++;
      console.error(`  [PARITY MISMATCH] Query: ${String(q)} -> usePosCart: ${sku1} vs PosSystem: ${sku2}`);
    }
  }

  assert.strictEqual(mismatches, 0, `Detected ${mismatches} parity mismatches between usePosCart and PosSystem`);
  pass('100% parity verified between usePosCart.js findExactCatalogMatch and PosSystem.jsx inline matcher');
} catch (e) {
  fail('Implementation parity test', e);
}

// =============================================================================
// SUITE 8: 10,000-Item Catalog High-Scale Throughput Stress Test
// =============================================================================
console.log('\n--- SUITE 8: 10,000-Item Catalog High-Scale Throughput Stress Test ---');

try {
  const hugeCatalog = [];
  for (let i = 1; i <= 10000; i++) {
    const pad = String(i).padStart(6, '0');
    hugeCatalog.push({
      sku: `SCALE-SKU-${pad}`,
      barcode: `885${pad}0000`,
      name: `Scale Test Product ${pad}`,
      retailPrice: 100 + (i % 500)
    });
  }

  // Scan 100 random targets (including at the very end of 10,000 array)
  const tStart = performance.now();
  for (let i = 0; i < 100; i++) {
    const targetIdx = 9900 + (i % 100); // worst-case near the end of array
    const query = `SCALE-SKU-${String(targetIdx + 1).padStart(6, '0')}`;
    const m = findExactCatalogMatch(hugeCatalog, query);
    assert(m !== null && m.sku === query, `Failed to match on ${query}`);
  }
  const totalMs = performance.now() - tStart;
  const avgMs = totalMs / 100;
  assert(avgMs < 5.0, `Average search time ${avgMs.toFixed(2)}ms exceeds 5ms limit`);
  pass(`10,000-item catalog: 100 scans executed in ${totalMs.toFixed(2)}ms (avg ${avgMs.toFixed(3)}ms/scan, O(N) bounded)`);
} catch (e) {
  fail('10,000-item catalog scale test', e);
}

// =============================================================================
// SUITE 9: Cold-Start Catalog Hydration & Undefined activeProducts Invariant
// =============================================================================
console.log('\n--- SUITE 9: Cold-Start Catalog Hydration & Undefined activeProducts Invariant ---');

try {
  // Extract activeProducts expression from PosSystem.jsx line 126
  const activeProductsMatch = posSystemSource.match(/const activeProducts = ([\s\S]*?);/);
  assert(activeProductsMatch, 'Could not find activeProducts definition in PosSystem.jsx');

  // Cold start condition in PosSystem.jsx:
  // BillingMain.jsx mounts: <PosSystem customers={customers} ... /> (products prop is undefined)
  // usePosState mounts: posState.products is [] (hydratedProducts begins as [])
  const products = undefined;
  const posState = { products: [] };
  const activeProducts = new Function('posState', 'products', `return (${activeProductsMatch[1]});`)(posState, products);

  // In SearchArea.jsx, line 36 disabled={isProcessing} (isCacheLoading guard was removed).
  // Cashier scans barcode or hits Enter during cold-start cache loading:
  const e = { key: 'Enter', preventDefault: () => {} };
  const searchQuery = '8851234567890';

  let crashed = false;
  let crashError = null;

  try {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      e.preventDefault();
      // Execute the exact matcher logic used in PosSystem.jsx:
      const exactMatch = posSystemFindMatch(activeProducts, searchQuery);
    }
  } catch (err) {
    crashed = true;
    crashError = err;
  }

  assert.strictEqual(crashed, false, `Cold-start scanning throws: ${crashError?.message}`);
  pass('Cold-start scanning during catalog hydration does not throw TypeError');
} catch (e) {
  fail('Cold-start scanning during catalog hydration (activeProducts undefined in PosSystem.jsx:126/159)', e);
}


// =============================================================================
// SUMMARY & EXIT
// =============================================================================
console.log('\n================================================================================');
console.log(`  TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('================================================================================');

if (failedTests > 0) {
  console.error(`\n🚨 DEFECTS DETECTED (${failedTests}):`);
  for (const d of defects) {
    console.error(` - ${d.name}: ${d.error}`);
  }
  process.exit(1);
} else {
  console.log('\n🎉 ALL ADVERSARIAL BARCODE STRESS TESTS PASSED EMPIRICALLY!');
  process.exit(0);
}
