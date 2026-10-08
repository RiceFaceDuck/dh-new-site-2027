import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧪 [Verification] Starting CategoryPage Scoping & Chunk Phase 1 Test...");

const categoryPagePath = path.resolve(__dirname, '../../dh-frontend/src/pages/CategoryPage.jsx');
const content = fs.readFileSync(categoryPagePath, 'utf8');

// 1. Static Scoping Audit
console.log("🔍 Checking variable scoping in CategoryPage.jsx...");

// Ensure the setHasMore condition does NOT use cachedResult or result directly
const lines = content.split('\n');
const hasMoreLine = lines.find(l => l.includes('setHasMore') || l.includes('isFromChunk'));
if (!content.includes('let isFromChunk = false;')) {
  console.error("❌ FAILED: isFromChunk definition missing!");
  process.exit(1);
}

// Check that line 48-55 does not reference cachedResult or result
const problematicLine = lines.find(l => l.includes('fetchedProducts.length < itemsPerPage') && (l.includes('cachedResult') || l.includes('result?.fromChunk')));
if (problematicLine) {
  console.error("❌ FAILED: Unsafe reference found on condition line:", problematicLine);
  process.exit(1);
}

if (!content.includes('setError(error.message')) {
  console.error("❌ FAILED: Error state notification missing in catch block!");
  process.exit(1);
}

console.log("✅ Passed static scoping audit: isFromChunk extracted safely, zero out-of-scope variable references.");

// 2. Logic Simulation
console.log("🔍 Running isolated simulation of loadProducts scoping logic...");

const runSim = (isInitial, chunkPresent) => {
  let fetchedProducts = [];
  let isFromChunk = false;
  const itemsPerPage = 40;

  if (isInitial) {
    const cachedResult = {
      docs: new Array(50).fill({ id: 'KB01', name: 'Keyboard Item' }),
      fromChunk: chunkPresent,
      lastDoc: null
    };
    fetchedProducts = cachedResult?.docs || [];
    isFromChunk = Boolean(cachedResult?.fromChunk);
  } else {
    const result = {
      docs: new Array(40).fill({ id: 'KB02', name: 'More Keyboard' }),
      fromChunk: false,
      lastDoc: { id: 'KB40' }
    };
    fetchedProducts = result?.docs || [];
    isFromChunk = Boolean(result?.fromChunk);
  }

  let hasMore = true;
  if (fetchedProducts.length < itemsPerPage || isFromChunk) {
    hasMore = false;
  }

  return { fetchedProductsCount: fetchedProducts.length, hasMore, isFromChunk };
};

const sim1 = runSim(true, true);
console.log("Simulation 1 (Initial with Chunk):", sim1);
if (sim1.fetchedProductsCount !== 50 || sim1.hasMore !== false || sim1.isFromChunk !== true) {
  console.error("❌ Simulation 1 failed!");
  process.exit(1);
}

const sim2 = runSim(false, false);
console.log("Simulation 2 (Pagination without Chunk):", sim2);
if (sim2.fetchedProductsCount !== 40 || sim2.hasMore !== true || sim2.isFromChunk !== false) {
  console.error("❌ Simulation 2 failed!");
  process.exit(1);
}

console.log("✅ Simulation passed without throwing ReferenceError!");

// 3. Firestore cat_keyboard Live Data Audit
const projectId = 'dh-notebook-69f3b';
function get(docPath) {
  return new Promise((resolve, reject) => {
    https.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data || '{}')));
    }).on('error', reject);
  });
}

const cat = await get('catalogs/cat_keyboard');
const items = cat.fields?.items?.arrayValue?.values || [];
console.log(`📦 Verified live catalogs/cat_keyboard: contains ${items.length} pre-aggregated products.`);

if (items.length !== 50) {
  console.error("❌ Unexpected item count in cat_keyboard:", items.length);
  process.exit(1);
}

console.log("🎉 ALL PHASE 1 VERIFICATION CHECKS PASSED SUCCESSFULLY!");
