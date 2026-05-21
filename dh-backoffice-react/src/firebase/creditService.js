/* eslint-disable */
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction, collection, query, where, orderBy, limit, getDocs, increment } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

// 🛡️ App ID สำหรับกำหนด Scope การเข้าถึง Database (Enterprise Sandbox)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ==========================================
// 🎮 Gamification & Formatting
// ==========================================

export const getUserTier = (points = 0) => {
  if (points >= 100000) return { name: 'Diamond', icon: '💎', color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200', multiplier: 1.5 };
  if (points >= 10000) return { name: 'Platinum', icon: '👑', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', multiplier: 1.2 };
  if (points >= 5000) return { name: 'Gold', icon: '🥇', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', multiplier: 1.1 };
  if (points >= 1000) return { name: 'Silver', icon: '🥈', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', multiplier: 1.05 };
  return { name: 'Member', icon: '🌟', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', multiplier: 1 };
};

export const formatCredit = (points = 0) => {
  if (points === undefined || points === null) return '0';
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(points);
};

// ==========================================
// ⚙️ Core Credit Service (เครื่องยนต์ประมวลผลหลัก)
// ==========================================

export const creditService = {

  formatCredit,
  getUserTier,

  calculateEarnedPoints: (amount, config, userCurrentPoints = 0) => {
    if (!amount || amount <= 0 || !config) return 0;
    const earningRate = config.earningRate || 100;
    let basePoints = Math.floor(amount / earningRate);
    const userTier = getUserTier(userCurrentPoints);
    let multiplier = config.tierMultiplier || userTier.multiplier; 
    return Math.floor(basePoints * multiplier);
  },

  getCreditSettings: async () => {
    try {
      // 🛠️ FIX: ปรับ Path เป็น 6 ระดับ (settings, credit_config) ป้องกัน Firebase Crash
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) return docSnap.data();
      
      const defaultSettings = {
        ledger: { systemPoolMax: 1000000, totalAllocated: 0, lastAuditTime: serverTimestamp(), status: 'SECURE' },
        earningRate: 100,      
        redemptionRate: 1,     
        pointToCashRatio: 1, 
        pendingDays: 11,       
        rewardRules: { review: 10, knowledgeSharing: 50, referral: 100 },
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error("🔥 System Error [getCreditSettings]:", error);
      throw error;
    }
  },

  updateCreditSettings: async (settingsData, uid) => {
    try {
      // 🛠️ FIX: ปรับ Path เป็น 6 ระดับ
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
      const payload = { ...settingsData, updatedAt: serverTimestamp(), updatedBy: uid || 'Admin' };
      await setDoc(docRef, payload, { merge: true });

      if (historyService && historyService.addLog) {
        await historyService.addLog('CyberAuditCore', 'SystemConfigAltered', 'settings_credit_config', `ปรับปรุงตัวแปรระบบ Credit`, uid || 'System');
      }
      return true;
    } catch (error) {
      console.error("🔥 System Error [updateCreditSettings]:", error);
      throw error;
    }
  },

  /**
   * ✨ Atomic Dual-Sync Credit Adjustment (SECURED)
   */
  adjustUserCredit: async (uid, amount, type, note, actorUid, referenceId = null) => {
    try {
      let transactionId = null;
      await runTransaction(db, async (transaction) => {
        // 🛠️ FIX: ปรับ Path เป็น 6 ระดับ
        const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
        
        // 🔗 References สำหรับ Dual-Sync
        const userRef = doc(db, 'artifacts', appId, 'users', uid); // Sandbox (ระบบใหม่)
        const rootUserRef = doc(db, 'users', uid); // Root (ระบบดั้งเดิม หน้าเว็บหลัก)
        const walletRef = doc(db, 'artifacts', appId, 'users', uid, 'wallet', 'default');
        
        let txRef;
        const refSuffix = referenceId ? referenceId : Date.now().toString();
        if (referenceId) {
          txRef = doc(db, 'artifacts', appId, 'public', 'data', 'credit_transactions', `ADJ_${type}_${referenceId}`);
          const txSnap = await transaction.get(txRef);
          if (txSnap.exists()) throw new Error("รายการนี้ถูกดำเนินการไปแล้ว (Duplicate Transaction Prevention)");
        } else {
          txRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'));
        }

        const [settingsSnap, userSnap, rootUserSnap, walletSnap] = await Promise.all([
          transaction.get(settingsRef),
          transaction.get(userRef),
          transaction.get(rootUserRef),
          transaction.get(walletRef)
        ]);

        const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;
        const ledger = settingsData?.ledger || { systemPoolMax: 1000000, totalAllocated: 0, status: 'SECURE' };

        // 🔍 ค้นหายอดเงินปัจจุบันจากทุกแหล่ง (Wallet > Sandbox > Root)
        let currentWallet = 0;
        let totalAccumulated = 0;
        if (walletSnap.exists()) {
          currentWallet = Number(walletSnap.data().balance) || 0;
          totalAccumulated = Number(walletSnap.data().totalAccumulated) || 0;
        } else if (userSnap.exists()) {
          currentWallet = Number(userSnap.data().creditPoints || userSnap.data().creditPoint || userSnap.data().stats?.creditBalance || userSnap.data().partnerCredit || 0);
        } else if (rootUserSnap.exists()) {
          currentWallet = Number(rootUserSnap.data().creditPoints || rootUserSnap.data().creditPoint || rootUserSnap.data().stats?.creditBalance || rootUserSnap.data().partnerCredit || 0);
        }

        const numAmount = Number(amount);
        const sysMax = Number(ledger.systemPoolMax) || 1000000;
        let newTotalAllocated = Number(ledger.totalAllocated) || 0;
        
        let newWalletBalance = currentWallet;
        let newTotalAccumulated = totalAccumulated;

        // 🧮 Validation & Calculation
        if (type === 'deposit') {
          if (sysMax > 0 && (newTotalAllocated + numAmount) > sysMax) {
            throw new Error(`ไม่อนุมัติการทำรายการ! ทุนสำรองกลางไม่เพียงพอ`);
          }
          newWalletBalance += numAmount;
          newTotalAccumulated += numAmount;
          newTotalAllocated += numAmount; 
        } else if (type === 'deduct' || type === 'cash_withdrawal' || type === 'spend') {
          if (currentWallet < numAmount) throw new Error(`ยอดเครดิตของผู้ใช้งานมีไม่เพียงพอ (มียอดเพียง ${currentWallet} Pts)`);
          newWalletBalance -= numAmount;
          newTotalAllocated = Math.max(0, newTotalAllocated - numAmount);
        } else {
          throw new Error("ประเภทการปรับปรุงเครดิตไม่ถูกต้อง");
        }

        let newLedgerStatus = 'SECURE';
        const utilization = sysMax > 0 ? (newTotalAllocated / sysMax) : 0;
        if (utilization >= 0.9) newLedgerStatus = 'WARNING'; 
        if (utilization >= 1) newLedgerStatus = 'BREACHED'; 

        // 💾 3.1 อัปเดต Master Ledger
        transaction.set(settingsRef, {
          ledger: { ...ledger, totalAllocated: newTotalAllocated, status: newLedgerStatus, lastAuditTime: serverTimestamp() },
          updatedAt: serverTimestamp()
        }, { merge: true });

        // 💾 3.2 อัปเดต Wallet ลับ
        transaction.set(walletRef, {
          balance: newWalletBalance,
          totalAccumulated: newTotalAccumulated,
          updatedAt: serverTimestamp()
        }, { merge: true });

        const syncPayload = {
          creditPoints: newWalletBalance,  // รองรับ Field ของหน้าเว็บใหม่
          creditPoint: newWalletBalance,   // รองรับ Field ของหน้าเว็บเก่า
          partnerCredit: newWalletBalance, // เผื่อระบบพาร์ทเนอร์
          stats: { creditBalance: newWalletBalance },
          updatedAt: serverTimestamp()
        };

        // 💾 3.3 อัปเดต User Profile (Sandbox)
        transaction.set(userRef, syncPayload, { merge: true });

        // 💾 3.4 🌟 DUAL-SYNC: อัปเดต User Profile (Root) เพื่อให้หน้าเว็บหลักเก่าๆ เห็นยอดทันที!
        if (rootUserSnap.exists()) {
           transaction.set(rootUserRef, syncPayload, { merge: true });
        }

        const userEmail = userSnap.exists() ? userSnap.data().email : (rootUserSnap.exists() ? rootUserSnap.data().email : 'Migrated User');

        // 💾 3.5 สร้าง Log ธุรกรรมกองกลาง
        transactionId = txRef.id;
        transaction.set(txRef, {
          transactionId: `TXM-${refSuffix}`,
          uid: uid,
          userEmail: userEmail,
          type: type === 'deposit' ? 'add' : 'deduct', // 🛠️ แมปให้ตรงกับที่หน้า UI ดึงไปโชว์
          amount: numAmount,
          balanceAfter: newWalletBalance,
          referenceId: referenceId || 'MANUAL_ADJUST',
          note: note || (type === 'deposit' ? 'ปรับเพิ่มเครดิต' : 'ปรับลดเครดิต'),
          remark: note || (type === 'deposit' ? 'ปรับเพิ่มเครดิต' : 'ปรับลดเครดิต'), // 🛠️ เพิ่มฟิลด์ให้ UI หน้าประวัติ
          recordedBy: actorUid || 'System',
          operatorUid: actorUid || 'System', // 🛠️ เพิ่มฟิลด์ให้ UI หน้าประวัติ
          timestamp: serverTimestamp()
        });

        // 💾 3.6 สร้าง Log ประวัติส่วนตัว ให้ลูกค้าเห็นหน้าเว็บ
        const personalHistoryRef = doc(collection(db, 'artifacts', appId, 'users', uid, 'credit_history'));
        transaction.set(personalHistoryRef, {
          type: type === 'deposit' ? 'earn' : 'spend',
          points: numAmount,
          amount: numAmount, // เพิ่ม Field ให้รองรับโค้ดเก่า
          note: note || 'ทำรายการกระเป๋าเงิน',
          referenceId: `TXM-${refSuffix}`,
          adjustedBy: actorUid || 'System',
          createdAt: serverTimestamp(),
          timestamp: serverTimestamp()
        });
      });

      // 💾 4. Audit Log ของแอดมิน
      if (historyService && historyService.addLog) {
        await historyService.addLog('CyberAuditCore', type === 'deposit' ? 'CreditDeposit' : 'CreditDeduct', uid, `${type === 'deposit' ? 'เพิ่ม' : 'ลด'}เครดิต ฿${amount.toLocaleString()}`, actorUid);
      }
      return { success: true, transactionId };
    } catch (error) {
      console.error("🔥 System Error [adjustUserCredit]:", error);
      throw error;
    }
  },

  handlePaymentCompletion: async (orderId, userId) => {
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("ไม่พบข้อมูลคำสั่งซื้อในระบบ");
        
        const orderData = orderDoc.data();
        const pendingPoints = orderData.pendingCredits || 0;
        
        if (orderData.pointsAwarded || pendingPoints <= 0) return;

        transaction.update(orderRef, { pendingCredits: 0, pointsAwarded: true, awardedAt: serverTimestamp() });
      });
      // เรียกใช้หลังจบ transaction หลักเพื่อป้องกัน Nested Transaction Timeout
      await creditService.adjustUserCredit(userId, pendingPoints, 'deposit', `ได้รับแต้มจากการสั่งซื้อรหัส ${orderId}`, 'System_Order_Completion', orderId);
      return true;
    } catch (error) {
      console.error("🔥 System Error [handlePaymentCompletion]:", error);
      throw error;
    }
  },

  clawbackPoints: async (uid, points, referenceId, actorUid) => {
    if (!points || points <= 0) return true; 
    try {
      await creditService.adjustUserCredit(uid, points, 'deduct', `ดึงแต้มคืนจากบิลยกเลิก: ${referenceId}`, actorUid || 'System_Clawback', `CB_${referenceId}`);
      if (historyService && historyService.addLog) {
         await historyService.addLog('CyberAuditCore', 'PointClawback', referenceId, `ริบแต้มคืน ${formatCredit(points)} แต้ม จากบิลที่ยกเลิก`, actorUid);
      }
      return true;
    } catch (error) {
      console.error("🔥 System Error [clawbackPoints]:", error);
      throw error;
    }
  },

  getPointsHistory: async (userId, limitCount = 30) => {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, 'artifacts', appId, 'users', userId, 'credit_history'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 System Error [getPointsHistory]:", error);
      return [];
    }
  }
};

// ==========================================
// 💡 Track Ad Click & Legacy Support
// ==========================================

export const trackAdClick = async (partnerId) => {
  if (!partnerId) return;
  try {
    const statDocId = `${new Date().getFullYear()}-${new Date().getMonth()+1}`;
    const partnerStatsRef = doc(db, 'artifacts', appId, 'public', 'data', 'partners', partnerId, 'stats', statDocId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(partnerStatsRef);
      if (docSnap.exists()) {
        transaction.update(partnerStatsRef, { clicks: increment(1), updatedAt: serverTimestamp() });
      } else {
        transaction.set(partnerStatsRef, { impressions: 0, clicks: 1, spentCredits: 0, updatedAt: serverTimestamp() });
      }
    });
  } catch (error) {
    console.error("Error tracking ad click:", error);
  }
};

export const holdAdCredit = async (userId, amount, adTitle) => {
  console.log(`[Legacy Bypass] ข้ามการกันเครดิต ${amount} Pts (ระบบใหม่สร้างฟรี)`);
  return true; 
};

export const refundAdCredit = async (userId, amount, adTitle) => {
  console.log(`[Legacy Bypass] ข้ามการคืนเครดิต ${amount} Pts (เพราะไม่ได้หักแต่แรก)`);
  return true;
};