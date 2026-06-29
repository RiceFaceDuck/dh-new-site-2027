import { db } from '../config';
import { doc, collection, serverTimestamp, runTransaction, increment } from 'firebase/firestore';

const appId = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
const isCanvas = typeof window !== 'undefined' && window.location.hostname.includes('canvas');

const getTodosPath = () => isCanvas ? `artifacts/${appId}/public/data/todos` : 'todos';
const getUsersColPath = () => isCanvas ? `artifacts/${appId}/users` : 'users';
const getLogsPath = () => isCanvas ? `artifacts/${appId}/public/data/system_logs` : 'system_logs';

export const todoWalletService = {
  // 🏦 6. ประมวลผลคำขอถอนเงิน Wallet [NEW & HIGHLY SECURE]
  processWalletWithdrawal: async (taskId, action, adminInfo, extraData = {}) => {
      try {
          return await runTransaction(db, async (transaction) => {
              const todosPath = getTodosPath();
              const taskRef = doc(db, todosPath, taskId);
              const taskSnap = await transaction.get(taskRef);

              if (!taskSnap.exists()) {
                  return { success: false, orphanedCleared: true, message: "ไม่พบคำขอถอนเงินนี้ในระบบ" };
              }

              const taskData = taskSnap.data();
              // ดักจับทั้งแบบเก่า(type) และแบบใหม่(taskType)
              const currentType = taskData.type || taskData.taskType;
              
              if (currentType !== 'WALLET_WITHDRAWAL') {
                  throw new Error("ประเภทงานไม่ถูกต้อง");
              }
              
              if (taskData.status !== 'pending' && taskData.status !== 'PENDING' && taskData.status !== 'todo') {
                  throw new Error("รายการนี้ถูกดำเนินการไปแล้ว");
              }

              // ค้นหา Customer ID 
              const customerId = taskData.customer?.uid || taskData.withdrawalDetails?.uid || taskData.createdBy;
              const amount = Number(taskData.withdrawalDetails?.amount || 0);

              if (!customerId || amount <= 0) throw new Error("ข้อมูลลูกค้าหรือจำนวนเงินไม่ถูกต้อง");

              const usersPath = getUsersColPath();
              const userRef = doc(db, usersPath, customerId);
              const userSnap = await transaction.get(userRef);
              
              // ✨ UX UPGRADE: Auto-Clean กรณีลูกค้าถูกลบออกจากระบบ
              if (!userSnap.exists()) {
                 transaction.update(taskRef, {
                      status: 'cancelled',
                      rejectReason: 'ระบบปิดงานอัตโนมัติ: บัญชีลูกค้ารายนี้ไม่มีอยู่ในระบบแล้ว',
                      completedAt: serverTimestamp(),
                      actionBy: 'System Auto-Clean'
                  });
                  return { success: false, orphanedCleared: true, message: "ไม่พบบัญชีลูกค้าในระบบ ระบบได้เคลียร์รายการให้แล้วครับ" };
              }

              const txId = `WD-${action}-${Date.now()}`;
              const userTxRef = doc(collection(db, `${usersPath}/${customerId}/wallet_transactions`));
              const logRef = doc(collection(db, getLogsPath()));

              if (action === 'APPROVE') {
                  // ✅ กรณีอนุมัติโอนเงิน (หักเงินรอถอนออกอย่างถาวร)
                  transaction.update(userRef, {
                      pendingWithdrawal: increment(-amount),
                      updatedAt: serverTimestamp()
                  });

                  transaction.set(userTxRef, {
                      transactionId: txId,
                      type: 'WITHDRAWAL_COMPLETED',
                      amount: amount,
                      status: 'SUCCESS',
                      note: extraData.note || 'โอนเงินเข้าบัญชีสำเร็จเรียบร้อย',
                      slipUrl: extraData.slipUrl || null,
                      adminId: adminInfo?.uid || 'Manager',
                      timestamp: serverTimestamp()
                  });

                  transaction.update(taskRef, {
                      status: 'completed',
                      'withdrawalDetails.slipUrl': extraData.slipUrl || null,
                      adminNote: extraData.note || 'โอนเงินสำเร็จ',
                      completedAt: serverTimestamp(),
                      actionBy: adminInfo?.displayName || 'Manager'
                  });

                  transaction.set(logRef, {
                      actionType: 'WALLET_WITHDRAWAL_APPROVED',
                      taskId,
                      details: `อนุมัติโอนเงิน ฿${amount} ให้ลูกค้าสำเร็จ`,
                      createdBy: adminInfo?.uid || 'Manager',
                      createdAt: serverTimestamp()
                  });

              } else if (action === 'REJECT') {
                  // ❌ กรณีปฏิเสธ (ดึงเงินรอถอน คืนกลับเข้ากระเป๋า Wallet ให้ลูกค้าอัตโนมัติ)
                  transaction.update(userRef, {
                      pendingWithdrawal: increment(-amount),
                      walletBalance: increment(amount), // คืนเงินเข้าระบบให้ลูกค้า
                      updatedAt: serverTimestamp()
                  });

                  transaction.set(userTxRef, {
                      transactionId: txId,
                      type: 'WITHDRAWAL_REJECTED',
                      amount: amount,
                      status: 'REFUNDED',
                      note: extraData.note || 'คำขอถูกปฏิเสธ (เงินถูกคืนกลับเข้าระบบแล้ว)',
                      adminId: adminInfo?.uid || 'Manager',
                      timestamp: serverTimestamp()
                  });

                  transaction.update(taskRef, {
                      status: 'rejected',
                      rejectReason: extraData.note || 'ปฏิเสธคำขอ และคืนเงิน',
                      completedAt: serverTimestamp(),
                      actionBy: adminInfo?.displayName || 'Manager'
                  });

                  transaction.set(logRef, {
                      actionType: 'WALLET_WITHDRAWAL_REJECTED',
                      taskId,
                      details: `ปฏิเสธโอนเงิน ฿${amount} (เงินถูกคืนให้ลูกค้าแล้ว)`,
                      createdBy: adminInfo?.uid || 'Manager',
                      createdAt: serverTimestamp()
                  });
              } else {
                  throw new Error("Action ไม่ถูกต้อง (ต้องเป็น APPROVE หรือ REJECT เท่านั้น)");
              }
              
              return { success: true };
          });
      } catch (error) {
          console.error("🔥 processWalletWithdrawal Error:", error);
          throw error;
      }
  }
};
