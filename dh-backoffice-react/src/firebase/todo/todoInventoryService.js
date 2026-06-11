import { db } from '../config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const todoInventoryService = {
  // 🗑️ ส่งคำร้องขออนุมัติลบสินค้าไปยังผู้จัดการ
  requestProductDeletion: async (productData, requestedBy) => {
    try {
      const taskRef = await addDoc(collection(db, 'todos'), {
        type: 'PRODUCT_DELETE_APPROVAL',
        taskType: 'PRODUCT_DELETE_APPROVAL',
        title: `ขออนุมัติลบสินค้า: ${productData.sku}`,
        status: 'pending', // ส่งให้ Manager พิจารณา
        priority: 'High',
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        requestedBy: requestedBy || 'Unknown User',
        payload: {
          productId: productData.id || productData.sku,
          sku: productData.sku,
          name: productData.name,
          category: productData.category
        },
        description: `ขออนุมัติลบสินค้า SKU: ${productData.sku} ออกจากระบบ Inventory`,
      });
      return taskRef.id;
    } catch (error) {
      console.error("🔥 Error requesting product deletion:", error);
      throw error;
    }
  }
};
