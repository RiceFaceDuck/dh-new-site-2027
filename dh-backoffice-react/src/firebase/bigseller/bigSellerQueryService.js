import { gasStockService } from '../gasStockService';

class BigSellerQueryService {
  /**
   * ดึงข้อมูลสต็อกและคำนวณความเปลี่ยนแปลงเทียบกับ baseline ของวันนี้
   */
  getEffectiveResetString() {
    const configTime = localStorage.getItem('bigseller_reset_time') || '00:00';
    const [configHour, configMinute] = configTime.split(':').map(Number);
    
    const now = new Date();
    const effectiveDate = new Date(now);
    
    if (now.getHours() < configHour || (now.getHours() === configHour && now.getMinutes() < configMinute)) {
      effectiveDate.setDate(effectiveDate.getDate() - 1);
    }
    
    return `${effectiveDate.toDateString()} @ ${configTime}`;
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

      // 3. ตรวจสอบ Baseline ปัจจุบันตามรอบเวลา (Reset Time)
      const savedState = localStorage.getItem('bigseller_last_export_state');
      const lastResetDate = localStorage.getItem('bigseller_reset_date');
      const effectiveStr = this.getEffectiveResetString();

      let previousInventory = [];
      let isResetting = false;

      if (savedState && lastResetDate === effectiveStr) {
        try {
          previousInventory = JSON.parse(savedState);
        } catch (e) {
          console.error("Failed to parse bigseller state", e);
          previousInventory = currentInventory;
        }
      } else {
        // ขึ้นรอบเวลาใหม่ หรือ ใช้งานครั้งแรก -> รีเซ็ต Baseline
        previousInventory = currentInventory;
        this.saveCurrentState(currentInventory, effectiveStr);
        isResetting = true;
      }
      
      const prevMap = new Map();
      previousInventory.forEach(item => prevMap.set(item.sku, item));

      const increased = [];
      const decreased = [];
      const priceChanged = [];

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
      });

      const dbModule = await import('../config.js');
      const firestoreModule = await import('firebase/firestore');
      
      try {
        const configTime = localStorage.getItem('bigseller_reset_time') || '00:00';
        const [configHour, configMinute] = configTime.split(':').map(Number);
        
        const now = new Date();
        const effectiveDate = new Date(now);
        
        if (now.getHours() < configHour || (now.getHours() === configHour && now.getMinutes() < configMinute)) {
          effectiveDate.setDate(effectiveDate.getDate() - 1);
        }
        effectiveDate.setHours(configHour, configMinute, 0, 0);

        const q = firestoreModule.query(
          firestoreModule.collection(dbModule.db, 'orders'),
          firestoreModule.where('createdAt', '>=', firestoreModule.Timestamp.fromDate(effectiveDate)),
          firestoreModule.where('status', 'in', ['paid', 'completed'])
        );
        const snapshot = await firestoreModule.getDocs(q);
        
        // Count sold items by SKU
        const soldQtyMap = new Map();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach(item => {
              if (item.sku) {
                soldQtyMap.set(item.sku, (soldQtyMap.get(item.sku) || 0) + (Number(item.qty) || 1));
              }
            });
          }
        });

        // Attach reason to decreased items
        decreased.forEach(item => {
          const soldCount = soldQtyMap.get(item.sku);
          if (soldCount) {
             item.reason = `(บิลขาย: -${soldCount} ชิ้น)`;
          } else {
             item.reason = `(อื่นๆ / ปรับสต็อก)`;
          }
        });
      } catch (err) {
        console.warn("ไม่สามารถดึงข้อมูลออเดอร์เพื่ออธิบายที่มาได้:", err);
      }

      return {
        increased,
        decreased,
        priceChanged,
        currentInventory,
        lastResetDate: isResetting ? effectiveStr : lastResetDate
      };

    } catch (error) {
      console.error("Error calculating changes:", error);
      throw error;
    }
  }

  /**
   * บันทึกสถานะปัจจุบันเป็น Baseline
   */
  saveCurrentState(inventory, dateStr = this.getEffectiveResetString()) {
    const minimalState = inventory.map(item => ({
      sku: item.sku,
      stockQuantity: item.stockQuantity,
      Price: item.Price,
      name: item.name
    }));
    localStorage.setItem('bigseller_last_export_state', JSON.stringify(minimalState));
    localStorage.setItem('bigseller_reset_date', dateStr);
  }

  /**
   * รีเซ็ต Baseline ด้วยตนเอง
   */
  async manualResetBaseline() {
    await gasStockService.forceSync();
    const currentInventory = await gasStockService.fetchBackupInventory();
    this.saveCurrentState(currentInventory, this.getEffectiveResetString());
    
    // Add History Log for manual reset
    import('../historyService').then(({ historyService }) => {
      historyService.addLog({
        level: 'INFO',
        module: 'Big Seller Sync',
        action: 'Manual Reset Baseline',
        target: { id: 'Sync Status', type: 'System' },
        details: { message: `Manually reset the inventory comparison baseline.` }
      });
    }).catch(err => console.warn('Failed to load history service', err));

    return await this.calculateChanges();
  }
}

export const bigSellerQueryService = new BigSellerQueryService();
