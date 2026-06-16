import { db } from './config';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export const productKnowledgeAdminService = {
  /**
   * อนุมัติคำขอเพิ่มความรู้: 
   * 1. อัปเดตข้อมูลสินค้า
   * 2. เพิ่ม creditPoint ให้ผู้ใช้
   * 3. บันทึก transaction
   * 4. เปลี่ยนสถานะ todo เป็น completed
   */
  approveKnowledgeTask: async (task, adminId) => {
    const { id: taskId, payload, createdByUid } = task;
    const { productId, fieldType, suggestedValue, creditReward } = payload;

    const productRef = doc(db, 'products', productId);
    const userRef = doc(db, 'users', createdByUid);
    const transactionId = `TX-${Date.now()}`;
    const transactionRef = doc(db, 'credit_transactions', transactionId);
    const taskRef = doc(db, 'todos', taskId);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. ตรวจสอบสินค้า
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error("ไม่พบสินค้าที่อ้างอิง");
        }

        // 2. ตรวจสอบผู้ใช้
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("ไม่พบบัญชีผู้ใช้งานที่เสนอข้อมูลนี้");
        }

        // 3. เตรียมข้อมูลการอัปเดตสินค้า
        const productData = productDoc.data();
        let currentArray = productData[fieldType] || [];
        // รับรองกรณีข้อมูลเดิมเป็น string 
        if (typeof currentArray === 'string') {
          currentArray = currentArray.split(',').map(s => s.trim()).filter(Boolean);
        }
        
        // ถ้าค่ายังไม่มีในอาร์เรย์ ค่อยเติมเข้าไป
        if (!currentArray.includes(suggestedValue)) {
          currentArray.push(suggestedValue);
          transaction.update(productRef, { [fieldType]: currentArray });
        }

        // 4. เตรียมข้อมูลเครดิต
        const userData = userDoc.data();
        const currentBalance = userData.creditPoints || 0;
        const rewardAmount = parseInt(creditReward, 10) || 2;
        const newBalance = currentBalance + rewardAmount;

        // อัปเดตผู้ใช้
        transaction.update(userRef, { creditPoints: newBalance });

        // สร้างประวัติธุรกรรม
        transaction.set(transactionRef, {
          transactionId,
          uid: createdByUid,
          type: 'deposit',
          amount: rewardAmount,
          balanceAfter: newBalance,
          referenceId: taskId,
          recordedBy: adminId || 'System',
          timestamp: serverTimestamp(),
          note: `รางวัลเพิ่มความรู้สินค้า: ${productId}`
        });

        // 5. อัปเดตงานเป็นเสร็จสิ้น
        transaction.update(taskRef, {
          status: 'completed',
          updatedAt: serverTimestamp(),
          handledBy: adminId || 'System'
        });
      });

      return { success: true };
    } catch (error) {
      console.error("Error in approveKnowledgeTask transaction:", error);
      throw error;
    }
  }
};
