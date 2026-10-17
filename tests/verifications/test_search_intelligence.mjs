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

const { filterProductsByQuery, findRelatedProducts, tokenizeQuery, getExpandedTerms, SEARCH_SYNONYMS } = await import(pathToFileURL(path.resolve(__dirname, '../../dh-frontend/src/utils/searchMatcher.js')).href);

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

async function testIntelligence() {
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

  const queries = [
    // Typo Thai
    'คีบอร์ด', // no ์
    'คีย์บอด', // no ร
    'เลโนโว',
    'เดล',
    'เอเซอร์',
    'เอซุส',
    'ฮาร์ดดิสก์',
    'จอ15.6', // no space
    '15.6นิ้ว',
    '14นิ้ว',
    'adapter dell 65w',
    'สายไฟ lenovo',
    'บานพับ asus 550',
    'พัดลม acer 4736'
  ];

  console.log('=== SEARCH INTELLIGENCE AUDIT ===');
  for (const q of queries) {
    const tokens = tokenizeQuery(q);
    const matched = filterProductsByQuery(allItems, q);
    console.log(`\nQuery: "${q}" | Tokens: [${tokens.join(', ')}] -> Exact/AND Matches: ${matched.length}`);
    if (matched.length > 0) {
      console.log(`  Top Result: [${matched[0].sku}] ${matched[0].name}`);
    } else {
      const related = findRelatedProducts(allItems, q, []);
      console.log(`  No exact match. Related Products found: ${related.length}`);
      if (related.length > 0) {
        console.log(`  Top Related: [${related[0].sku}] ${related[0].name}`);
      }
    }
  }
  process.exit(0);
}

testIntelligence().catch(err => {
  console.error(err);
  process.exit(1);
});
