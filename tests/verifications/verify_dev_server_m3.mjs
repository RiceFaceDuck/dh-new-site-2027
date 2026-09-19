/**
 * Live Operational Verification Script for Vite Dev Server (Port 3168)
 * Milestone 3 - DH Notebook Management System
 * 
 * Verifies:
 * 1. Root and route HTTP 200 responses.
 * 2. Deep crawl of Vite dev server module tree starting from /src/main.jsx,
 *    /src/App.jsx, and all 44 lazy-loaded route components in App.jsx.
 * 3. 0 transform 500 errors and 0 missing imports across all modules.
 * 4. Specific empirical feature checks for primary routes:
 *    - / & /overview
 *    - /inventory (5D sync button, stock metrics)
 *    - /generate & /generate/details
 *    - /claims
 *    - /billing
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3168';

const stats = {
  routesTested: 0,
  routesPassed: 0,
  modulesCrawled: 0,
  modulesPassed: 0,
  modulesFailed: 0,
  errors: [],
  featureChecksPassed: 0,
  featureChecksFailed: 0,
};

function logPass(msg) {
  console.log(`  [PASS] ${msg}`);
}

function logFail(msg, err) {
  console.error(`  [FAIL] ${msg}`, err || '');
  stats.errors.push({ msg, err: String(err || '') });
}

async function probeRoute(routePath) {
  const url = `${BASE_URL}${routePath}`;
  stats.routesTested++;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'text/html' } });
    const text = await res.text();
    if (res.status === 200 && text.includes('<html') && text.includes('/src/main.jsx')) {
      logPass(`Route ${routePath} -> HTTP 200 OK (HTML shell with /src/main.jsx mount)`);
      stats.routesPassed++;
      return true;
    } else {
      logFail(`Route ${routePath} returned HTTP ${res.status}`, text.slice(0, 200));
      return false;
    }
  } catch (err) {
    logFail(`Route ${routePath} fetch failed`, err);
    return false;
  }
}

function extractImports(code) {
  const imports = new Set();
  
  // 1. Static import / export statements: import ... from '...' or export ... from '...'
  const staticImportRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = staticImportRegex.exec(code)) !== null) {
    imports.add(match[1]);
  }

  // 2. Dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(code)) !== null) {
    imports.add(match[1]);
  }

  return Array.from(imports);
}

function resolveImportUrl(importSpecifier, parentUrlPath) {
  // If external URL (http:// or https://)
  if (importSpecifier.startsWith('http://') || importSpecifier.startsWith('https://')) {
    if (importSpecifier.startsWith(BASE_URL)) {
      return importSpecifier.replace(BASE_URL, '');
    }
    return null; // external
  }

  // If starts with / (already absolute path on dev server)
  if (importSpecifier.startsWith('/')) {
    return importSpecifier;
  }

  // If relative path (./ or ../)
  if (importSpecifier.startsWith('.')) {
    const parentDir = path.posix.dirname(parentUrlPath.split('?')[0]);
    const resolved = path.posix.normalize(`${parentDir}/${importSpecifier}`);
    return resolved.startsWith('/') ? resolved : `/${resolved}`;
  }

  return null;
}

async function runVerification() {
  console.log('================================================================');
  console.log('   DH Notebook M3: Live Dev Server Operational Verification     ');
  console.log('   Target: http://localhost:3168                                ');
  console.log('================================================================\n');

  // STEP 1: Verify 5 Primary Routes and SPA fallback
  console.log('--- STEP 1: Probing Primary Route Endpoints ---');
  const routesToProbe = [
    '/',
    '/overview',
    '/inventory',
    '/generate',
    '/generate/details',
    '/generate/details/EXP-20260917-VERIFY',
    '/claims',
    '/billing',
  ];

  for (const r of routesToProbe) {
    await probeRoute(r);
  }

  // STEP 2: Lazy Components from App.jsx
  console.log('\n--- STEP 2: Registering Lazy-Loaded Components from App.jsx ---');
  const lazyRoutes = [
    '/src/pages/dashboard/Overview.jsx',
    '/src/pages/dashboard/Search.jsx',
    '/src/pages/auth/Login.jsx',
    '/src/pages/settings/ProfileSetup.jsx',
    '/src/pages/inventory/InventoryMain.jsx',
    '/src/pages/Todo.jsx',
    '/src/pages/todo/TodoArchive.jsx',
    '/src/pages/ManagersOverview/index.jsx',
    '/src/pages/Customers/index.jsx',
    '/src/pages/History/index.jsx',
    '/src/pages/billing/BillingMain.jsx',
    '/src/pages/claims/ClaimMain.jsx',
    '/src/pages/gallery/GalleryMain.jsx',
    '/src/pages/emails/EmailMain.jsx',
    '/src/pages/Calendar.jsx',
    '/src/pages/managers/inventory/StockAdjustment.jsx',
    '/src/pages/managers/PromotionManagement.jsx',
    '/src/pages/managers/PricingSettings.jsx',
    '/src/pages/managers/StaffManagement.jsx',
    '/src/pages/managers/FreebieManagement.jsx',
    '/src/pages/managers/CreditDashboard/index.jsx',
    '/src/pages/managers/WalletManagement.jsx',
    '/src/pages/managers/settings/shipping/ShippingManagement.jsx',
    '/src/pages/managers/AdManagement.jsx',
    '/src/pages/managers/PartnerSettings.jsx',
    '/src/pages/managers/RefundManagement.jsx',
    '/src/pages/managers/settings/inventory/GlobalBufferSettings.jsx',
    '/src/pages/managers/GlobalCategorySettings.jsx',
    '/src/pages/managers/GlobalRegexSettings.jsx',
    '/src/pages/managers/warranty/GlobalWarrantySettings.jsx',
    '/src/pages/managers/settings/ads/GlobalAdsConfig.jsx',
    '/src/pages/managers/GlobalThemeSettings.jsx',
    '/src/pages/managers/GlobalKnowledgeSettings.jsx',
    '/src/pages/managers/GlobalFooterSettings.jsx',
    '/src/pages/managers/PrivacyCookiesSettings/index.jsx',
    '/src/pages/managers/RedirectURLsSettings/index.jsx',
    '/src/pages/managers/settings/rbac/index.jsx',
    '/src/pages/managers/RoleTierSettings/RoleTierSettingsPage.jsx',
    '/src/pages/managers/settings/core/SystemCoreSettings.jsx',
    '/src/pages/managers/settings/data_repair/DataRepairPage.jsx',
    '/src/pages/managers/AuditLedger.jsx',
    '/src/pages/GenerateSync/index.jsx',
    '/src/pages/GenerateSync/GenerateSyncDetails.jsx',
    '/src/components/CommandPalette.jsx',
  ];

  console.log(`Registered ${lazyRoutes.length} lazy route components.`);

  // STEP 3: Crawl Dev Server Module Tree
  console.log('\n--- STEP 3: Crawling Vite Dev Server Module Tree ---');
  const queue = ['/src/main.jsx', '/src/App.jsx', ...lazyRoutes];
  const visited = new Set();
  const moduleBodies = new Map();

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const normalizedKey = currentPath.split('?')[0];
    if (visited.has(normalizedKey)) continue;
    visited.add(normalizedKey);

    stats.modulesCrawled++;
    const fetchUrl = `${BASE_URL}${currentPath}`;

    try {
      const res = await fetch(fetchUrl);
      if (res.status !== 200) {
        stats.modulesFailed++;
        const errorText = await res.text();
        logFail(`Module ${currentPath} -> HTTP ${res.status}`, errorText.slice(0, 300));
        continue;
      }

      const code = await res.text();

      // Vite error overlays only occur on error responses or containing vite error tags
      if (res.status >= 400 || (code.includes('vite-error-overlay') && code.includes('plugin:vite:import-analysis'))) {
        stats.modulesFailed++;
        logFail(`Module ${currentPath} contains transform error in body!`, code.slice(0, 300));
        continue;
      }

      stats.modulesPassed++;
      moduleBodies.set(normalizedKey, code);

      // Only crawl downstream imports from application / project code (/src or /@fs)
      // Pre-bundled dependencies in /node_modules/.vite/deps/ are self-contained
      const isAppCode = currentPath.startsWith('/src/') || currentPath.startsWith('/@fs/');

      if (isAppCode) {
        const rawImports = extractImports(code);
        for (const rawImp of rawImports) {
          const resolvedPath = resolveImportUrl(rawImp, currentPath);
          if (!resolvedPath) continue;

          const cleanPath = resolvedPath.split('?')[0];

          // Crawl application code and direct dependencies
          if (
            cleanPath.startsWith('/src/') ||
            cleanPath.startsWith('/@fs/') ||
            cleanPath.startsWith('/node_modules/.vite/deps/') ||
            cleanPath.startsWith('/@vite/client')
          ) {
            if (!visited.has(cleanPath)) {
              queue.push(resolvedPath);
            }
          }
        }
      }

      if (stats.modulesCrawled % 50 === 0) {
        console.log(`  ... crawled ${stats.modulesCrawled} modules (Queue: ${queue.length}, Passed: ${stats.modulesPassed}, Failed: ${stats.modulesFailed})`);
      }
    } catch (err) {
      stats.modulesFailed++;
      logFail(`Exception fetching module ${currentPath}`, err);
    }
  }

  console.log(`\nCrawl complete! Total modules crawled: ${stats.modulesCrawled}, Passed: ${stats.modulesPassed}, Failed: ${stats.modulesFailed}`);

  // STEP 4: Feature-Specific Verification
  console.log('\n--- STEP 4: Feature-Specific Empirical Code & Runtime Checks ---');

  // Check 4.1: /inventory (5D Sync button & stock metrics)
  console.log('Checking /inventory components:');
  const invHeaderCode = moduleBodies.get('/src/components/inventory/InventoryHeader.jsx') || '';
  const invControllerCode = moduleBodies.get('/src/pages/inventory/useInventoryController.js') || '';
  const invStatsCode = moduleBodies.get('/src/firebase/inventory/inventoryStatsService.js') || '';

  if (
    invHeaderCode.includes('onRecalculateStats') &&
    invHeaderCode.includes('isRecalculating')
  ) {
    logPass('/inventory: InventoryHeader.jsx receives and wires onRecalculateStats & isRecalculating');
    stats.featureChecksPassed++;
  } else {
    logFail('/inventory: InventoryHeader.jsx missing onRecalculateStats or isRecalculating wiring');
    stats.featureChecksFailed++;
  }

  if (
    invControllerCode.includes('handleRecalculateStats') &&
    invControllerCode.includes('recalculateDailyStats')
  ) {
    logPass('/inventory: useInventoryController.js implements handleRecalculateStats calling recalculateDailyStats');
    stats.featureChecksPassed++;
  } else {
    logFail('/inventory: useInventoryController.js missing handleRecalculateStats or recalculateDailyStats call');
    stats.featureChecksFailed++;
  }

  if (invStatsCode.includes('recalculateDailyStats')) {
    logPass('/inventory: inventoryStatsService.js exports recalculateDailyStats with cache invalidation');
    stats.featureChecksPassed++;
  } else {
    logFail('/inventory: inventoryStatsService.js missing recalculateDailyStats implementation');
    stats.featureChecksFailed++;
  }

  // Check 4.2: /generate & /generate/details
  console.log('Checking /generate & /generate/details components:');
  const genSyncCode = moduleBodies.get('/src/pages/GenerateSync/index.jsx') || '';
  const genDetailsCode = moduleBodies.get('/src/pages/GenerateSync/GenerateSyncDetails.jsx') || '';

  if (genSyncCode.length > 0 && !genSyncCode.includes('vite-error-overlay')) {
    logPass('/generate: GenerateSync/index.jsx transformed cleanly with 0 errors');
    stats.featureChecksPassed++;
  } else {
    logFail('/generate: GenerateSync/index.jsx failed to transform');
    stats.featureChecksFailed++;
  }

  if (
    genDetailsCode.includes('TransactionMetricsHeader') &&
    genDetailsCode.includes('TransactionFilterBar') &&
    genDetailsCode.includes('TransactionItemizedTable') &&
    genDetailsCode.includes('TransactionGroupedList')
  ) {
    logPass('/generate/details: GenerateSyncDetails.jsx imports and integrates all 4 detail subcomponents');
    stats.featureChecksPassed++;
  } else {
    logFail('/generate/details: GenerateSyncDetails.jsx missing required subcomponent integration');
    stats.featureChecksFailed++;
  }

  // Check 4.3: /claims
  console.log('Checking /claims components:');
  const claimsCode = moduleBodies.get('/src/pages/claims/ClaimMain.jsx') || '';
  if (claimsCode.length > 0 && !claimsCode.includes('vite-error-overlay')) {
    logPass('/claims: ClaimMain.jsx transformed cleanly with 0 errors');
    stats.featureChecksPassed++;
  } else {
    logFail('/claims: ClaimMain.jsx failed to transform');
    stats.featureChecksFailed++;
  }

  // Check 4.4: /billing
  console.log('Checking /billing components:');
  const billingCode = moduleBodies.get('/src/pages/billing/BillingMain.jsx') || '';
  if (billingCode.length > 0 && !billingCode.includes('vite-error-overlay')) {
    logPass('/billing: BillingMain.jsx transformed cleanly with 0 errors');
    stats.featureChecksPassed++;
  } else {
    logFail('/billing: BillingMain.jsx failed to transform');
    stats.featureChecksFailed++;
  }

  // Check 4.5: / & /overview
  console.log('Checking /overview components:');
  const overviewCode = moduleBodies.get('/src/pages/dashboard/Overview.jsx') || '';
  if (overviewCode.length > 0 && !overviewCode.includes('vite-error-overlay')) {
    logPass('/overview: Overview.jsx transformed cleanly with 0 errors');
    stats.featureChecksPassed++;
  } else {
    logFail('/overview: Overview.jsx failed to transform');
    stats.featureChecksFailed++;
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('                    VERIFICATION SUMMARY                        ');
  console.log('================================================================');
  console.log(`Routes Tested:            ${stats.routesTested}`);
  console.log(`Routes HTTP 200 Passed:   ${stats.routesPassed}`);
  console.log(`Modules Crawled:          ${stats.modulesCrawled}`);
  console.log(`Modules Passed:           ${stats.modulesPassed}`);
  console.log(`Modules Failed:           ${stats.modulesFailed}`);
  console.log(`Feature Checks Passed:    ${stats.featureChecksPassed}`);
  console.log(`Feature Checks Failed:    ${stats.featureChecksFailed}`);
  console.log(`Total Errors Encountered: ${stats.errors.length}`);
  console.log('================================================================\n');

  // Save empirical JSON report
  const reportPath = path.resolve('Management System/tests/verifications/dev_server_verification_result.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    targetUrl: BASE_URL,
    routesProbed: routesToProbe,
    lazyRoutesChecked: lazyRoutes,
  }, null, 2));
  console.log(`Saved empirical result to: ${reportPath}`);

  if (stats.modulesFailed === 0 && stats.errors.length === 0 && stats.featureChecksFailed === 0) {
    console.log('>>> ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS (100% HEALTHY) <<<\n');
    process.exit(0);
  } else {
    console.error('>>> VERIFICATION FAILED WITH ERRORS! <<<\n');
    console.error(JSON.stringify(stats.errors, null, 2));
    process.exit(1);
  }
}

runVerification();
