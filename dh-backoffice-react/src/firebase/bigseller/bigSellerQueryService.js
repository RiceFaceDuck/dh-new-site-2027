import { gasStockService } from '../gasStockService';
import { db } from '../config';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';class BigSellerQueryService {
  /**
   * ดึงเวลา Reset ล่าสุดจาก Firestore
   */
  async getLastResetTime() {
    try {
      const docRef = doc(db, 'system_counters', 'bigseller_baseline');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().lastResetAt) {
        return docSnap.data().lastResetAt.toDate();
      }
    } catch (e) {
      console.error("Error fetching reset time:", e);
    }
    return new Date(); // Default
  }

  /**
   * รีเซ็ต Baseline โดยบันทึกข้อมูลปัจจุบันลง Firestore
   */
  async resetBaseline(currentInventory) {
    try {
      const docRef = doc(db, 'system_counters', 'bigseller_baseline');
      const payload = {
        lastResetAt: serverTimestamp(),
        inventory: currentInventory
      };
      await setDoc(docRef, payload);
      
      // ลบ localStorage ทิ้งเพื่อกันสับสน
      localStorage.removeItem('bigseller_last_export_state');
      localStorage.removeItem('bigseller_reset_date');
      
      return true;
    } catch (e) {
      console.error("Error resetting baseline:", e);
      throw e;
    }
  }

  async calculateChanges() {
    try {
      // 1. ผลักดันคิวการเปลี่ยนสต็อกที่อาจจะค้างอยู่ไปยัง GAS ทันที
      await gasStockService.forceSync();

      // 2. ดึงข้อมูลสต็อกปัจจุบันจากฐานข้อมูลสำรอง Google Sheet (0 Firebase Reads)
      const currentInventory = await gasStockService.fetchBackupInventory();

      if (!currentInventory || currentInventory.length === 0) {
        throw new Error("ไม่พบข้อมูลสินค้าในคลัง");
      }

      // 3. ตรวจสอบ Baseline จาก Firestore
      const docRef = doc(db, 'system_counters', 'bigseller_baseline');
      const docSnap = await getDoc(docRef);

      let previousInventory = [];
      let lastResetDate = new Date();

      if (docSnap.exists() && docSnap.data().inventory) {
        previousInventory = docSnap.data().inventory;
        if (docSnap.data().lastResetAt) {
          lastResetDate = docSnap.data().lastResetAt.toDate();
        }
      } else {
        // ครั้งแรก หรือ ไม่มีข้อมูล -> สร้าง Baseline ใหม่จากข้อมูลปัจจุบัน
        previousInventory = currentInventory;
        await this.resetBaseline(currentInventory);
        lastResetDate = new Date();
      }
      
      const prevMap = new Map();
      previousInventory.forEach(item => prevMap.set(item.sku, item));

      const increased = [];
      const decreased = [];
      const priceChanged = [];
      const otherChanged = [];

      currentInventory.forEach(curr => {
        if (!curr.sku) return;
        const prev = prevMap.get(curr.sku);
        
        const currStock = Number(curr.stockQuantity) || 0;
        const currPrice = Number(curr.Price) || 0;

        if (!prev) {
          if (currStock > 0) increased.push({ sku: curr.sku, name: curr.name, oldStock: 0, newStock: currStock });
          return;
        }

        const prevStock = Number(prev.stockQuantity) || 0;
        const prevPrice = Number(prev.Price) || 0;

        if (currStock > prevStock) {
          increased.push({ sku: curr.sku, name: curr.name, oldStock: prevStock, newStock: currStock });
        } else if (currStock < prevStock) {
          decreased.push({ sku: curr.sku, name: curr.name, oldStock: prevStock, newStock: currStock });
        }

        if (currPrice !== prevPrice) {
          priceChanged.push({ sku: curr.sku, name: curr.name, oldPrice: prevPrice, newPrice: currPrice });
        }

        // ✨ ตรวจจับความเปลี่ยนแปลงอื่นๆ (เช่น ชื่อ หรือ หมวดหมู่)
        const details = [];
        if (curr.name !== prev.name && curr.name && prev.name) {
            details.push(`ชื่อเปลี่ยน`);
        }
        if (curr.category !== prev.category && curr.category && prev.category) {
            details.push(`เปลี่ยนหมวดหมู่เป็น ${curr.category}`);
        }
        
        if (details.length > 0) {
            otherChanged.push({ sku: curr.sku, name: curr.name, details: details.join(', ') });
        }
      });

      return {
        increased,
        decreased,
        priceChanged,
        otherChanged, // ✨ Return ข้อมูลเพิ่มเติม
        currentInventory,
        lastResetDate: lastResetDate
      };

    } catch (error) {
      console.error("Error calculating changes:", error);
      throw error;
    }
  }

  /**
   * รีเซ็ต Baseline ด้วยตนเอง
   */
  async manualResetBaseline() {
    await gasStockService.forceSync();
    const currentInventory = await gasStockService.fetchBackupInventory();
    await this.resetBaseline(currentInventory);
    
    // Add History Log for manual reset
    try {
      const { historyService } = await import('../historyService');
      historyService.addLog({
        level: 'WARNING',
        module: 'Big Seller Sync',
        action: 'Manual Reset Baseline',
        target: { id: 'SYSTEM', type: 'System' },
        details: { message: `ผู้ใช้งานได้ทำการรีเซ็ต Baseline การนับสต็อก Big Seller ใหม่` }
      });
    } catch (e) {
      console.warn("Could not write history log for reset", e);
    }

    return await this.calculateChanges();
  }
}

export const bigSellerQueryService = new BigSellerQueryService();
