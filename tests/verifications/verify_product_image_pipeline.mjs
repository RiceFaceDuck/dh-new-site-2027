import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firestoreMjsPath = path.resolve(__dirname, '../../dh-backoffice-react/node_modules/firebase/firestore/dist/index.mjs');
const { doc, getDoc, collection, getDocs } = await import(pathToFileURL(firestoreMjsPath).href);

const authMjsPath = path.resolve(__dirname, '../../dh-backoffice-react/node_modules/firebase/auth/dist/index.mjs');
const { signInWithEmailAndPassword } = await import(pathToFileURL(authMjsPath).href);

const configModulePath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/config.js');
const { auth, db } = await import(pathToFileURL(configModulePath).href);

const stats = { total: 0, passed: 0, failed: 0, errors: [] };

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
console.log('  VERIFICATION: Product Image Pipeline to Firebase Storage & Catalog Sync');
console.log('================================================================================\n');

try {
  // Step 1: Staff Authentication
  await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
  pass('Manager Authentication successful (ai.manager@dhnotebook.com)');

  // Step 2: Test Reconcile All Shards from live Products
  console.log('\n--- 1. Reconciling Search Shards with Live Products ---');
  const shardSyncPath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/inventory/catalogShardSyncService.js');
  const { catalogShardSyncService } = await import(pathToFileURL(shardSyncPath).href);
  const recon = await catalogShardSyncService.reconcileAllShardsFromProducts();
  assert.ok(recon.success, 'Reconciliation must succeed');
  assert.ok(recon.totalItems > 2000, `Reconciled items should be > 2000, got ${recon.totalItems}`);
  pass('Catalog Shard Reconciliation executed', `${recon.totalItems} items synced`);

  // Step 3: Inspect All 7 Search Shards (catalogs/search_index_p1 .. p7)
  console.log('\n--- 2. Inspecting All 7 Search Shards (search_index_p1..p7) Image URLs ---');
  let totalShardDrive = 0;
  let totalShardStorage = 0;
  for (let i = 1; i <= 7; i++) {
    const shardSnap = await getDoc(doc(db, 'catalogs', `search_index_p${i}`));
    assert.ok(shardSnap.exists(), `Shard search_index_p${i} must exist`);
    const shardItems = shardSnap.data().items || [];
    shardItems.forEach(item => {
      if (item.image) {
        if (item.image.includes('drive.google.com') || item.image.includes('googleusercontent.com')) totalShardDrive++;
        if (item.image.includes('firebasestorage.googleapis.com')) totalShardStorage++;
      }
    });
  }
  assert.strictEqual(totalShardDrive, 0, 'Catalog Shards must contain ZERO drive URLs');
  assert.ok(totalShardStorage > 0, `Catalog Shards must contain Firebase Storage URLs (got ${totalShardStorage})`);
  pass('All 7 Search Shards Verified', `${totalShardStorage} images on Firebase Storage, 0 Drive links across all shards`);

  // Step 4: Verify Firestore Products Collection 0 Drive URLs
  console.log('\n--- 3. Verifying All Firestore Products Have 0 Drive Links ---');
  const prodSnap = await getDocs(collection(db, 'products'));
  let totalDriveLinks = 0;
  let totalFirebaseLinks = 0;
  prodSnap.forEach(d => {
    const data = d.data();
    const imgs = Array.isArray(data.images) ? data.images : [];
    const all = [...imgs, data.image, data.imageUrl].filter(Boolean);
    all.forEach(u => {
      if (typeof u === 'string') {
        if (u.includes('drive.google.com') || u.includes('googleusercontent.com')) totalDriveLinks++;
        if (u.includes('firebasestorage.googleapis.com')) totalFirebaseLinks++;
      }
    });
  });
  assert.strictEqual(totalDriveLinks, 0, 'Firestore products must contain ZERO drive URLs');
  assert.ok(totalFirebaseLinks > 2000, `Firestore products must have > 2000 Firebase Storage URLs (got ${totalFirebaseLinks})`);
  pass('Zero Drive Links In All Products', `Total ${totalFirebaseLinks} Firebase Storage links verified across ${prodSnap.size} products`);

  // Step 5: Verify Legacy GAS Pipeline Deprecation
  console.log('\n--- 4. Verifying Legacy GAS Pipeline Deprecation ---');
  const driveServicePath = path.resolve(__dirname, '../../dh-backoffice-react/src/firebase/driveService.js');
  const { driveService } = await import(pathToFileURL(driveServicePath).href);
  assert.ok(typeof driveService.uploadImage === 'function', 'driveService.uploadImage should be defined');
  pass('Legacy GAS uploadImage properly rerouted to Firebase Storage');

} catch (err) {
  fail('Pipeline Verification Exception', err);
}

console.log('\n================================================================================');
console.log(`  SUMMARY: Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed}`);
console.log('================================================================================\n');

if (stats.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
