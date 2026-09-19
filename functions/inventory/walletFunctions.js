const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

exports.requestWithdrawal = onCall({ region: "asia-southeast1" }, async (request) => {
  const { amount, bankInfo, idempotencyKey } = request.data || {};
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "กรุณาเข้าสู่ระบบ");
  }

  const safeAmount = Math.round(Number(amount) * 100) / 100;
  if (isNaN(safeAmount) || safeAmount <= 0 || !bankInfo) {
    throw new HttpsError("invalid-argument", "ข้อมูลไม่ครบถ้วน หรือยอดเงินไม่ถูกต้อง");
  }

  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);
  
  // 🛡️ Deterministic Idempotency Key
  const safeIdempotencyKey = (typeof idempotencyKey === 'string' && idempotencyKey.trim())
    ? idempotencyKey.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
    : null;
  const txId = safeIdempotencyKey ? `WD-${safeIdempotencyKey}` : `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const result = await db.runTransaction(async (transaction) => {
      // 1. All Reads First: Check if this transaction has already been processed
      const userTxRef = userRef.collection("wallet_transactions").doc(txId);
      const existingTxSnap = await transaction.get(userTxRef);
      if (existingTxSnap.exists) {
        console.warn(`[WalletFunctions] Duplicate withdrawal request detected for txId: ${txId}. Returning existing transaction.`);
        return { success: true, transactionId: txId, duplicate: true };
      }

      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new HttpsError("not-found", "ไม่พบข้อมูลผู้ใช้งาน");

      const userData = userSnap.data();
      const currentBalance = Number(userData.walletBalance || 0);

      if (currentBalance < safeAmount) {
        throw new HttpsError("failed-precondition", "ยอดเงินค้างในระบบไม่เพียงพอต่อการถอน");
      }

      const balanceAfter = Math.round((currentBalance - safeAmount) * 100) / 100;

      // 2. All Writes
      transaction.update(userRef, {
        walletBalance: balanceAfter,
        pendingWithdrawal: FieldValue.increment(safeAmount),
        updatedAt: FieldValue.serverTimestamp()
      });

      transaction.set(userTxRef, {
        transactionId: txId,
        type: 'WITHDRAWAL_REQUEST',
        amount: safeAmount,
        balanceBefore: currentBalance,
        balanceAfter: balanceAfter,
        status: 'PENDING',
        bankInfo: bankInfo,
        note: 'รอตรวจสอบและโอนเงิน (ดำเนินการได้ใน 14 วัน)',
        timestamp: FieldValue.serverTimestamp(),
        customerName: userData.displayName || userData.accountName || 'Unknown'
      });

      const todoRef = db.collection("todos").doc(`WD-${userId}-${txId}`);
      transaction.set(todoRef, {
        taskId: txId,
        taskType: 'WALLET_WITHDRAWAL',
        status: 'PENDING',
        priority: 'HIGH',
        customer: {
          uid: userId,
          name: userData.displayName || userData.accountName || 'ลูกค้า',
          phone: userData.phoneNumber || ''
        },
        withdrawalDetails: {
          amount: safeAmount,
          bankName: bankInfo.bankName,
          accountName: bankInfo.accountName,
          accountNumber: bankInfo.accountNumber
        },
        createdAt: FieldValue.serverTimestamp(),
        createdBy: userId
      });

      return { success: true, transactionId: txId };
    });

    return result;
  } catch (error) {
    console.error("Withdrawal Failed:", error);
    throw new HttpsError("internal", error.message);
  }
});

exports.processWalletPayment = onCall({ region: "asia-southeast1" }, async (request) => {
  const { orderId, useWallet } = request.data;
  const userId = request.auth?.uid;

  if (!userId) throw new HttpsError("unauthenticated", "กรุณาเข้าสู่ระบบ");
  if (!orderId || !useWallet || useWallet <= 0) throw new HttpsError("invalid-argument", "ข้อมูลไม่ถูกต้อง");

  const db = getFirestore();
  const userRef = db.collection("users").doc(userId);
  const orderRef = db.collection("orders").doc(orderId);

  try {
    const { calculateOrderCanonicalTotals } = await import("dh-shared");
    
    await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const orderSnap = await transaction.get(orderRef);

      if (!userSnap.exists) throw new HttpsError("not-found", "ไม่พบข้อมูลผู้ใช้");
      if (!orderSnap.exists) throw new HttpsError("not-found", "ไม่พบคำสั่งซื้อ");

      const userData = userSnap.data();
      const orderData = orderSnap.data();

      if (orderData.userId !== userId) throw new HttpsError("permission-denied", "ไม่ใช่คำสั่งซื้อของคุณ");
      if (orderData.isPaid) throw new HttpsError("failed-precondition", "คำสั่งซื้อนี้ชำระเงินแล้ว");
      
      const currentBalance = Number(userData.walletBalance || 0);
      if (currentBalance < useWallet) throw new HttpsError("failed-precondition", "ยอดเงินไม่เพียงพอ");

      // Verify Canonical Total to prevent Math Tampering
      const canonical = calculateOrderCanonicalTotals(orderData);
      const expectedNetTotal = canonical.netTotal;
      const submittedNetTotal = Number(orderData.netTotal || orderData.totalAmount || 0);
      
      // We use the higher value or the canonical one to prevent spoofing
      const trueNetTotal = Math.abs(expectedNetTotal - submittedNetTotal) > 10 ? expectedNetTotal : submittedNetTotal;

      const balanceAfter = Math.round((currentBalance - useWallet) * 100) / 100;
      
      const txId = `TXW-${orderId}`;
      const userTxRef = userRef.collection("wallet_transactions").doc(txId);

      transaction.update(userRef, {
        walletBalance: balanceAfter,
        lastWalletTxId: txId,
        updatedAt: FieldValue.serverTimestamp()
      });

      transaction.set(userTxRef, {
        transactionId: txId,
        type: 'SPEND',
        amount: useWallet,
        balanceAfter: balanceAfter,
        status: 'SUCCESS',
        note: `ใช้ยอดค้างในระบบสำหรับออเดอร์ ${orderId}`,
        timestamp: FieldValue.serverTimestamp()
      });

      transaction.update(orderRef, {
        walletUsed: useWallet,
        pendingCredits: Math.max(0, trueNetTotal - useWallet),
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Wallet Payment Failed:", error);
    throw new HttpsError("internal", error.message);
  }
});
