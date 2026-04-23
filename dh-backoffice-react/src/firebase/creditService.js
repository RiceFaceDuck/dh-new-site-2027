import { doc, getDoc, setDoc, serverTimestamp, runTransaction, collection } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

const SETTINGS_DOC = 'credit_config';

export const creditService = {
  /**
   * 🌟 ดึงข้อมูลการตั้งค่าระบบ Credit และ Master Ledger
   * (ใช้วิธี Caching ของ Firestore เพื่อประหยัด Reads)
   */
  getCreditSettings: async () => {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      // Default Settings (กรณีเริ่มต้นระบบครั้งแรก)
      const defaultSettings = {
        // --- 🛡️ DH Cyber Audit Core: Master Ledger ---
        ledger: {
          systemPoolMax: 1000000,  // ทุนสำรองเครดิตสูงสุด (เพดานหนี้)
          totalAllocated: 0,       // เครดิตที่จ่ายออกไปแล้วสะสม (เชื่อมต่อกับระบบคำนวณในอนาคต)
          lastAuditTime: serverTimestamp(),
          status: 'SECURE'         // SECURE, WARNING, BREACHED
        },
        // --- การตั้งค่าทั่วไป ---
        pointToCashRatio: 1, // 1 Credit = 1 THB
        pendingDays: 11,     // ระยะเวลารอคอยก่อนใช้งาน
        rewardRules: {
          review: 10,
          knowledgeSharing: 50,
          referral: 100
        },
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, defaultSettings);
      return defaultSettings;

    } catch (error) {
      console.error("🔥 System Error [getCreditSettings]:", error);
      throw error;
    }
  },

  /**
   * 🌟 อัปเดตการตั้งค่าระบบ Credit พร้อมบันทึกประวัติ (Immutable Audit Log)
   */
  updateCreditSettings: async (settingsData, uid) => {
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC);
      
      const payload = {
        ...settingsData,
        updatedAt: serverTimestamp(),
        updatedBy: uid
      };

      await setDoc(docRef, payload, { merge: true });

      // บันทึก Log เข้มงวด ว่าใครเป็นคนแก้ไขตัวแปรระบบ
      await historyService.addLog(
        'CyberAuditCore', 
        'SystemConfigAltered', 
        SETTINGS_DOC, 
        `ปรับปรุงตัวแปรระบบ (อัตราแลกเปลี่ยน: 1:${settingsData.pointToCashRatio}, เพดานทุนสำรอง: ${settingsData.ledger?.systemPoolMax})`, 
        uid
      );

      return true;
    } catch (error) {
      console.error("🔥 System Error [updateCreditSettings]:", error);
      throw error;
    }
  },

  /**
   * ✨ Atomic Master Ledger & User Credit Adjustment (SECURED)
   * อัปเกรด: เพิ่มระบบตรวจจับการทำรายการซ้ำ (Idempotency) และรองรับการถอนเงินสด (Cash Withdrawal)
   */
  adjustUserCredit: async (uid, amount, type, note, actorUid, referenceId = null) => {
    try {
      let transactionId = null;
      await runTransaction(db, async (transaction) => {
        // ==========================================
        // 1. PHASE READS & IDEMPOTENCY CHECK
        // ==========================================
        const settingsRef = doc(db, 'settings', SETTINGS_DOC);
        const userRef = doc(db, 'users', uid);
        
        // 🛡️ Idempotency: ป้องกันเน็ตกระตุกแล้วระบบสร้าง Transaction ซ้ำ
        let txRef;
        if (referenceId) {
          // ถ้าระบุเลขอ้างอิงมา ให้ใช้เป็นรหัส Document ไปเลย (ป้องกันการ Write ทับซ้ำ)
          txRef = doc(db, 'credit_transactions', `ADJ_${type}_${referenceId}`);
          const txSnap = await transaction.get(txRef);
          if (txSnap.exists()) {
             throw new Error("รายการนี้ถูกดำเนินการไปแล้ว (Duplicate Transaction)");
          }
        } else {
          // ถ้าไม่มีเลขอ้างอิง ให้สร้างรหัสใหม่แบบสุ่ม
          txRef = doc(collection(db, 'credit_transactions'));
        }

        const [settingsSnap, userSnap] = await Promise.all([
          transaction.get(settingsRef),
          transaction.get(userRef)
        ]);

        if (!userSnap.exists()) throw new Error("ไม่พบข้อมูลผู้ใช้งานในระบบ");

        const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;
        const ledger = settingsData?.ledger || { systemPoolMax: 1000000, totalAllocated: 0, status: 'SECURE' };

        const currentWallet = userSnap.data().stats?.creditBalance || userSnap.data().partnerCredit || 0;
        const numAmount = Number(amount);

        let newWalletBalance = currentWallet;
        let newTotalAllocated = ledger.totalAllocated;

        // ==========================================
        // 2. VALIDATION & CALCULATION
        // ==========================================
        if (type === 'deposit') {
          // เช็คว่าการแจกเครดิตครั้งนี้ ทะลุเพดานหนี้ของบริษัทหรือไม่?
          if (ledger.systemPoolMax > 0 && (ledger.totalAllocated + numAmount) > ledger.systemPoolMax) {
            throw new Error(`ไม่อนุมัติการทำรายการ! ทุนสำรองกลางไม่เพียงพอ (ขาดอีก ${(ledger.totalAllocated + numAmount - ledger.systemPoolMax).toLocaleString()} บาท)`);
          }
          newWalletBalance += numAmount;
          newTotalAllocated += numAmount; // บันทึกว่าระบบมีหนี้เพิ่มขึ้น
          
        } else if (type === 'deduct' || type === 'cash_withdrawal') {
          // รองรับทั้งการหักธรรมดา (deduct) และการถอนเงินสด (cash_withdrawal)
          if (currentWallet < numAmount) {
            throw new Error("ยอดเครดิตของผู้ใช้งานมีไม่เพียงพอให้หัก");
          }
          newWalletBalance -= numAmount;
          // เมื่อยึด/ใช้เครดิต ทุนสำรองกลาง (หนี้บริษัท) จะต้องลดลงด้วย
          newTotalAllocated = Math.max(0, newTotalAllocated - numAmount);
          
        } else {
          throw new Error("ประเภทการปรับปรุงเครดิตไม่ถูกต้อง (ต้องเป็น deposit, deduct หรือ cash_withdrawal)");
        }

        // คำนวณความเสี่ยง Ledger
        let newLedgerStatus = 'SECURE';
        const utilization = ledger.systemPoolMax > 0 ? (newTotalAllocated / ledger.systemPoolMax) : 0;
        if (utilization >= 0.9) newLedgerStatus = 'WARNING'; // ใช้ไปแล้ว 90%
        if (utilization >= 1) newLedgerStatus = 'BREACHED'; // ทะลุเพดาน

        // ==========================================
        // 3. PHASE WRITES
        // ==========================================
        
        // 3.1 อัปเดต Master Ledger
        transaction.set(settingsRef, {
          ledger: {
            ...ledger,
            totalAllocated: newTotalAllocated,
            status: newLedgerStatus,
            lastAuditTime: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        }, { merge: true });

        // 3.2 อัปเดต User Profile
        transaction.update(userRef, {
          'stats.creditBalance': newWalletBalance,
          'partnerCredit': newWalletBalance, // ซิงค์ฟิลด์เก่าเผื่อระบบอื่นเรียกใช้
          updatedAt: serverTimestamp()
        });

        // 3.3 สร้าง Log ธุรกรรมการเงิน (Secure Type Mapped)
        transactionId = txRef.id;
        transaction.set(txRef, {
          transactionId: `TXM-${Date.now()}`,
          uid: uid,
          type: type === 'deposit' ? 'deposit' : (type === 'cash_withdrawal' ? 'cash_withdrawal' : 'spend'),
          amount: numAmount,
          balanceAfter: newWalletBalance,
          referenceId: referenceId || 'MANUAL_ADJUST',
          note: note || (type === 'deposit' ? 'ปรับเพิ่มเครดิต' : 'ปรับลดเครดิต'),
          recordedBy: actorUid,
          timestamp: serverTimestamp()
        });
      });

      // 4. บันทึก History (Audit Log ระดับสูง)
      await historyService.addLog(
        'CyberAuditCore',
        type === 'deposit' ? 'CreditDeposit' : (type === 'cash_withdrawal' ? 'CashWithdrawal' : 'CreditDeduct'),
        uid,
        `${type === 'deposit' ? 'เพิ่ม' : 'ลด'}เครดิต ฿${amount.toLocaleString()} (หมายเหตุ: ${note})`,
        actorUid
      );

      return { success: true, transactionId };
    } catch (error) {
      console.error("🔥 System Error [adjustUserCredit]:", error);
      throw error;
    }
  },

  /**
   * ✨ Point Clawback (ระบบดึงแต้มคืนอัตโนมัติเมื่อมีการยกเลิกบิล)
   * ใช้เพื่อป้องกันลูกค้าทุจริตปั่นแต้มจากการซื้อแล้วยกเลิก
   */
  clawbackPoints: async (uid, points, referenceId, actorUid) => {
    if (!points || points <= 0) return true; // ถ้าไม่มีแต้มให้ดึงคืน ก็ผ่านไปได้เลย

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', uid);
        // 🛡️ เช็คว่าบิลนี้เคยดึงแต้มคืนไปแล้วหรือยัง ป้องกันดึงซ้ำติดลบ
        const txRef = doc(db, 'point_transactions', `CB_${referenceId}`);

        const [userSnap, txSnap] = await Promise.all([
          transaction.get(userRef),
          transaction.get(txRef)
        ]);

        if (txSnap.exists()) {
           throw new Error("ระบบได้ทำการดึงแต้มคืนจากบิลนี้ไปแล้ว (Duplicate Clawback)");
        }
        if (!userSnap.exists()) throw new Error("ไม่พบข้อมูลผู้ใช้งานสำหรับดึงแต้มคืน");

        let currentPoints = userSnap.data().stats?.rewardPoints || 0;
        let newPoints = Math.max(0, currentPoints - points); // ป้องกันแต้มติดลบ

        // 1. อัปเดต Profile
        transaction.update(userRef, {
          'stats.rewardPoints': newPoints,
          updatedAt: serverTimestamp()
        });

        // 2. สร้าง Log แต้มที่หายไป
        transaction.set(txRef, {
          transactionId: `CB-${Date.now()}`,
          uid: uid,
          type: 'deduct', // clawback
          points: points,
          balanceAfter: newPoints,
          referenceId: referenceId, // รหัสบิลที่ยกเลิก
          note: 'ดึงแต้มสะสมคืน เนื่องจากทำรายการยกเลิกบิล',
          recordedBy: actorUid,
          timestamp: serverTimestamp()
        });
      });

      // Audit Log
      await historyService.addLog('CyberAuditCore', 'PointClawback', referenceId, `ดึงแต้มคืนจำนวน ${points} แต้ม จากการยกเลิกบิล`, actorUid);
      return true;

    } catch (error) {
      console.error("🔥 System Error [clawbackPoints]:", error);
      throw error;
    }
  }
};