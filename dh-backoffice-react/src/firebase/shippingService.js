import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const shippingService = {
  async getShippingRules() {
    try {
      const snap = await getDocs(collection(db, getCollectionPath('shipping_rules')));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort: Active first, then ascending by minQty
      data.sort((a, b) => (b.isActive - a.isActive) || (a.minQty - b.minQty));
      return data;
    } catch (error) {
      console.error("🔥 Error fetching shipping rules:", error);
      throw error;
    }
  },

  async getActiveShippingRules() {
    try {
      const { query, where } = await import('firebase/firestore');
      const q = query(collection(db, getCollectionPath('shipping_rules')), where('isActive', '==', true));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Error loading active shipping rules:", error);
      throw error;
    }
  },

  async addShippingRule(ruleData, uid) {
    try {
      const docRef = await addDoc(collection(db, getCollectionPath('shipping_rules')), {
        ...ruleData,
        minQty: Number(ruleData.minQty),
        maxQty: Number(ruleData.maxQty),
        shippingFee: Number(ruleData.shippingFee),
        updatedAt: serverTimestamp()
      });
      
      if (uid) {
        const isInsurance = ruleData.ruleType === 'insurance';
        const logMsg = isInsurance 
          ? `เพิ่มกฎค่าประกันภัยใหม่: ${ruleData.matchType === 'sku' ? `SKU ${ruleData.sku}` : 'ทุกสินค้า'} (${ruleData.minQty}-${ruleData.maxQty} ชิ้น) ค่าประกัน ${ruleData.shippingFee}บ.`
          : `เพิ่มกฎค่าจัดส่งใหม่: ${ruleData.company} (${ruleData.matchType === 'sku' ? `SKU ${ruleData.sku}` : ruleData.productType}) (${ruleData.minQty}-${ruleData.maxQty} ชิ้น) ค่าจัดส่ง ${ruleData.shippingFee}บ.`;

        await historyService.addLog(
          'SystemConfig', 
          'Create', 
          'shipping', 
          logMsg, 
          uid
        );
      }
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("🔥 Error adding shipping rule:", error);
      return { success: false, message: error.message };
    }
  },

  async toggleShippingRuleActive(ruleId, currentStatus, ruleDesc, uid) {
    try {
      await updateDoc(doc(db, getCollectionPath('shipping_rules'), ruleId), { isActive: !currentStatus });
      
      if (uid) {
        const actionText = !currentStatus ? "เปิดใช้งาน" : "ปิดใช้งาน";
        await historyService.addLog(
          'SystemConfig', 
          'Update', 
          'shipping', 
          `${actionText}กฎจัดส่ง: ${ruleDesc}`, 
          uid
        );
      }
      return { success: true };
    } catch (error) {
      console.error("🔥 Error updating shipping rule status:", error);
      return { success: false, message: error.message };
    }
  },

  async deleteShippingRule(ruleId, ruleDesc, uid) {
    try {
      await updateDoc(doc(db, getCollectionPath('shipping_rules'), ruleId), { isActive: false, deletedAt: serverTimestamp() });
      
      if (uid) {
        await historyService.addLog(
          'SystemConfig', 
          'Delete', 
          'shipping', 
          `ลบกฎจัดส่ง/ประกันภัยออกจากระบบ: ${ruleDesc}`, 
          uid
        );
      }
      return { success: true };
    } catch (error) {
      console.error("🔥 Error deleting shipping rule:", error);
      return { success: false, message: error.message };
    }
  }
};
