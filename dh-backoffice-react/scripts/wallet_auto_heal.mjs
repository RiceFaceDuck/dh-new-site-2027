import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import fs from 'fs';
import path from 'path';

async function initFirebaseAdmin() {
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-tools.json not found');
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) {
    throw new Error('No refresh token found in firebase-tools.json');
  }

  const tempAdcPath = path.resolve('temp_adc_heal.json');
  const adcContent = {
    type: 'authorized_user',
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: refreshToken
  };
  fs.writeFileSync(tempAdcPath, JSON.stringify(adcContent, null, 2));
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempAdcPath;

  const app = initializeApp({
    projectId: 'dh-notebook-69f3b'
  });

  return getFirestore(app);
}

async function runAutoHeal() {
  console.log("🔍 เริ่มต้นสแกนระบบ Wallet (Auto-Heal)...");
  let scannedCount = 0;
  let fixedCount = 0;

  try {
    const db = await initFirebaseAdmin();
    const usersSnapshot = await db.collection('users').get();
    
    const batch = db.batch();
    
    for (const doc of usersSnapshot.docs) {
      scannedCount++;
      const data = doc.data();
      let needsFix = false;
      let updates = {};

      let currentWallet = Number(data.walletBalance);
      if (isNaN(currentWallet)) currentWallet = 0;
      
      let currentPending = Number(data.pendingWithdrawal);
      if (isNaN(currentPending)) currentPending = 0;

      if (currentWallet < 0) {
        console.warn(`⚠️ พบยอดเงินติดลบในบัญชี ${doc.id} (Wallet: ${currentWallet}). กำลังแก้ไขเป็น 0...`);
        updates.walletBalance = 0;
        needsFix = true;
      }

      if (currentPending < 0) {
        console.warn(`⚠️ พบยอดรอถอนติดลบในบัญชี ${doc.id} (Pending: ${currentPending}). กำลังแก้ไขเป็น 0...`);
        updates.pendingWithdrawal = 0;
        needsFix = true;
      }

      if (needsFix) {
        updates.updatedAt = FieldValue.serverTimestamp();
        batch.update(doc.ref, updates);
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      console.log(`✅ พบข้อผิดพลาด ${fixedCount} บัญชี. กำลังบันทึกการแก้ไข...`);
      await batch.commit();
      console.log("✅ แก้ไขยอดเงินสำเร็จเรียบร้อยแล้ว");
    } else {
      console.log("✨ ยอดเยี่ยม! ไม่พบบัญชีที่ยอดเงินผิดปกติในระบบ (All wallets are secure)");
    }
    
    console.log(`📊 สรุป: สแกนทั้งหมด ${scannedCount} บัญชี | ซ่อมแซม ${fixedCount} บัญชี`);

  } catch (error) {
    console.error("🔥 เกิดข้อผิดพลาดขณะรัน Auto-Heal:", error);
  }
}

runAutoHeal();
