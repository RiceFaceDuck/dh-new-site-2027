import { db } from './config';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// 🚀 Memory Cache for Knowledge Credit Config (10 Min TTL)
let cachedKnowledgeCredit = null;
let cachedKnowledgeCreditTimestamp = 0;
const KNOWLEDGE_CACHE_TTL = 10 * 60 * 1000;

export const productKnowledgeService = {
  /**
   * ดึงค่าการตั้งค่าเครดิตสำหรับระบบความรู้จากฐานข้อมูล (มีแคช 10 นาที)
   * ถ้ายังไม่มี จะคืนค่าเริ่มต้นที่ 2 เครดิต
   */
  getKnowledgeCreditConfig: async () => {
    if (cachedKnowledgeCredit !== null && (Date.now() - cachedKnowledgeCreditTimestamp < KNOWLEDGE_CACHE_TTL)) {
      return cachedKnowledgeCredit;
    }

    try {
      const configRef = doc(db, getCollectionPath('settings'), 'knowledge_config');
      const docSnap = await getDoc(configRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        cachedKnowledgeCredit = data.compatibleCreditReward || 2;
        cachedKnowledgeCreditTimestamp = Date.now();
        return cachedKnowledgeCredit;
      }
      cachedKnowledgeCredit = 2; // ค่าเริ่มต้น
      cachedKnowledgeCreditTimestamp = Date.now();
      return 2;
    } catch (error) {
      console.error("Error fetching knowledge credit config:", error);
      return 2; // กรณี error คืนค่า 2 ไปก่อน
    }
  },

  /**
   * ส่งคำขออนุมัติเพิ่มความรู้ไปที่ระบบ Todo ของ Manager
   */
  submitKnowledgeApproval: async (taskData) => {
    try {
      const {
        productId,
        productName,
        userId,
        userName,
        fieldType, // เช่น 'compatibleModels' หรือ 'compatiblePartNumbers'
        suggestedValue,
        creditReward
      } = taskData;

      const title = fieldType === 'compatibleModels' 
        ? `ขอเพิ่มความรู้รุ่นที่รองรับ: ${productName}`
        : `ขอเพิ่มรหัสพาร์ทที่รองรับ: ${productName}`;

      const todoData = {
        type: 'PRODUCT_KNOWLEDGE_APPROVAL',
        title,
        description: `ขอเพิ่ม: ${suggestedValue}`,
        priority: 'Normal',
        status: 'todo', // รอแอดมินมาดำเนินการ
        referenceType: 'Product',
        referenceId: productId,
        createdByUid: userId,
        createdByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        payload: {
          productId,
          productName,
          fieldType,
          suggestedValue,
          creditReward
        }
      };

      const docRef = await addDoc(collection(db, getCollectionPath('todos')), todoData);
      return { success: true, taskId: docRef.id };
    } catch (error) {
      console.error("Error submitting knowledge task:", error);
      throw error;
    }
  }
};
