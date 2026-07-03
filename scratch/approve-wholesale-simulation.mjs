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

  const taskId = '1PdyvHazTAWZvgKVRjcA';
  const orderId = 'OZbpmq4zlWbcEmZnZjPT';
  const managerUid = 'NJplV50wBOX02lKTQclEJ5pgVws2'; // AI Manager UID

  console.log(`============= SIMULATING MANAGER B2B APPROVAL =============`);

  const taskRef = db.collection('todos').doc(taskId);
  const orderRef = db.collection('orders').doc(orderId);

  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) {
    throw new Error(`Task ${taskId} not found`);
  }
  const taskData = taskSnap.data();

  const newTotals = {
    subtotal: 13695,
    discount: 432,
    netTotal: 13263,
    grandTotal: 13263,
    displayTotal: 13695,
    count: 8
  };

  const newItems = [
    { productId: 'LED14001', sku: 'LED14001', name: 'LED 14.0 ธรรมดา 30 PIN', price: 2175, priceAtPurchase: 2175, wholesalePriceApproved: 2175, quantity: 5 },
    { productId: 'LED14003', sku: 'LED14003', name: 'LED 14.0 ธรรมดา 40 PIN', price: 940, priceAtPurchase: 940, wholesalePriceApproved: 940, quantity: 3 },
    { productId: 'TO0158', sku: 'TO0158', name: 'กาวติดหูจอ (ของแถม)', price: 0, priceAtPurchase: 0, wholesalePriceApproved: 0, quantity: 1, isFreebie: true }
  ];

  await db.runTransaction(async (transaction) => {
    transaction.update(orderRef, {
      items: newItems,
      totals: newTotals,
      status: 'pending_payment',
      updatedAt: FieldValue.serverTimestamp(),
      wholesaleApprovedBy: managerUid
    });

    transaction.update(taskRef, {
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
      actionBy: 'ผู้จัดการ AI (ผู้ช่วย)',
      finalApprovedTotals: newTotals
    });

    const logRef = db.collection('system_logs').doc();
    transaction.set(logRef, {
      actionType: 'WHOLESALE_APPROVED',
      orderId,
      taskId,
      details: `อนุมัติราคาส่ง B2B ยอดสุทธิใหม่: ฿${newTotals.netTotal}`,
      createdBy: managerUid,
      createdAt: FieldValue.serverTimestamp()
    });

    const userLogRef = db.collection('users').doc(taskData.userId).collection('historyLogs').doc();
    transaction.set(userLogRef, {
      orderId,
      action: 'WHOLESALE_APPROVED',
      title: 'คำขอราคาส่งได้รับการอนุมัติ',
      description: `คำขอราคาส่งได้รับการอนุมัติแล้ว! ออเดอร์ #${orderId.slice(-6).toUpperCase()} ยอดชำระเงินใหม่ ฿${newTotals.netTotal}`,
      amount: newTotals.netTotal,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  console.log(`✅ Wholesale B2B request approved successfully. Order status updated to pending_payment.`);

  // Cleanup temp_adc.json
  const tempAdcPath = path.resolve('temp_adc.json');
  if (fs.existsSync(tempAdcPath)) {
    fs.unlinkSync(tempAdcPath);
  }
}

run().catch(console.error);
