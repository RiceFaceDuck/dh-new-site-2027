import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';

export const shippingService = {
  async getShippingRules() {
    try {
      const snap = await getDocs(collection(db, 'shipping_rules'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort: Active first, then ascending by minQty
      data.sort((a, b) => (b.isActive - a.isActive) || (a.minQty - b.minQty));
      return data;
    } catch (error) {
      console.error("🔥 Error fetching shipping rules:", error);
      throw error;
    }
  },

  async addShippingRule(ruleData, uid) {
    try {
      const docRef = await addDoc(collection(db, 'shipping_rules'), {
        ...ruleData,
        minQty: Number(ruleData.minQty),
        maxQty: Number(ruleData.maxQty),
        shippingFee: Number(ruleData.shippingFee),
        updatedAt: serverTimestamp()
      });
      
      if (uid) {
        await historyService.addLog(
          'SystemConfig', 
          'Create', 
          'shipping', 
          `เพิ่มกฎค่าจัดส่งใหม่: ${ruleData.company} (${ruleData.minQty}-${ruleData.maxQty} ชิ้น) ค่าจัดส่ง ${ruleData.shippingFee}บ.`, 
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
      await updateDoc(doc(db, 'shipping_rules', ruleId), { isActive: !currentStatus });
      
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
      await deleteDoc(doc(db, 'shipping_rules', ruleId));
      
      if (uid) {
        await historyService.addLog(
          'SystemConfig', 
          'Delete', 
          'shipping', 
          `ลบกฎจัดส่งออกจากระบบ: ${ruleDesc}`, 
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
