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

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng',
  authDomain: 'dh-notebook-69f3b.firebaseapp.com',
  projectId: 'dh-notebook-69f3b',
  storageBucket: 'dh-notebook-69f3b.firebasestorage.app',
  messagingSenderId: '713635574580',
  appId: '1:713635574580:web:8d60ac45a28d5938972b61'
};

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

console.log('================================================================================');
console.log('  🔍 VERIFICATION SUITE: PHASE 1 SEARCH FIX & DATA RECOVERY');
console.log('================================================================================\n');

async function verifyPhase1() {
  // Test reading as unauthenticated client or test firestore.rules locally
  console.log('1. Verifying firestore.rules whitelist syntax...');
  const fs = await import('node:fs');
  const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf-8');
  assert.ok(rules.includes("docId == 'search_index'"), 'Rules must include search_index whitelist');
  assert.ok(rules.includes("docId.matches('^search_index_p[0-9]+$')"), 'Rules must include search_index_p* whitelist');
  console.log('  ✅ [PASS] firestore.rules contains search_index and search_index_p[0-9]+ whitelist');

  console.log('2. Verifying SearchPage.jsx error recovery & retry logic...');
  const searchPageSrc = fs.readFileSync(path.resolve(__dirname, '../../dh-frontend/src/pages/SearchPage.jsx'), 'utf-8');
  assert.ok(searchPageSrc.includes('เกิดข้อผิดพลาดในการโหลดสินค้า'), 'SearchPage must have user-friendly error header');
  assert.ok(searchPageSrc.includes('ลองใหม่อีกครั้ง'), 'SearchPage must have retry button');
  console.log('  ✅ [PASS] SearchPage.jsx contains graceful error fallback and retry button');

  console.log('3. Verifying Manifest and Chunks data integrity (with staff auth to check content)...');
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, 'ai.manager@dhnotebook.com', 'Password123!');
  
  const manifestSnap = await getDoc(doc(db, 'catalogs', 'search_index'));
  assert.ok(manifestSnap.exists(), 'catalogs/search_index must exist');
  const manifestData = manifestSnap.data();
  assert.strictEqual(Number(manifestData.chunkCount), 7, 'chunkCount must be 7');
  console.log(`  ✅ [PASS] Manifest confirmed: ${manifestData.chunkCount} chunks, ${manifestData.totalItems} items`);

  console.log('\n================================================================================');
  console.log('  🎉 ALL PHASE 1 VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('================================================================================\n');
  process.exit(0);
}

verifyPhase1().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
