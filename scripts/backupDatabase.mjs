import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = 'dh-notebook-69f3b';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Collections to backup
const COLLECTIONS = [
  'users',
  'products',
  'orders',
  'claims',
  'system_logs'
];

// Helper to make HTTPS requests
const request = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data || '{}') });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

async function fetchCollection(collectionId) {
  let allDocs = [];
  let pageToken = '';
  
  console.log(`[+] เริ่มดึงข้อมูลคอลเลกชัน: ${collectionId}...`);
  
  do {
    // Note: Max pageSize is typically 300 for Firestore REST API, but let's request 1000.
    const url = `${BASE_URL}/${collectionId}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await request(url);
    
    if (res.statusCode !== 200) {
      throw new Error(`Failed to fetch ${collectionId}: ${JSON.stringify(res.data)}`);
    }

    if (res.data.documents) {
      allDocs = allDocs.concat(res.data.documents);
    }
    
    pageToken = res.data.nextPageToken || '';
    if (pageToken) {
      console.log(`    ...ดึงข้อมูล ${collectionId} เพิ่มเติม (ปัจจุบัน ${allDocs.length} รายการ)`);
    }

  } while (pageToken);

  console.log(`[✓] โหลด ${collectionId} สำเร็จ (รวม ${allDocs.length} รายการ)`);
  return allDocs;
}

async function runBackup() {
  console.log("=========================================");
  console.log("   🚀 DH NOTEBOOK: FIRESTORE BACKUP");
  console.log("=========================================\n");

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  const backupDir = path.join(__dirname, '..', 'backups', `${dateStr}_${timeStr}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  let totalSize = 0;

  for (const col of COLLECTIONS) {
    try {
      const docs = await fetchCollection(col);
      const filePath = path.join(backupDir, `${col}.json`);
      const fileData = JSON.stringify(docs, null, 2);
      
      fs.writeFileSync(filePath, fileData);
      const sizeKB = (Buffer.byteLength(fileData, 'utf8') / 1024).toFixed(2);
      totalSize += Number(sizeKB);
      console.log(`    💾 บันทึกไฟล์ ${col}.json สำเร็จ (${sizeKB} KB)\n`);
    } catch (err) {
      console.error(`[❌] เกิดข้อผิดพลาดในการโหลด ${col}:`, err.message);
    }
  }

  console.log("=========================================");
  console.log(`🎉 BACKUP SUCCESSFUL!`);
  console.log(`📁 ถูกจัดเก็บไว้ที่: backups/${dateStr}_${timeStr}`);
  console.log(`📦 ขนาดรวม: ${(totalSize / 1024).toFixed(2)} MB`);
  console.log("=========================================");
}

runBackup().catch(console.error);
