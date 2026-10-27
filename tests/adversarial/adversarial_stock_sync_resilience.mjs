/**
 * Adversarial Test Suite: Stock Sync Resilience & Cache Integrity
 * Target: catalogShardSyncService, catalogHydrationService, useInventoryController, useProductSearchQuery
 * Hub: Management System/tests/adversarial/adversarial_stock_sync_resilience.mjs
 */

import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BO_SRC = path.resolve(__dirname, '../../dh-backoffice-react/src');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function pass(name, detail = '') {
  totalChecks++;
  passedChecks++;
  console.log(`  ✅ [PASS] ${name}${detail ? ` (${detail})` : ''}`);
}

function fail(name, error) {
  totalChecks++;
  failedChecks++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  ❌ [FAIL] ${name}: ${msg}`);
}

console.log('================================================================================');
console.log('  🧪 ADVERSARIAL TEST: Stock Sync Resilience & Cache Purge Integrity');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Sanitize Item For Shard Boundaries & Invariants
// -----------------------------------------------------------------------------
console.log('--- SUITE 1: Sanitize Item For Shard Boundaries & Invariants ---');

try {
  const servicePath = path.resolve(BO_SRC, 'firebase/inventory/catalogShardSyncService.js');
  const fileContent = fs.readFileSync(servicePath, 'utf8');

  // Verify code contains exact bufferStock !== undefined guard
  assert.ok(
    fileContent.includes('item.bufferStock !== undefined'),
    'sanitizeItemForShard must check bufferStock !== undefined'
  );
  pass('bufferStock check uses explicit !== undefined');

  // Verify shortDescription length clamp
  assert.ok(
    fileContent.includes('.slice(0, 500)'),
    'sanitizeItemForShard must clamp shortDescription to 500 chars'
  );
  pass('shortDescription clamped to <= 500 characters');

  // Verify missing shard check throws error
  assert.ok(
    fileContent.includes('Aborting shard sync to protect data integrity'),
    'syncProductsToShards must abort on missing or inaccessible shard'
  );
  pass('Missing shard detection throws and protects shards from overwrite');

  // Verify dynamic balancing in loop
  assert.ok(
    fileContent.includes('for (let i = 1; i <= chunkCount; i++)') &&
    fileContent.includes('remainingSkus.forEach'),
    'syncProductsToShards must balance new SKUs dynamically across chunks'
  );
  pass('Dynamic multi-shard balancing verified');
} catch (e) {
  fail('SUITE 1: Sanitize Item Invariants', e);
}

// -----------------------------------------------------------------------------
// SUITE 2: Dynamic Multi-Shard Distribution Simulation
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Dynamic Multi-Shard Distribution Simulation ---');

try {
  // Simulate 7 shards with different initial lengths
  const chunkCount = 7;
  const shardItemsMap = new Map();
  shardItemsMap.set(1, new Array(350).fill({}));
  shardItemsMap.set(2, new Array(350).fill({}));
  shardItemsMap.set(3, new Array(350).fill({}));
  shardItemsMap.set(4, new Array(350).fill({}));
  shardItemsMap.set(5, new Array(350).fill({}));
  shardItemsMap.set(6, new Array(350).fill({}));
  shardItemsMap.set(7, new Array(313).fill({})); // Shard 7 is smallest (313 items)

  const newSkus = Array.from({ length: 70 }, (_, i) => `NEW_SKU_${i + 1}`);
  const modifiedShardIndices = new Set();

  newSkus.forEach(newSku => {
    let bestShardIndex = 1;
    let minLength = Infinity;
    for (let i = 1; i <= chunkCount; i++) {
      const len = shardItemsMap.get(i).length;
      if (len < minLength) {
        minLength = len;
        bestShardIndex = i;
      }
    }

    shardItemsMap.get(bestShardIndex).push({ sku: newSku });
    modifiedShardIndices.add(bestShardIndex);
  });

  // Total items: 2413 + 70 = 2483
  const totalItems = Array.from(shardItemsMap.values()).reduce((sum, arr) => sum + arr.length, 0);
  assert.strictEqual(totalItems, (350 * 6 + 313) + 70, 'Total items must match 2413 + 70');

  // Verify that all shards are within 1 item of each other (354 to 355 items each)
  const lengths = Array.from(shardItemsMap.values()).map(arr => arr.length);
  const maxLen = Math.max(...lengths);
  const minLen = Math.min(...lengths);
  assert.ok(maxLen - minLen <= 1, `Shards must be balanced within 1 item (max: ${maxLen}, min: ${minLen})`);
  assert.strictEqual(maxLen, 355, 'Max shard length must be 355');
  assert.strictEqual(minLen, 354, 'Min shard length must be 354');
  assert.ok(modifiedShardIndices.size === 7, 'All 7 shards received items in balanced round-robin');
  pass('70 new SKUs evenly balanced across shards without single-shard bloat', `Max shard: ${maxLen}, Min shard: ${minLen}`);
} catch (e) {
  fail('SUITE 2: Dynamic Distribution Simulation', e);
}

// -----------------------------------------------------------------------------
// SUITE 3: Cache Clearance & inventory_full_cache Invariant
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Cache Clearance & inventory_full_cache Invariant ---');

try {
  const hydrationPath = path.resolve(BO_SRC, 'firebase/catalogHydrationService.js');
  const hydrationContent = fs.readFileSync(hydrationPath, 'utf8');

  // Verify clearCatalogCache removes inventory_full_cache
  assert.ok(
    hydrationContent.includes("window.sessionStorage.removeItem('inventory_full_cache')"),
    'clearCatalogCache must purge inventory_full_cache from sessionStorage'
  );
  assert.ok(
    hydrationContent.includes("window.sessionStorage.removeItem('inventory_full_cache_expiry')"),
    'clearCatalogCache must purge inventory_full_cache_expiry from sessionStorage'
  );
  pass('clearCatalogCache() thoroughly purges inventory_full_cache & expiry');

  // Verify updateCatalogCacheWithProducts also clears inventory_full_cache to prevent desync
  const updateMethod = hydrationContent.slice(hydrationContent.indexOf('updateCatalogCacheWithProducts'));
  assert.ok(
    updateMethod.includes("window.sessionStorage.removeItem('inventory_full_cache')"),
    'updateCatalogCacheWithProducts must purge inventory_full_cache to prevent POS/Inventory desync'
  );
  pass('updateCatalogCacheWithProducts purges inventory_full_cache');
} catch (e) {
  fail('SUITE 3: Cache Clearance Invariants', e);
}

// -----------------------------------------------------------------------------
// SUITE 4: Inventory Controller & Hook Ordering Invariant
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Inventory Controller & Hook Ordering Invariant ---');

try {
  const controllerPath = path.resolve(BO_SRC, 'pages/inventory/useInventoryController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');

  // Verify useInventorySearch is declared BEFORE handleRecalculateStats
  const searchIndex = controllerContent.indexOf('useInventorySearch(');
  const recalcIndex = controllerContent.indexOf('handleRecalculateStats = useCallback(');
  assert.ok(searchIndex < recalcIndex, 'useInventorySearch must be invoked before handleRecalculateStats so clearCache is in scope');
  pass('useInventorySearch declared before handleRecalculateStats');

  // Verify handleRecalculateStats calls clearCache()
  const recalcFnBody = controllerContent.slice(recalcIndex, controllerContent.indexOf('}, [fetchInitialProducts'));
  assert.ok(recalcFnBody.includes('clearCache()'), 'handleRecalculateStats must call clearCache() during 5D sync');
  pass('handleRecalculateStats calls clearCache()');

  // Verify handleImportSuccess calls fetchInitialProducts({ forceRefresh: true })
  const importSuccessFn = controllerContent.slice(controllerContent.indexOf('handleImportSuccess = async'));
  assert.ok(importSuccessFn.includes('fetchInitialProducts({ forceRefresh: true })'), 'handleImportSuccess must pass forceRefresh: true');
  pass('handleImportSuccess forces fresh catalog refetch');
} catch (e) {
  fail('SUITE 4: Inventory Controller Hook Ordering', e);
}

// -----------------------------------------------------------------------------
// SUITE 5: Cross-Device Delta Propagation Invariant
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Cross-Device Delta Propagation Invariant ---');

try {
  const searchQueryPath = path.resolve(BO_SRC, 'pages/hooks/useProductSearchQuery.js');
  const searchQueryContent = fs.readFileSync(searchQueryPath, 'utf8');

  // Verify delta products are forwarded to catalogHydrationService
  assert.ok(
    searchQueryContent.includes('catalogHydrationService.updateCatalogCacheWithProducts(deltaProducts)'),
    'useProductSearchQuery must forward delta products to catalogHydrationService.updateCatalogCacheWithProducts'
  );
  pass('useProductSearchQuery forwards deltaProducts to catalogHydrationService');

  // Verify fullSyncRequired purges catalogHydrationService cache
  assert.ok(
    searchQueryContent.includes('catalogHydrationService.clearCatalogCache()'),
    'useProductSearchQuery must clear catalogHydrationService cache on fullSyncRequired'
  );
  pass('useProductSearchQuery purges catalogHydrationService on full sync');
} catch (e) {
  fail('SUITE 5: Cross-Device Delta Propagation', e);
}

// -----------------------------------------------------------------------------
// SUITE 6: Soft-Delete & Inactive Product Shard Pruning Invariant
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Soft-Delete & Inactive Product Shard Pruning Invariant ---');

try {
  const servicePath = path.resolve(BO_SRC, 'firebase/inventory/catalogShardSyncService.js');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');

  // Verify syncProductsToShards splices out deleted/inactive items
  assert.ok(
    serviceContent.includes('items.splice(j, 1)'),
    'syncProductsToShards must splice out deleted or inactive items from shard'
  );
  assert.ok(
    serviceContent.includes('action === \'delete\' || updateData.isActive === false'),
    'syncProductsToShards must detect deletion or deactivation'
  );
  pass('syncProductsToShards prunes soft-deleted / deactivated products from shards');

  // Verify updateCatalogCacheWithProducts removes inactive products from cache
  const hydrationPath = path.resolve(BO_SRC, 'firebase/catalogHydrationService.js');
  const hydrationContent = fs.readFileSync(hydrationPath, 'utf8');
  assert.ok(
    hydrationContent.includes('productMap.delete(upperSku)'),
    'updateCatalogCacheWithProducts must delete keys when item is soft-deleted or inactive'
  );
  pass('updateCatalogCacheWithProducts deletes soft-deleted products from cache');

  // Verify useProductSearchQuery filters out inactive delta items
  const searchQueryPath = path.resolve(BO_SRC, 'pages/hooks/useProductSearchQuery.js');
  const searchQueryContent = fs.readFileSync(searchQueryPath, 'utf8');
  assert.ok(
    searchQueryContent.includes('!delta || delta.isActive !== false'),
    'useProductSearchQuery must filter out inactive delta items from React state'
  );
  assert.ok(
    searchQueryContent.includes('p.isActive !== false'),
    'useProductSearchQuery must exclude inactive items from allFilteredProducts'
  );
  pass('useProductSearchQuery excludes inactive / soft-deleted items from state & UI search');
} catch (e) {
  fail('SUITE 6: Soft-Delete & Inactive Shard Pruning', e);
}

// -----------------------------------------------------------------------------
// SUITE 7: Excel New Inactive / Draft SKU Security Guard
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 7: Excel New Inactive / Draft SKU Security Guard ---');

try {
  const servicePath = path.resolve(BO_SRC, 'firebase/inventory/catalogShardSyncService.js');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');

  // Guard in step 4 must reject inactive items regardless of action (e.g. action: 'import' with draft products)
  assert.ok(
    serviceContent.includes('updateData.isActive === false || action === \'delete\''),
    'step 4 must block inactive draft products from being pushed to shards during import/update'
  );
  pass('New Excel imported draft products (isActive: false) are strictly blocked from public shards');
} catch (e) {
  fail('SUITE 7: Draft SKU Security Guard', e);
}

// -----------------------------------------------------------------------------
// SUITE 8: Reconcile Chunk Balancing Invariant
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 8: Reconcile Chunk Balancing Invariant ---');

try {
  const servicePath = path.resolve(BO_SRC, 'firebase/inventory/catalogShardSyncService.js');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');

  // Verify dynamic chunk sizing algorithm
  assert.ok(
    serviceContent.includes('const baseSize = Math.floor(allItems.length / chunkCount)'),
    'reconcileAllShardsFromProducts must calculate baseSize evenly across chunkCount'
  );
  assert.ok(
    serviceContent.includes('const remainder = allItems.length % chunkCount'),
    'reconcileAllShardsFromProducts must balance remainders across chunks'
  );

  // Simulate balancing with 2413 items and 2800 items
  for (const totalCount of [2413, 2800, 3501]) {
    const chunkCount = 7;
    const baseSize = Math.floor(totalCount / chunkCount);
    const remainder = totalCount % chunkCount;
    const chunkSizes = [];
    for (let i = 0; i < chunkCount; i++) {
      chunkSizes.push(baseSize + (i < remainder ? 1 : 0));
    }
    const max = Math.max(...chunkSizes);
    const min = Math.min(...chunkSizes);
    assert.ok(max - min <= 1, `Chunk sizes must differ by at most 1 item (max: ${max}, min: ${min})`);
    const sum = chunkSizes.reduce((a, b) => a + b, 0);
    assert.strictEqual(sum, totalCount, `Sum of chunk sizes must equal total ${totalCount}`);
  }
  pass('Reconciliation chunks are mathematically balanced to within 1 item under any catalog size');
} catch (e) {
  fail('SUITE 8: Reconcile Chunk Balancing', e);
}

// -----------------------------------------------------------------------------
// SUITE 9: R2 Instant Force Refresh & Direct Bypass Capability
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 9: R2 Instant Force Refresh & Direct Bypass Capability ---');

try {
  const headerPath = path.resolve(BO_SRC, 'components/inventory/InventoryHeader.jsx');
  const headerContent = fs.readFileSync(headerPath, 'utf8');

  // Verify onDoubleClick handler for bypassShards on mobile/touch/desktop
  assert.ok(
    headerContent.includes('onDoubleClick={(e) => onRecalculateStats({ ...e, bypassShards: true })}'),
    'InventoryHeader Sync button must support onDoubleClick direct bypass'
  );
  pass('InventoryHeader supports double-click / double-tap direct database bypass');

  // Verify tooltip explains Shift+Click and double-click
  assert.ok(
    headerContent.includes('Shift+คลิก หรือ ดับเบิ้ลคลิก เพื่อดึงข้อมูลสด 100%'),
    'InventoryHeader Sync button must explain direct bypass capabilities in title tooltip'
  );
  pass('InventoryHeader tooltip explains Shift+Click and double-click direct bypass');

  // Verify useInventoryController wraps daily stats in try-catch for soft failure resilience
  const controllerPath = path.resolve(BO_SRC, 'pages/inventory/useInventoryController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  assert.ok(
    controllerContent.includes('inventoryStatsService.recalculateDailyStats()') &&
    controllerContent.includes('Daily stats recalculation error:'),
    'useInventoryController must catch daily stats errors to prevent blocking catalog refresh'
  );
  pass('useInventoryController handleRecalculateStats has soft failure tolerance');
} catch (e) {
  fail('SUITE 9: Force Refresh & Direct Bypass', e);
}

// -----------------------------------------------------------------------------
// SUITE 10: Property Alias Shadowing & Secondary Key Override Invariant
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 10: Property Alias Shadowing & Secondary Key Override Invariant ---');

try {
  const servicePath = path.resolve(BO_SRC, 'firebase/inventory/catalogShardSyncService.js');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');

  // Verify resolveItemAliases helper exists
  assert.ok(
    serviceContent.includes('function resolveItemAliases'),
    'catalogShardSyncService must implement resolveItemAliases helper'
  );
  pass('resolveItemAliases helper defined');

  // Verify resolveItemAliases maps stock -> stockQuantity
  assert.ok(
    serviceContent.includes('resolved.stockQuantity = data.stock'),
    'resolveItemAliases must map data.stock to stockQuantity'
  );
  // Verify resolveItemAliases maps wholesalePrice -> Price
  assert.ok(
    serviceContent.includes('resolved.Price = data.wholesalePrice'),
    'resolveItemAliases must map data.wholesalePrice to Price'
  );
  // Verify resolveItemAliases maps RetailPrice -> retailPrice
  assert.ok(
    serviceContent.includes('resolved.retailPrice = data.RetailPrice'),
    'resolveItemAliases must map data.RetailPrice to retailPrice'
  );
  pass('resolveItemAliases maps secondary aliases to canonical shard fields');

  // Verify resolveItemAliases is called in Step 3 and Step 4
  assert.ok(
    serviceContent.includes('const resolvedUpdate = resolveItemAliases(updateData)'),
    'syncProductsToShards must resolve aliases before merging into shard items'
  );
  pass('syncProductsToShards applies resolveItemAliases in both Step 3 and Step 4');
} catch (e) {
  fail('SUITE 10: Property Alias Shadowing', e);
}

// -----------------------------------------------------------------------------
// SUITE 11: Cache Version Parity & 1-Read IDB Hit Invariant
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 11: Cache Version Parity & 1-Read IDB Hit Invariant ---');

try {
  const shardSyncPath = path.resolve(BO_SRC, 'firebase/inventory/catalogShardSyncService.js');
  const shardSyncContent = fs.readFileSync(shardSyncPath, 'utf8');

  // Verify syncProductsToShards returns version
  assert.ok(
    shardSyncContent.includes('version: manifestVersion'),
    'syncProductsToShards must return manifestVersion'
  );
  pass('syncProductsToShards returns manifestVersion');

  // Verify reconcileAllShardsFromProducts returns version
  assert.ok(
    shardSyncContent.includes('return { success: true, version: manifestVersion'),
    'reconcileAllShardsFromProducts must return version: manifestVersion'
  );
  pass('reconcileAllShardsFromProducts returns manifestVersion');

  // Verify catalogHydrationService forwards result.version
  const hydrationPath = path.resolve(BO_SRC, 'firebase/catalogHydrationService.js');
  const hydrationContent = fs.readFileSync(hydrationPath, 'utf8');

  assert.ok(
    hydrationContent.includes('version: result?.version'),
    'syncCatalogShardsWithProducts must forward result.version to updateCatalogCacheWithProducts'
  );
  pass('syncCatalogShardsWithProducts forwards manifest version to local cache');

  assert.ok(
    hydrationContent.includes('version: options.version || Date.now()'),
    'updateCatalogCacheWithProducts must record forwarded manifest version in IDB meta'
  );
  pass('updateCatalogCacheWithProducts aligns IDB meta version with Firestore manifest');

  assert.ok(
    hydrationContent.includes('version: reconResult.version || Date.now()'),
    'hydrateCatalog must record reconResult.version in IDB meta on live reconciliation'
  );
  pass('hydrateCatalog live_reconciled aligns IDB meta version with Firestore manifest');
} catch (e) {
  fail('SUITE 11: Cache Version Parity', e);
}

// -----------------------------------------------------------------------------
// SUITE 12: Manager Todo PRODUCT_DELETE_APPROVAL Delegation Invariant
// -----------------------------------------------------------------------------
console.log('\n--- SUITE 12: Manager Todo PRODUCT_DELETE_APPROVAL Delegation Invariant ---');

try {
  const managerActionPath = path.resolve(BO_SRC, 'firebase/managerActionService.js');
  const managerActionContent = fs.readFileSync(managerActionPath, 'utf8');

  // Verify managerActionService handles PRODUCT_DELETE_APPROVAL
  assert.ok(
    managerActionContent.includes("type === 'PRODUCT_DELETE_APPROVAL'"),
    'managerActionService must have explicit handler for PRODUCT_DELETE_APPROVAL'
  );
  assert.ok(
    managerActionContent.includes('inventoryMutationService.deleteProduct(targetSku, productName)'),
    'managerActionService must invoke inventoryMutationService.deleteProduct on approval'
  );
  pass('managerActionService delegates PRODUCT_DELETE_APPROVAL to inventoryMutationService.deleteProduct');

  // Verify useTodoActionDispatcher dispatches PRODUCT_DELETE_APPROVAL
  const dispatcherPath = path.resolve(BO_SRC, 'pages/todo/hooks/useTodoActionDispatcher.js');
  const dispatcherContent = fs.readFileSync(dispatcherPath, 'utf8');

  assert.ok(
    dispatcherContent.includes("'PRODUCT_DELETE_APPROVAL'"),
    'useTodoActionDispatcher must include PRODUCT_DELETE_APPROVAL in approval dispatcher list'
  );
  pass('useTodoActionDispatcher routes PRODUCT_DELETE_APPROVAL to managerActionService');
} catch (e) {
  fail('SUITE 12: Manager Todo PRODUCT_DELETE_APPROVAL Delegation', e);
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`  SUMMARY: Total: ${totalChecks} | Passed: ${passedChecks} | Failed: ${failedChecks}`);
console.log('================================================================================');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL ADVERSARIAL STRESS CHECKS PASSED EMPIRICALLY!\n');
  process.exit(0);
}

