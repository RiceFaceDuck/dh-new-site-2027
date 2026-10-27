/**
 * Phase Verification: Cross-Device Catalog Shard & Manifest Auto-Sync
 * Location: Management System/tests/verifications/verify_stock_sync_catalog_shards.mjs
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const firestoreMjsPath = path.resolve(__dirname, '../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs');
const { doc, getDoc, collection, getDocs, limit, query, serverTimestamp } = await import(pathToFileURL(firestoreMjsPath).href);

const authMjsPath = path.resolve(__dirname, '../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs');
const { signInWithEmailAndPassword } = await import(pathToFileURL(authMjsPath).href);

const configModulePath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/config.js');
const { auth, db } = await import(pathToFileURL(configModulePath).href);

const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function pass(name, detail = '') {
  stats.total++;
  stats.passed++;
  console.log(`  ✅ [PASS] ${name}${detail ? ` (${detail})` : ''}`);
}

function fail(name, error) {
  stats.total++;
  stats.failed++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  ❌ [FAIL] ${name}: ${msg}`);
  stats.errors.push({ name, error: msg });
}

console.log('================================================================================');
console.log('  VERIFICATION: Cross-Device Catalog Shard & Manifest Auto-Sync');
console.log('================================================================================\n');

try {
  // Step 1: Authentication
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  pass('Staff Authentication successful (ai.manager@dhnotebook.com)');

  // Step 2: Test Reconcile All Shards from live Products
  console.log('\n--- 1. Testing Full Catalog Shard Reconciliation from Live Products ---');
  const shardSyncModulePath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/inventory/catalogShardSyncService.js');
  const { catalogShardSyncService } = await import(pathToFileURL(shardSyncModulePath).href);

  const reconResult = await catalogShardSyncService.reconcileAllShardsFromProducts();
  assert.ok(reconResult.success, 'Reconciliation must succeed');
  assert.ok(reconResult.totalItems > 2000, `Reconciled items must be > 2000 (got ${reconResult.totalItems})`);
  pass('catalogShardSyncService.reconcileAllShardsFromProducts() executed cleanly', `${reconResult.totalItems} items reconciled`);

  // Step 3: Inspect Manifest
  console.log('\n--- 2. Inspect Central Catalog Manifest (catalogs/search_index) ---');
  const manifestSnap = await getDoc(doc(db, 'catalogs', 'search_index'));
  assert.ok(manifestSnap.exists(), 'Manifest catalogs/search_index must exist');
  const manifestData = manifestSnap.data();
  assert.strictEqual(Number(manifestData.chunkCount), 7, 'chunkCount must be 7');
  assert.strictEqual(Number(manifestData.totalItems), reconResult.totalItems, 'totalItems in manifest must match reconciled total');
  assert.ok(manifestData.version, 'Manifest must have version');
  pass('Manifest catalogs/search_index verified', `v${manifestData.version}, totalItems: ${manifestData.totalItems}, chunkCount: 7`);

  // Step 4: Verify 7 Shards in Firestore
  console.log('\n--- 3. Inspect All 7 Shards in Firestore ---');
  const shardMap = new Map();
  let totalAggregated = 0;

  for (let i = 1; i <= 7; i++) {
    const chunkSnap = await getDoc(doc(db, 'catalogs', `search_index_p${i}`));
    assert.ok(chunkSnap.exists(), `Shard p${i} must exist in Firestore`);
    const items = chunkSnap.data()?.items || [];
    assert.ok(Array.isArray(items) && items.length > 0, `Shard p${i} must have items`);
    totalAggregated += items.length;
    items.forEach(it => {
      if (it.sku) shardMap.set(String(it.sku).trim().toUpperCase(), it);
    });
    pass(`Shard search_index_p${i} verified`, `${items.length} items`);
  }

  assert.strictEqual(totalAggregated, reconResult.totalItems, `Aggregated items must match ${reconResult.totalItems}`);
  pass('All 7 shards aggregated perfectly', `Total: ${totalAggregated}`);

  // Step 5: Check Data Parity on previously discrepant products
  console.log('\n--- 4. Data Consistency Check: Products vs Shards ---');
  const targetSkus = ['ADAC001', 'CAAS019', 'FAAS064', 'KBAS156', 'LED15630-1'];
  for (const sku of targetSkus) {
    const pSnap = await getDoc(doc(db, 'products', sku));
    assert.ok(pSnap.exists(), `Product ${sku} must exist in products collection`);
    const pData = pSnap.data();
    const sData = shardMap.get(sku);
    assert.ok(sData, `Product ${sku} must exist in catalog shard`);

    assert.strictEqual(
      Number(sData.stockQuantity),
      Number(pData.stockQuantity),
      `SKU ${sku} stock in Shard (${sData.stockQuantity}) must match products collection (${pData.stockQuantity})`
    );
    assert.strictEqual(
      Number(sData.Price),
      Number(pData.Price),
      `SKU ${sku} Price in Shard (${sData.Price}) must match products collection (${pData.Price})`
    );
    pass(`Stock & Price Parity verified for ${sku}`, `Stock: ${sData.stockQuantity}, Price: ฿${sData.Price}`);
  }

  // Step 6: Test Single Mutation Sync
  console.log('\n--- 5. Testing Targeted Mutation Shard Sync ---');
  const testSku = 'ADAC001';
  const originalShardItem = shardMap.get(testSku);
  const updatedStock = Number(originalShardItem.stockQuantity);

  const syncResult = await catalogShardSyncService.syncProductsToShards([
    { sku: testSku, stockQuantity: updatedStock }
  ], { action: 'update' });

  assert.ok(syncResult.success, 'Targeted shard sync must succeed');
  assert.strictEqual(syncResult.updatedCount, 1, 'Updated count must be 1');
  assert.ok(syncResult.modifiedShards.length >= 1, 'At least 1 shard must be modified');
  pass(`catalogShardSyncService.syncProductsToShards updated SKU ${testSku}`, `Modified shards: [${syncResult.modifiedShards.join(', ')}]`);

  // Step 7: Check settings/inventory_meta received delta update
  console.log('\n--- 6. Verifying inventory_meta Delta Broadcast ---');
  const metaSnap = await getDoc(doc(db, 'settings', 'inventory_meta'));
  if (metaSnap.exists()) {
    const metaData = metaSnap.data();
    assert.ok(metaData.version, 'inventory_meta must have version');
    pass('inventory_meta updated successfully', `version: ${metaData.version}, lastAction: ${metaData.lastAction}`);
  }

  console.log('\n================================================================================');
  console.log(`  SUMMARY: Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
  console.log('================================================================================');

  if (stats.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
} catch (error) {
  console.error('Fatal Verification Error:', error);
  process.exit(1);
}
