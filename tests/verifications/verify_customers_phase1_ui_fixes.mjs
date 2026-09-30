import fs from 'fs';
import path from 'path';

console.log('==================================================================');
console.log('  DH Notebook: Customers Phase 1 UI & Logic Verification Suite');
console.log('==================================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// 1. WalletDisplay currency symbol & table clean display
const walletFile = fs.readFileSync('dh-backoffice-react/src/pages/Customers/components/displays/WalletDisplay.jsx', 'utf8');
assert(walletFile.includes("const symbol = showSymbol ? '฿' : '';"), "WalletDisplay renders Thai Baht symbol ('฿') instead of ('$')");
assert(!walletFile.includes("const symbol = showSymbol ? '$' : '';"), "WalletDisplay no longer contains Dollar symbol ('$')");
assert(walletFile.includes("showSymbol = false"), "WalletDisplay defaults to showSymbol = false for clean table rendering");

const rowFile = fs.readFileSync('dh-backoffice-react/src/pages/Customers/components/layout/CustomerRow.jsx', 'utf8');
assert(!rowFile.includes("฿{sales30Days"), "CustomerRow eliminates ฿ symbol from 30D PAID OUT column");
assert(rowFile.includes("<WalletDisplay customerId={customerId} customer={customer} showSymbol={false} />"), "CustomerRow explicitly disables currency symbol for DH ค้างยอด column");

// 2. PointDisplay canonical points
const pointFile = fs.readFileSync('dh-backoffice-react/src/pages/Customers/components/displays/PointDisplay.jsx', 'utf8');
assert(!pointFile.includes("Math.floor(sales30Days / 100)"), "PointDisplay eliminated synthetic fictitious bonus points");
assert(pointFile.includes("totalAccumulatedPoints"), "PointDisplay relies on canonical totalAccumulatedPoints");

// 3. useCustomerFilters immutable date calculation & integration
const filterFile = fs.readFileSync('dh-backoffice-react/src/pages/Customers/hooks/useCustomerFilters.js', 'utf8');
assert(!filterFile.includes("now.setDate(now.getDate() - 30)"), "useCustomerFilters no longer mutates 'now' date object in place");
assert(filterFile.includes("const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;"), "useCustomerFilters uses immutable timestamp math for 30d cutoff");
assert(filterFile.includes("[searchTerm, quickFilter, dateFilter, customers]"), "useCustomerFilters includes dateFilter in useMemo dependencies");

// 4. customerOrderStatsService Thai keywords
const statsFile = fs.readFileSync('dh-backoffice-react/src/pages/Customers/services/customerOrderStatsService.js', 'utf8');
assert(statsFile.includes("'ยกเลิก'"), "customerOrderStatsService matches canonical Thai 'ยกเลิก'");
assert(statsFile.includes("'รอชำระ'"), "customerOrderStatsService matches canonical Thai 'รอชำระ'");
assert(statsFile.includes("'ชำระแล้ว'"), "customerOrderStatsService matches canonical Thai 'ชำระแล้ว'");
assert(!statsFile.includes("เธขเธ เน€เธฅเธดเธ "), "customerOrderStatsService has no Mojibake characters in isOrderPaid");

console.log('==================================================================');
console.log(`  Total Checks: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('==================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 1 UI & LOGIC CHECKS PASSED 100%!');
}
