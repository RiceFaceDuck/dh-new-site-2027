import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';

const COLLECTION_NAME = 'products';

/**
 * Service สำหรับจัดการปรับปรุงสต๊อคกรณีพิเศษ (Stock Adjustment)
 * บังคับให้ต้องมีสาเหตุ (reason) และไม่อนุญาตให้สต๊อคใหม่ติดลบ
 */
export const inventoryAdjustmentService = {
  /**
   * @param {string} sku - รหัสสินค้า
   * @param {number} newStock - จำนวนสต๊อคใหม่ที่ต้องการปรับ (ต้อง >= 0)
   * @param {string} reason - เหตุผลหลัก (เช่น "สินค้าสูญหาย", "รับคืนนอกระบบ")
   * @param {string} note - หมายเหตุเพิ่มเติม
   * @param {object} managerUser - ข้อมูลผู้จัดการที่ทำรายการ
   */
  adjustStock: async (sku, newStock, reason, note, managerUser) => {
    if (newStock < 0) {
      throw new Error("สต๊อคไม่สามารถติดลบได้ กรุณาตรวจสอบจำนวนอีกครั้ง");
    }

    if (!reason) {
      throw new Error("กรุณาระบุเหตุผลในการปรับปรุงสต๊อค");
    }

    const productRef = doc(db, COLLECTION_NAME, sku);

    try {
      await runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef);
        
        if (!productSnap.exists()) {
          throw new Error(`ไม่พบสินค้า SKU: ${sku}`);
        }

        const data = productSnap.data();
        const oldStock = data.stockQuantity || 0;

        if (oldStock === newStock) {
          throw new Error("จำนวนสต๊อคใหม่ตรงกับสต๊อคเดิม ไม่มีการเปลี่ยนแปลง");
        }

        // ปรับปรุงข้อมูลใน Database
        transaction.update(productRef, {
          stockQuantity: newStock,
          updatedAt: serverTimestamp()
        });

        // บันทึก History Log โดยส่งเข้าคิวหลัง Transaction สำเร็จ
        setTimeout(() => {
          gasHistoryService.log({
            level: oldStock > newStock ? 'WARN' : 'INFO',
            module: 'Inventory Adjustment',
            action: 'Adjust Stock',
            actor: {
              uid: managerUser?.uid || 'Unknown',
              name: managerUser?.displayName || managerUser?.email || 'System'
            },
            target: { id: sku, name: data.name, type: 'Product' },
            details: {
              legacy_details: `ปรับปรุงสต๊อคกรณีพิเศษ: ${reason}`,
              reason: reason,
              note: note || '',
              changes: {
                stockQuantity: { from: oldStock, to: newStock }
              }
            }
          });
        }, 0);
      });

      return { success: true, message: 'ปรับปรุงสต๊อคสำเร็จ' };
    } catch (error) {
      console.error("Stock Adjustment Transaction failed: ", error);
      throw error;
    }
  }
};
