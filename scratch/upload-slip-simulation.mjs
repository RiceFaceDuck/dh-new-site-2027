import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function initFirebase() {
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const refreshToken = config.tokens?.refresh_token;
  const tempAdcPath = path.resolve('temp_adc.json');
  const adcContent = {
    type: 'authorized_user',
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: refreshToken
  };
  fs.writeFileSync(tempAdcPath, JSON.stringify(adcContent, null, 2));
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempAdcPath;
  initializeApp({
    projectId: 'dh-notebook-69f3b'
  });
}

async function run() {
  initFirebase();
  const db = getFirestore();

  const orderId = 'OZbpmq4zlWbcEmZnZjPT';
  const testerUid = 'y2rGbkQNZugOcSebVUx5xdYNpjs1'; // AI Tester Customer UID
  const mockSlipUrl = 'https://dummyimage.com/600x800/080/fff.png&text=MOCK+B2B+SLIP+13,263+THB';

  console.log(`============= SIMULATING CUSTOMER SLIP UPLOAD =============`);

  const orderRef = db.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error(`Order ${orderId} not found`);
  }
  const orderData = orderSnap.data();

  const todoRef = db.collection('todos').doc();
  const todoDocId = todoRef.id;

  await db.runTransaction(async (transaction) => {
    transaction.update(orderRef, {
      paymentSlipUrl: mockSlipUrl,
      status: 'pending_payment_verification',
      updatedAt: FieldValue.serverTimestamp()
    });

    transaction.set(todoRef, {
      type: 'verify_slip',
      status: 'pending',
      title: `ตรวจสอบการชำระเงิน: ออเดอร์ #${orderId.slice(-6).toUpperCase()}`,
      orderId: orderId,
      userId: testerUid,
      customerName: 'AI Technical Service (ร้านซ่อมปัญญาประดิษฐ์)',
      amount: orderData.totals?.netTotal || 13263,
      slipUrl: mockSlipUrl,
      requestedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    });

    const userLogRef = db.collection('users').doc(testerUid).collection('historyLogs').doc();
    transaction.set(userLogRef, {
      orderId,
      action: 'UPLOAD_SLIP',
      title: 'แจ้งชำระเงินเรียบร้อย',
      description: `ลูกค้าได้ส่งหลักฐานการโอนเงินจำนวน ฿${orderData.totals?.netTotal || 13263} เรียบร้อยแล้ว ขณะนี้รอพนักงานตรวจสอบ`,
      amount: orderData.totals?.netTotal || 13263,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  console.log(`✅ Customer slip uploaded. Order status updated to pending_payment_verification.`);
  console.log(`Slip Verification Todo ID: ${todoDocId}`);

  // Cleanup temp_adc.json
  const tempAdcPath = path.resolve('temp_adc.json');
  if (fs.existsSync(tempAdcPath)) {
    fs.unlinkSync(tempAdcPath);
  }
}

run().catch(console.error);
