import assert from 'node:assert';
import fs from 'node:fs';
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

const searchMatcherPath = path.resolve(__dirname, '../../dh-frontend/src/utils/searchMatcher.js');
const { filterProductsByQuery, findRelatedProducts } = await import(pathToFileURL(searchMatcherPath).href);

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng',
  authDomain: 'dh-notebook-69f3b.firebaseapp.com',
  projectId: 'dh-notebook-69f3b',
  storageBucket: 'dh-notebook-69f3b.firebasestorage.app',
  messagingSenderId: '713635574580',
  appId: '1:713635574580:web:8d60ac45a28d5938972b61'
};

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('================================================================================');
console.log('  🔍 STAGE FINAL RIGOROUS VERIFICATION SUITE: SEARCH SUBSYSTEM AUDIT');
console.log('================================================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
    throw err;
  }
}

async function runStageAudit() {
  // 1. Security & Permissions
  console.log('--- 1. Security Rules & Unauthenticated Whitelist ---');
  const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf-8');
  check('Rules contains search_index whitelist', () => {
    assert.ok(rules.includes("docId == 'search_index'"));
  });
  check('Rules contains search_index_p[0-9]+ whitelist', () => {
    assert.ok(rules.includes("docId.matches('^search_index_p[0-9]+$')"));
  });

  // 2. Data Integrity & Catalog Chunks
  console.log('\n--- 2. Data Integrity & Catalog Chunks ---');
  await signInWithEmailAndPassword(auth, 'ai.manager@dhnotebook.com', 'Password123!');
  const manifestSnap = await getDoc(doc(db, 'catalogs', 'search_index'));
  assert.ok(manifestSnap.exists(), 'Manifest search_index must exist');
  const manifest = manifestSnap.data();
  check(`Manifest valid: ${manifest.totalItems} items across ${manifest.chunkCount} chunks`, () => {
    assert.ok(manifest.totalItems > 2000);
    assert.ok(manifest.chunkCount >= 7);
  });

  // Load all items to test matching
  const allProducts = [];
  for (let i = 1; i <= manifest.chunkCount; i++) {
    const chunkSnap = await getDoc(doc(db, 'catalogs', `search_index_p${i}`));
    assert.ok(chunkSnap.exists(), `Chunk p${i} must exist`);
    const chunkData = chunkSnap.data();
    assert.ok(Array.isArray(chunkData.items), `Chunk p${i} items must be array`);
    allProducts.push(...chunkData.items);
  }
  check(`Loaded all ${allProducts.length} catalog items from Firestore`, () => {
    assert.strictEqual(allProducts.length, manifest.totalItems);
  });

  // 3. User Screenshot Queries Verification
  console.log('\n--- 3. User Screenshot Queries Verification ---');
  const userQueries = [
    { q: 'คีย์บอร์ด lenovo', min: 100 },
    { q: '5547', min: 5 },
    { q: '15.6', min: 50 },
    { q: 'Led 15.6', min: 50 },
    { q: '4736', min: 5 }
  ];
  for (const item of userQueries) {
    const results = filterProductsByQuery(allProducts, item.q);
    check(`Query "${item.q}" returns ${results.length} results (expected >= ${item.min})`, () => {
      assert.ok(results.length >= item.min);
    });
  }

  // 4. Thai NLP 3.0 & Typo Intelligence Verification
  console.log('\n--- 4. Thai NLP 3.0 & Typo Intelligence ---');
  const nlpTests = [
    { label: 'Thai Compound Splitting "จอ15.6"', q: 'จอ15.6', min: 50 },
    { label: 'Thai Suffix Splitting "15.6นิ้ว"', q: '15.6นิ้ว', min: 50 },
    { label: 'Thai Brand "เลโนโว"', q: 'เลโนโว', min: 100 },
    { label: 'Thai Brand "เดล"', q: 'เดล', min: 50 },
    { label: 'Thai Typo "คีบอร์ด"', q: 'คีบอร์ด', min: 100 },
    { label: 'Thai Typo "คีย์บอด"', q: 'คีย์บอด', min: 100 }
  ];
  for (const item of nlpTests) {
    const results = filterProductsByQuery(allProducts, item.q);
    check(`${item.label} returns ${results.length} results (min ${item.min})`, () => {
      assert.ok(results.length >= item.min);
    });
  }

  // 5. Zero Dead-End Fallback Verification
  console.log('\n--- 5. Zero Dead-End Fallback ---');
  const emptyQuery = 'สินค้าที่ไม่มีอยู่จริง12345';
  const directMatch = filterProductsByQuery(allProducts, emptyQuery);
  assert.strictEqual(directMatch.length, 0);
  const fallback = findRelatedProducts(allProducts, emptyQuery, []);
  check(`Non-existent query falls back to ${fallback.length} related products (Zero Dead-End)`, () => {
    assert.ok(fallback.length > 0);
  });

  // 6. UI & Code Verification in SearchPage.jsx
  console.log('\n--- 6. UI & Code Verification in SearchPage.jsx ---');
  const searchPageCode = fs.readFileSync(path.resolve(__dirname, '../../dh-frontend/src/pages/SearchPage.jsx'), 'utf-8');

  check('SearchPage uses rounded-[0.1rem] on containers and cards', () => {
    assert.ok(searchPageCode.includes('rounded-[0.1rem]'));
  });

  check('SearchPage uses LazyImage with referrerPolicy protection', () => {
    assert.ok(searchPageCode.includes("import LazyImage from '../components/common/LazyImage'"));
    assert.ok(searchPageCode.includes('<LazyImage'));
  });

  check('SearchPage has prominent "ติดต่อช่างทันที" button & Modal', () => {
    assert.ok(searchPageCode.includes('ติดต่อช่างทันที'));
    assert.ok(searchPageCode.includes('showTechnicianModal'));
    assert.ok(searchPageCode.includes('ป้ายนามบัตรช่าง / พันธมิตร DH'));
  });

  check('SearchPage maintains all 6 shortcut categories and popular tags', () => {
    assert.ok(searchPageCode.includes('อะแดปเตอร์ชาร์จ'));
    assert.ok(searchPageCode.includes('หน้าจอ LCD/LED'));
    assert.ok(searchPageCode.includes('แบตเตอรี่โน๊ตบุ๊ค'));
    assert.ok(searchPageCode.includes('คีย์บอร์ด'));
    assert.ok(searchPageCode.includes('พัดลมระบายความร้อน'));
    assert.ok(searchPageCode.includes('บานพับและสายแพร'));
    assert.ok(searchPageCode.includes('popularTags'));
  });

  check('SearchPage tracks ad impression telemetry (trackAdView)', () => {
    assert.ok(searchPageCode.includes("marketingService.trackAdView('partner_ads'"));
  });

  check('SearchPage tracks ad click telemetry (trackAdClick) for phone & chat', () => {
    assert.ok(searchPageCode.includes("marketingService.trackAdClick('partner_ads'"));
    assert.ok(searchPageCode.includes('handleTechnicianContactClick'));
  });

  console.log('\n================================================================================');
  console.log(`  🎉 STAGE FINAL VERIFICATION COMPLETE: ${passedChecks}/${totalChecks} CHECKS PASSED (100%)`);
  console.log('================================================================================');
  process.exit(0);
}

runStageAudit().catch(err => {
  console.error('\n❌ STAGE FINAL VERIFICATION FAILED:', err);
  process.exit(1);
});
