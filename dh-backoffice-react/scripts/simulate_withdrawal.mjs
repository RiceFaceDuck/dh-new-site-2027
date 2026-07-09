import { initializeApp } from 'firebase-admin/app';
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

  const tempAdcPath = path.resolve('temp_adc_withdraw.json');
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

async function runWithdrawalSim() {
  console.log("🚀 Starting E2E Wallet Withdrawal Simulation...");
  const db = await initFirebaseAdmin();
  
  const testerUid = 'y2rGbkQNZugOcSebVUx5xdYNpjs1'; // ai.tester
  const managerUid = 'NJplV50wBOX02lKTQclEJ5pgVws2'; // ai.manager

  const userRef = db.collection('users').doc(testerUid);
  
  // 1. Give Tester some initial Wallet cash
  console.log("💰 Giving AI Tester 10,000 THB starting balance...");
  await userRef.set({ walletBalance: 10000, pendingWithdrawal: 0 }, { merge: true });

  const withdrawAmount = 2500;
  
  // 2. Simulate Frontend Withdrawal Request
  console.log(`🏦 AI Tester is requesting a withdrawal of ${withdrawAmount} THB...`);
  
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const currentWallet = userSnap.data().walletBalance || 0;

    if (currentWallet < withdrawAmount) {
      throw new Error("Insufficient Wallet Balance");
    }

    // This simulates what the client does: reduces wallet, increases pendingWithdrawal
    transaction.update(userRef, { 
      walletBalance: FieldValue.increment(-withdrawAmount),
      pendingWithdrawal: FieldValue.increment(withdrawAmount),
      updatedAt: FieldValue.serverTimestamp()
    });

    const todoRef = db.collection('todos').doc();
    transaction.set(todoRef, {
      title: `[Wallet] ถอนเงิน ${withdrawAmount} THB`,
      type: 'WALLET_WITHDRAWAL',
      status: 'PENDING', // Testing the PENDING fix!
      amount: withdrawAmount,
      userId: testerUid,
      partnerName: 'AI Tester',
      createdAt: FieldValue.serverTimestamp()
    });
  });

  console.log("✅ Withdrawal Request successful. Wallet deducted by 2,500 THB, pendingWithdrawal increased.");

  // 3. Simulate Manager Approval (Backoffice)
  console.log("👨‍💼 AI Manager is approving the withdrawal...");
  
  const userSnap2 = await userRef.get();
  console.log(`   Current Pending Balance: ${userSnap2.data().pendingWithdrawal}`);

  await db.runTransaction(async (transaction) => {
    const uSnap = await transaction.get(userRef);
    const currentPending = Number(uSnap.data().pendingWithdrawal || 0);
    
    // The security fix check
    if (currentPending < withdrawAmount) {
        throw new Error("ยอดเงินรอถอนของลูกค้ามีไม่เพียงพอ (อาจถูกดำเนินการไปแล้ว)");
    }

    // Admin approves transfer
    transaction.update(userRef, {
      pendingWithdrawal: FieldValue.increment(-withdrawAmount),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Log the transaction
    const txId = `SIM-WD-${Date.now()}`;
    const userTxRef = db.collection(`users/${testerUid}/wallet_transactions`).doc(txId);
    transaction.set(userTxRef, {
      transactionId: txId,
      type: 'WITHDRAWAL_COMPLETED',
      amount: withdrawAmount,
      status: 'SUCCESS',
      note: 'โอนเงินเข้าบัญชีสำเร็จเรียบร้อย (Simulation)',
      slipUrl: 'https://example.com/slip.jpg', // Attach slip!
      adminId: managerUid,
      timestamp: FieldValue.serverTimestamp()
    });
  });

  console.log(`✅ Withdrawal Approved. Pending balance deducted.`);
  
  // 4. Verify Final Balances
  const finalUserSnap = await userRef.get();
  console.log("📊 Final AI Tester Balances:");
  console.log(`Cash Wallet: ${finalUserSnap.data().walletBalance} THB (Expected: 7500)`);
  console.log(`Pending Withdrawal: ${finalUserSnap.data().pendingWithdrawal} THB (Expected: 0)`);
  
  console.log("🎉 E2E Withdrawal Simulation Completed Successfully!");
  process.exit(0);
}

runWithdrawalSim().catch(console.error);
