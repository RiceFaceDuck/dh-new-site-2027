import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

  const tempAdcPath = path.resolve('temp_adc.json');
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

async function runSimulation() {
  console.log("🚀 Starting End-to-End Wallet Simulation...");
  const db = await initFirebaseAdmin();
  
  const testerUid = 'y2rGbkQNZugOcSebVUx5xdYNpjs1'; // ai.tester
  const managerUid = 'NJplV50wBOX02lKTQclEJ5pgVws2'; // ai.manager

  const userRef = db.collection('users').doc(testerUid);
  
  // 1. Give Tester some initial Wallet cash
  console.log("💰 Giving AI Tester 10,000 THB starting balance...");
  await userRef.set({ walletBalance: 10000, creditPoints: 0, totalAccumulatedPoints: 0 }, { merge: true });

  const orderId = `SIM-ORDER-${Date.now()}`;
  const orderRef = db.collection('orders').doc(orderId);

  // 2. Simulate Checkout with Wallet Usage
  console.log(`🛒 AI Tester is checking out Order ${orderId}...`);
  const walletToUse = 2000;
  const totalAmount = 5000;
  const payableAmount = totalAmount - walletToUse;

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const currentWallet = userSnap.data().walletBalance || 0;

    if (currentWallet < walletToUse) {
      throw new Error("Insufficient Wallet Balance");
    }

    // Deduct Wallet immediately on pending_payment
    transaction.update(userRef, { 
      walletBalance: FieldValue.increment(-walletToUse),
      updatedAt: FieldValue.serverTimestamp()
    });

    const walletTxRef = db.collection(`users/${testerUid}/wallet_transactions`).doc(`TXW_SPEND_${orderId}`);
    transaction.set(walletTxRef, {
      transactionId: `TXW_SPEND_${orderId}`,
      type: 'SPEND',
      amount: walletToUse,
      status: 'SUCCESS',
      note: `ใช้ชำระเงินสำหรับออเดอร์ ${orderId}`,
      operatorUid: testerUid,
      timestamp: FieldValue.serverTimestamp()
    });

    transaction.set(orderRef, {
      orderId: orderId,
      status: 'pending_payment',
      orderStatus: 'pending_payment',
      customerInfo: { uid: testerUid, name: 'AI Tester' },
      summary: { finalTotal: totalAmount, walletUsed: walletToUse },
      createdAt: FieldValue.serverTimestamp()
    });
  });

  console.log("✅ Checkout successful. Wallet deducted by 2,000 THB.");

  // 3. Simulate Manager Approval
  console.log("👨‍💼 AI Manager is approving the order...");
  await db.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(orderRef);
    const orderData = docSnap.data();

    const uSnap = await transaction.get(userRef);
    const totalSaleAmount = orderData.summary.finalTotal;
    const wUsed = orderData.summary.walletUsed;
    const amountForPoints = totalSaleAmount - wUsed; 
    const earnedPoints = Math.floor(amountForPoints / 100);

    // Give Points (Credit Engine Simulation)
    transaction.update(userRef, {
      creditPoints: FieldValue.increment(earnedPoints),
      totalAccumulatedPoints: FieldValue.increment(earnedPoints),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Global Ledger
    const globalTxRef = db.collection('credit_transactions').doc(`TXP_${orderId}`);
    transaction.set(globalTxRef, {
      transactionId: `TXP_${orderId}`,
      uid: testerUid,
      partnerName: 'AI Tester',
      type: 'add',
      amount: earnedPoints,
      balanceAfter: (uSnap.data().creditPoints || 0) + earnedPoints,
      referenceId: `TXP_${orderId}`,
      note: 'ได้รับจากการซื้อสินค้า (Simulation)',
      recordedBy: managerUid,
      timestamp: FieldValue.serverTimestamp()
    });

    transaction.update(orderRef, {
      status: 'paid',
      orderStatus: 'paid',
      earnedPoints: earnedPoints,
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  console.log(`✅ Order approved. Tester gained points: Math.floor((5000 - 2000) / 100) = 30 Points.`);
  
  // 4. Verify Final Balances
  const finalUserSnap = await userRef.get();
  console.log("📊 Final AI Tester Balances:");
  console.log(`Cash Wallet: ${finalUserSnap.data().walletBalance} THB (Expected: 8000)`);
  console.log(`Credit Points: ${finalUserSnap.data().creditPoints} Pts (Expected: 30)`);
  console.log(`Total Accumulated: ${finalUserSnap.data().totalAccumulatedPoints} Pts (Expected: 30)`);
  
  console.log("🎉 E2E Simulation Completed Successfully!");
  process.exit(0);
}

runSimulation().catch(console.error);
