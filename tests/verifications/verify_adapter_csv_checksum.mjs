import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKOFFICE_ROOT = path.resolve(__dirname, '../../dh-backoffice-react');

// Dynamic import of xlsx and firebase from dh-backoffice-react node_modules
const XLSX = (await import(`file://${path.resolve(BACKOFFICE_ROOT, 'node_modules/xlsx/xlsx.mjs').replace(/\\/g, '/')}`)).default || await import(`file://${path.resolve(BACKOFFICE_ROOT, 'node_modules/xlsx/xlsx.mjs').replace(/\\/g, '/')}`);

const { initializeApp } = await import(`file://${path.resolve(BACKOFFICE_ROOT, 'node_modules/firebase/app/dist/index.mjs').replace(/\\/g, '/')}`);
const { getAuth, signInWithEmailAndPassword } = await import(`file://${path.resolve(BACKOFFICE_ROOT, 'node_modules/firebase/auth/dist/index.mjs').replace(/\\/g, '/')}`);
const { getFirestore, doc, getDoc, getDocs, collection, query, where, documentId } = await import(`file://${path.resolve(BACKOFFICE_ROOT, 'node_modules/firebase/firestore/dist/index.mjs').replace(/\\/g, '/')}`);

const firebaseConfig = {
  apiKey: "AIzaSyBSl7KV5HheJ4MSKR7udZkrMKQdSUBLJng",
  authDomain: "dh-notebook-69f3b.firebaseapp.com",
  projectId: "dh-notebook-69f3b",
  storageBucket: "dh-notebook-69f3b.firebasestorage.app",
  messagingSenderId: "713635574580",
  appId: "1:713635574580:web:8d60ac45a28d5938972b61"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runChecksum() {
  console.log('================================================================================');
  console.log('📊 CHECKSUM VERIFICATION: Adapter.csv VS FIRESTORE LIVE DATABASE');
  console.log('================================================================================\n');

  // 1. Read Adapter.csv (อ่านผ่าน buffer เพื่อป้องกัน file lock)
  const tempCopyPath = path.resolve(__dirname, '../temp_adapter.xlsx');
  const fileBuf = fs.readFileSync(tempCopyPath);
  const wb = XLSX.read(fileBuf, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`[1] อ่านไฟล์ Adapter.csv: พบทั้งหมด ${rawRows.length} แถว`);

  // Filter valid rows (exclude template example EXM-001 if needed)
  const itemsToCheck = rawRows.filter(r => {
    const sku = String(r['SKU'] || '').trim().toUpperCase();
    return sku && sku !== 'EXM-001';
  });
  console.log(`[2] รายการสินค้าจริงที่จะตรวจสอบ (ตัด EXM-001): ${itemsToCheck.length} รายการ\n`);

  // 2. Authenticate
  try {
    await signInWithEmailAndPassword(auth, "ai.manager@dhnotebook.com", "Password123!");
    console.log('[3] เชื่อมต่อและยืนยันสิทธิ์เข้า Firestore สำเร็จ');
  } catch (err) {
    console.log('[3] เชื่อมต่อ Firestore แบบ Guest/Public:', err.message);
  }

  // 3. Batch fetch from Firestore (ก้อนละ 30 ตามโควต้า)
  console.log('[4] กำลังดึงข้อมูลสินค้าจริงจาก Firestore เพื่อตรวจสอบ Checksum...');
  const skus = itemsToCheck.map(r => String(r['SKU']).trim().toUpperCase());
  const firestoreMap = new Map();

  const chunks = [];
  for (let i = 0; i < skus.length; i += 30) {
    chunks.push(skus.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const q = query(collection(db, 'products'), where(documentId(), 'in', chunk));
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      firestoreMap.set(docSnap.id, docSnap.data());
    });
  }
  console.log(`[✓] ดึงข้อมูลสินค้าจาก Firestore สำเร็จ: ${firestoreMap.size}/${skus.length} รายการที่มีอยู่ในระบบ\n`);

  // 4. Compare every item
  let stockMatches = 0;
  let stockMismatches = [];
  let priceMatches = 0;
  let priceMismatches = [];
  let notFoundInDb = [];
  let namePreservedCount = 0;
  let nameCorruptedCount = 0;

  for (const row of itemsToCheck) {
    const sku = String(row['SKU']).trim().toUpperCase();
    const dbItem = firestoreMap.get(sku);

    if (!dbItem) {
      notFoundInDb.push(sku);
      continue;
    }

    // Check Name preservation (Must not be wiped out or set to SKU if db had real name)
    if (dbItem.name && dbItem.name !== sku) {
      namePreservedCount++;
    } else if (!dbItem.name) {
      nameCorruptedCount++;
    }

    // Check Stock
    if (row['StockQuantity'] !== '' && row['StockQuantity'] !== undefined) {
      const csvStock = Number(row['StockQuantity']);
      const dbStock = Number(dbItem.stockQuantity ?? 0);
      if (csvStock === dbStock) {
        stockMatches++;
      } else {
        stockMismatches.push({ sku, csvStock, dbStock, diff: dbStock - csvStock });
      }
    }

    // Check Price
    if (row['Price'] !== '' && row['Price'] !== undefined) {
      const csvPrice = Number(row['Price']);
      const dbPrice = Number(dbItem.Price ?? dbItem.price ?? 0);
      if (csvPrice === dbPrice) {
        priceMatches++;
      } else {
        priceMismatches.push({ sku, csvPrice, dbPrice });
      }
    }
  }

  // 5. Output Results
  console.log('================================================================================');
  console.log('📈 สรุปผลการตรวจสอบ CHECKSUM ระหว่าง Adapter.csv กับ Firestore');
  console.log('================================================================================');
  console.log(`• จำนวนสินค้าในไฟล์ CSV:           ${itemsToCheck.length} รายการ`);
  console.log(`• พบสินค้าในฐานข้อมูล Firestore:    ${firestoreMap.size} รายการ`);
  if (notFoundInDb.length > 0) {
    console.log(`• สินค้าใหม่ที่ยังไม่มีในฐานข้อมูล:   ${notFoundInDb.length} รายการ (${notFoundInDb.slice(0, 5).join(', ')}...)`);
  }
  console.log('--------------------------------------------------------------------------------');
  console.log(`• Checksum สต็อกตรงกัน (Stock Matches): ${stockMatches} รายการ`);
  if (stockMismatches.length > 0) {
    console.log(`  ⚠️ มีสต็อกไม่ตรง: ${stockMismatches.length} รายการ:`);
    stockMismatches.slice(0, 10).forEach(m => {
      console.log(`     - SKU ${m.sku}: ใน CSV = ${m.csvStock} | ใน Firestore = ${m.dbStock} (ต่าง ${m.diff})`);
    });
  } else {
    console.log(`  ✅ สต็อกสินค้าทุกรายการตรงกับ Adapter.csv 100%!`);
  }
  console.log('--------------------------------------------------------------------------------');
  console.log(`• Checksum ราคาส่งตรงกัน (Price Matches): ${priceMatches} รายการ`);
  if (priceMismatches.length > 0) {
    console.log(`  ⚠️ มีราคาไม่ตรง: ${priceMismatches.length} รายการ:`);
    priceMismatches.slice(0, 10).forEach(m => {
      console.log(`     - SKU ${m.sku}: ใน CSV = ${m.csvPrice} | ใน Firestore = ${m.dbPrice}`);
    });
  } else {
    console.log(`  ✅ ราคาสินค้าทุกรายการตรงกับ Adapter.csv 100%!`);
  }
  console.log('--------------------------------------------------------------------------------');
  console.log(`• การคงชื่อสินค้าเดิม (Name Preservation): คงชื่อจริงไว้ได้ ${namePreservedCount} รายการ (ชื่อว่าง/เสียหาย: ${nameCorruptedCount})`);
  console.log('================================================================================\n');

  process.exit(0);
}

function assertExists(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[❌] ไม่พบไฟล์ที่: ${filePath}`);
    process.exit(1);
  }
}

runChecksum().catch(err => {
  console.error("🔥 Error in runChecksum:", err);
  process.exit(1);
});
