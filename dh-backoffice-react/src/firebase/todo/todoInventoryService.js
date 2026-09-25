import { db } from '../config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const todoInventoryService = {
  // 🗑️ ส่งคำร้องขออนุมัติลบสินค้าไปยังผู้จัดการ
  requestProductDeletion: async (productData, requestedBy) => {
    try {
      const taskRef = await addDoc(collection(db, getCollectionPath('todos')), {
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
  },

  // 📚 ส่งคำร้องขอเพิ่มข้อมูลความรู้ (Model / Part No.) ไปยังผู้จัดการ
  requestKnowledgeApproval: async ({ selectedProduct, knowledgeType, typeLabel, proposedValue, requestedBy, requestedByName, role }) => {
    try {
      const taskRef = await addDoc(collection(db, getCollectionPath('todos')), {
        type: 'KNOWLEDGE_APPROVAL',
        title: `ขอเพิ่มข้อมูล ${typeLabel} สำหรับ ${selectedProduct.sku}`,
        description: `พนักงานเสนอเพิ่มข้อมูล:\nSKU: ${selectedProduct.sku}\nข้อมูลที่เสนอ: ${proposedValue}`,
        priority: "Medium",
        status: "pending_manager",
        referenceType: "Product",
        referenceId: selectedProduct.sku,
        payload: {
          sku: selectedProduct.sku,
          productName: selectedProduct.name,
          knowledgeType,
          proposedValue
        },
        requestedBy: requestedBy || 'Unknown User',
        requestedByName: requestedByName || 'Staff',
        role: role || 'Staff',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return taskRef.id;
    } catch (error) {
      console.error("🔥 Error requesting knowledge approval:", error);
      throw error;
    }
  }
};
