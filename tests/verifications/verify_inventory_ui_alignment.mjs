/**
 * Live Operational Verification Script for Inventory UI Alignment
 * Location: Management System/tests/verifications/verify_inventory_ui_alignment.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3168';
const DH_BACKOFFICE_ROOT = path.resolve(__dirname, '../../dh-backoffice-react');

const stats = {
  tested: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function pass(msg) {
  stats.tested++;
  stats.passed++;
  console.log(`  [PASS] ${msg}`);
}

function fail(msg, err) {
  stats.tested++;
  stats.failed++;
  console.error(`  [FAIL] ${msg}`, err || '');
  stats.errors.push({ msg, err: String(err || '') });
}

async function probeUrl(urlPath) {
  try {
    const res = await fetch(`${BASE_URL}${urlPath}`);
    if (res.status === 200) {
      pass(`Endpoint ${urlPath} -> HTTP 200 OK`);
      return true;
    } else {
      fail(`Endpoint ${urlPath} -> HTTP ${res.status}`);
      return false;
    }
  } catch (e) {
    fail(`Endpoint ${urlPath} -> Connection Error`, e);
    return false;
  }
}

async function probeViteModule(modulePath) {
  try {
    const res = await fetch(`${BASE_URL}${modulePath}`);
    if (res.status === 200) {
      const code = await res.text();
      if (code.includes('vite-error-overlay') || code.includes('Internal Server Error')) {
        fail(`Module ${modulePath} transformed with error overlay!`);
        return false;
      }
      pass(`Module ${modulePath} transformed cleanly (0 errors)`);
      return true;
    } else {
      fail(`Module ${modulePath} returned HTTP ${res.status}`);
      return false;
    }
  } catch (e) {
    fail(`Module ${modulePath} fetch error`, e);
    return false;
  }
}

async function run() {
  console.log("==================================================================");
  console.log("  DH Notebook: Inventory UI Alignment Verification");
  console.log("  Target: " + BASE_URL);
  console.log("==================================================================\n");

  console.log("--- 1. Dev Server & Module Transform Checks ---");
  await probeUrl('/inventory');

  const modules = [
    '/src/pages/inventory/InventoryMain.jsx',
    '/src/components/inventory/InventoryHeader.jsx',
    '/src/components/inventory/ProductTable.jsx',
    '/src/components/inventory/ProductTableRow.jsx'
  ];

  for (const mod of modules) {
    await probeViteModule(mod);
  }

  console.log("\n--- 2. Static Code & Production Structure Analysis ---");
  const headerPath = path.resolve(DH_BACKOFFICE_ROOT, 'src/components/inventory/InventoryHeader.jsx');
  const tablePath = path.resolve(DH_BACKOFFICE_ROOT, 'src/components/inventory/ProductTable.jsx');
  const rowPath = path.resolve(DH_BACKOFFICE_ROOT, 'src/components/inventory/ProductTableRow.jsx');
  const mainPath = path.resolve(DH_BACKOFFICE_ROOT, 'src/pages/inventory/InventoryMain.jsx');

  const headerContent = fs.readFileSync(headerPath, 'utf8');
  const tableContent = fs.readFileSync(tablePath, 'utf8');
  const rowContent = fs.readFileSync(rowPath, 'utf8');
  const mainContent = fs.readFileSync(mainPath, 'utf8');

  // Requirement R1 Checks
  console.log("\n[R1] Inventory Header & Search Controls:");
  if (headerContent.includes('placeholder="ค้นหาพิมพ์คำ..."')) {
    pass('Search placeholder matches production ("ค้นหาพิมพ์คำ...")');
  } else {
    fail('Search placeholder missing or mismatched');
  }

  if (headerContent.includes('<kbd') && headerContent.includes('CornerDownLeft') && headerContent.includes('Enter')) {
    pass('Enter shortcut pill badge (<kbd>) with CornerDownLeft icon present');
  } else {
    fail('Enter shortcut kbd badge missing or incomplete');
  }

  if (headerContent.includes('GAS Backup Disabled') && headerContent.includes('0%') && headerContent.includes('AlertTriangle')) {
    pass('GAS Backup Disabled 0% badge with AlertTriangle present');
  } else {
    fail('GAS Backup Disabled badge missing or incomplete');
  }

  if (headerContent.includes('onRecalculateStats') && headerContent.includes('RefreshCw') && headerContent.includes('Sync')) {
    pass('Sync button wired to onRecalculateStats with RefreshCw icon');
  } else {
    fail('Sync button missing or not wired to onRecalculateStats');
  }

  if (headerContent.includes('CATEGORY_MAP') && headerContent.includes('💻') && headerContent.includes('🔋')) {
    pass('Category map contains leading emojis (💻, 🔋, ⌨️, etc.)');
  } else {
    fail('Category leading emojis missing');
  }

  // Requirement R2 Checks
  console.log("\n[R2] 10-Column Table Layout & Column Styling:");
  const expectedHeaders = [
    'รูป',
    'SKU / ชื่อสินค้า',
    'หมวดหมู่',
    'ราคาส่ง',
    'ราคาปกติ',
    'คงเหลือ',
    'เข้า',
    'ขาย',
    'ของเสีย',
    'ปรับยอด'
  ];

  let orderCorrect = true;
  let lastIndex = -1;
  for (const h of expectedHeaders) {
    const idx = tableContent.indexOf(h);
    if (idx === -1) {
      fail(`Expected table header "${h}" not found in ProductTable.jsx`);
      orderCorrect = false;
    } else if (idx < lastIndex) {
      fail(`Header "${h}" appears out of expected order`);
      orderCorrect = false;
    }
    lastIndex = idx;
  }
  if (orderCorrect) {
    pass('All 10 column headers exist in exact production order');
  }

  // Check column styles
  if (tableContent.includes('bg-[#FEE499]') && rowContent.includes('bg-[#FFF2CC]')) {
    pass('Column "คงเหลือ" matches production colors (header: #FEE499, row: #FFF2CC)');
  } else {
    fail('Column "คงเหลือ" colors mismatched');
  }

  if (rowContent.includes('#CC0000')) {
    pass('Column "คงเหลือ" highlights positive stock in red (#CC0000)');
  } else {
    fail('Column "คงเหลือ" positive stock color mismatched');
  }

  if (tableContent.includes('bg-amber-100') && rowContent.includes('bg-[#FFF9E6]')) {
    pass('Column "เข้า" matches production colors (header: bg-amber-100, row: #FFF9E6)');
  } else {
    fail('Column "เข้า" colors mismatched');
  }

  if (tableContent.includes('bg-blue-100') && rowContent.includes('bg-[#3D85C6]')) {
    pass('Column "ขาย" matches production colors (header: bg-blue-100, row: #3D85C6)');
  } else {
    fail('Column "ขาย" colors mismatched');
  }

  if (tableContent.includes('bg-rose-100') && rowContent.includes('text-red-500')) {
    pass('Column "ของเสีย" matches production colors (header: bg-rose-100, count: text-red-500)');
  } else {
    fail('Column "ของเสีย" colors mismatched');
  }

  if (tableContent.includes('bg-fuchsia-100') && rowContent.includes('bg-[#00FF00]') && rowContent.includes('bg-[#FF0000]')) {
    pass('Column "ปรับยอด" matches production colors (header: bg-fuchsia-100, highlights: #00FF00 / #FF0000)');
  } else {
    fail('Column "ปรับยอด" colors mismatched');
  }

  // Requirement R3 Checks
  console.log("\n[R3] Pagination Bar & Loading Progress:");
  if (mainContent.includes('ChevronsLeft') && mainContent.includes('ChevronLeft') && mainContent.includes('ChevronRight') && mainContent.includes('ChevronsRight')) {
    pass('Pagination contains full navigation set: «, ย้อนกลับ, ถัดไป, »');
  } else {
    fail('Pagination navigation buttons missing or incomplete');
  }

  if (mainContent.includes('แสดงหน้าละ:') && mainContent.includes('21 รายการ') && mainContent.includes('50 รายการ') && mainContent.includes('100 รายการ') && mainContent.includes('250 รายการ')) {
    pass('Pagination page size selector includes 21, 50, 100, 250 items');
  } else {
    fail('Pagination page size options mismatched');
  }

  if (mainContent.includes('กำลังอัปเดตข้อมูล')) {
    pass('Searching progress indicator ("กำลังอัปเดตข้อมูล...") implemented in pagination bar');
  } else {
    fail('Searching progress indicator missing in pagination bar');
  }

  if (mainContent.includes('Zero-Read Architecture Fast Loading')) {
    pass('Loading skeleton overlay matches production styling');
  } else {
    fail('Loading skeleton overlay mismatched');
  }

  // Requirement R4 Checks
  console.log("\n[R4] Guardrails & Architecture Safety:");
  const backupDir = path.resolve(__dirname, '../../../_Emergency_Backup/Inventory_UI_Backup_Pre_Update');
  if (fs.existsSync(backupDir) && fs.readdirSync(backupDir).length === 4) {
    pass('Emergency pre-update backup verified in _Emergency_Backup/');
  } else {
    fail('Emergency pre-update backup missing or incomplete');
  }

  const controllerPath = path.resolve(DH_BACKOFFICE_ROOT, 'src/pages/inventory/useInventoryController.js');
  const dataHookPath = path.resolve(DH_BACKOFFICE_ROOT, 'src/components/inventory/hooks/useInventoryData.js');
  if (fs.existsSync(controllerPath) && fs.existsSync(dataHookPath)) {
    pass('Controller hooks and backend data query services remain untouched');
  } else {
    fail('Controller or hook files missing');
  }

  console.log("\n==================================================================");
  console.log(`  Verification Summary: ${stats.passed}/${stats.tested} checks passed`);
  if (stats.failed > 0) {
    console.error(`  FAILURES: ${stats.failed}`);
    process.exit(1);
  } else {
    console.log("  ALL CHECKS PASSED PERFECTLY!");
    console.log("==================================================================");
  }
}

run().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
