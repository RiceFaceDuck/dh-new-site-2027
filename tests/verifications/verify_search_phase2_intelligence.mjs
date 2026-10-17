import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boPackagePath = path.resolve(__dirname, '../../dh-backoffice-react/package.json');
const req = createRequire(boPackagePath);

const { initializeApp } = await import(pathToFileURL(req.resolve('firebase/app')).href);
const { getAuth, signInWithEmailAndPassword } = await import(pathToFileURL(req.resolve('firebase/auth')).href);
const { getFirestore, doc, getDoc } = await import(pathToFileURL(req.resolve('firebase/firestore')).href);

const { filterProductsByQuery, findRelatedProducts, tokenizeQuery, getExpandedTerms } = await import(pathToFileURL(path.resolve(__dirname, '../../dh-frontend/src/utils/searchMatcher.js')).href);

function sanitizeStorefrontProduct(item) {
  if (!item || typeof item !== 'object') return null;
  const sku = String(item.sku || item.id || '').trim();
  if (!sku) return null;
  if (item.isActive === false) return null;
  const price = Number(item.retailPrice ?? item.Price ?? item.price ?? item.wholesalePrice ?? 0) || 0;
  const stock = Number(item.stockQuantity ?? item.stock ?? 0) || 0;
  const image = (Array.isArray(item.images) && item.images[0]) || item.image || item.imageUrl || null;

  return {
    id: item.id || sku,
    sku,
    name: item.name || item.title || item.productName || sku,
    brand: item.brand || '',
    category: item.category || '',
    category_lower: item.category_lower || (item.category ? String(item.category).toLowerCase() : ''),
    model: item.model || '',
    price,
    retailPrice: price,
    stockQuantity: stock,
    stock,
    inStock: stock > 0,
    images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (image ? [image] : []),
    image,
    imageUrl: image,
    description: item.description || '',
    shortDescription: item.shortDescription || '',
    compatibleModels: Array.isArray(item.compatibleModels) ? item.compatibleModels : [],
    compatiblePartNumbers: Array.isArray(item.compatiblePartNumbers) ? item.compatiblePartNumbers : [],
    substituteSkus: Array.isArray(item.substituteSkus) ? item.substituteSkus : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    type: item.type || ''
  };
}

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng',
  authDomain: 'dh-notebook-69f3b.firebaseapp.com',
  projectId: 'dh-notebook-69f3b',
  storageBucket: 'dh-notebook-69f3b.firebasestorage.app',
  messagingSenderId: '713635574580',
  appId: '1:713635574580:web:8d60ac45a28d5938972b61'
};

async function run() {
  console.log('================================================================================');
  console.log('  🔍 VERIFICATION SUITE: PHASE 2 THAI NLP & SMART SEARCH INTELLIGENCE');
  console.log('================================================================================\n');

  const app = initializeApp(FIREBASE_CONFIG);
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, 'ai.manager@dhnotebook.com', 'Password123!');
  const db = getFirestore(app);

  let allItems = [];
  for (let i = 1; i <= 7; i++) {
    const snap = await getDoc(doc(db, 'catalogs', `search_index_p${i}`));
    const items = snap.data().items || [];
    allItems.push(...items.map(sanitizeStorefrontProduct).filter(Boolean));
  }
  console.log(`Loaded catalog products: ${allItems.length}`);

  // Test 1: User's original screenshot queries
  const userScreenshotQueries = [
    { query: 'คีย์บอร์ด lenovo', min: 100 },
    { query: '5547', min: 5 },
    { query: '15.6', min: 50 },
    { query: 'Led 15.6', min: 50 },
    { query: '4736', min: 5 }
  ];

  console.log('\n--- 1. Testing User Screenshot Queries ---');
  for (const t of userScreenshotQueries) {
    const matched = filterProductsByQuery(allItems, t.query);
    assert.ok(matched.length >= t.min, `Expected >= ${t.min} for "${t.query}", got ${matched.length}`);
    console.log(`  ✅ [PASS] "${t.query}" found ${matched.length} items (min ${t.min})`);
  }

  // Test 2: Thai compound words (no space)
  console.log('\n--- 2. Testing Thai Compound Splitting (Zero Space) ---');
  const compoundQueries = [
    { query: 'จอ15.6', min: 50 },
    { query: '15.6นิ้ว', min: 50 },
    { query: '14นิ้ว', min: 50 }
  ];
  for (const t of compoundQueries) {
    const matched = filterProductsByQuery(allItems, t.query);
    assert.ok(matched.length >= t.min, `Expected >= ${t.min} for "${t.query}", got ${matched.length}`);
    console.log(`  ✅ [PASS] "${t.query}" found ${matched.length} items`);
  }

  // Test 3: Thai brand names
  console.log('\n--- 3. Testing Thai Brand Names ---');
  const brandQueries = [
    { query: 'เลโนโว', min: 200 },
    { query: 'เดล', min: 150 },
    { query: 'เอเซอร์', min: 150 },
    { query: 'เอซุส', min: 200 }
  ];
  for (const t of brandQueries) {
    const matched = filterProductsByQuery(allItems, t.query);
    assert.ok(matched.length >= t.min, `Expected >= ${t.min} for "${t.query}", got ${matched.length}`);
    console.log(`  ✅ [PASS] "${t.query}" found ${matched.length} items`);
  }

  // Test 4: Common Thai Typos
  console.log('\n--- 4. Testing Common Thai Typos ---');
  const typoQueries = [
    { query: 'คีบอร์ด', min: 500 },
    { query: 'คีย์บอด', min: 500 }
  ];
  for (const t of typoQueries) {
    const matched = filterProductsByQuery(allItems, t.query);
    assert.ok(matched.length >= t.min, `Expected >= ${t.min} for "${t.query}", got ${matched.length}`);
    console.log(`  ✅ [PASS] "${t.query}" found ${matched.length} items`);
  }

  // Test 5: Fallback Zero Dead-End
  console.log('\n--- 5. Testing Zero Dead-End Fallback for Non-Existent Keywords ---');
  const nonExistentQuery = 'ฮาร์ดดิสก์';
  const exact = filterProductsByQuery(allItems, nonExistentQuery);
  assert.strictEqual(exact.length, 0, 'Should have 0 exact matches');
  const related = findRelatedProducts(allItems, nonExistentQuery, []);
  assert.ok(related.length > 0, 'Must return related fallback products');
  console.log(`  ✅ [PASS] "${nonExistentQuery}" returns ${related.length} related fallback products (Zero Dead-End)`);

  console.log('\n================================================================================');
  console.log('  🎉 ALL PHASE 2 VERIFICATION CHECKS PASSED 100%!');
  console.log('================================================================================\n');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
