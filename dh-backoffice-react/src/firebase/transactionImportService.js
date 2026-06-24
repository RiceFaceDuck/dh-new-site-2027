import * as XLSX from 'xlsx';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config';
import { gasStockService } from './gasStockService';
import { gasHistoryService } from './gasHistoryService';

export const transactionImportService = {
  /**
   * ถอดรหัสไฟล์ .xlsx และพยายามจัดเรียงข้อมูล
   */
  parseFile: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          if (!rawJson || rawJson.length === 0) {
            throw new Error("ไฟล์ว่างเปล่าหรือไม่พบข้อมูล");
          }

          // พยายามหาคอลัมน์แบบ Fuzzy Match
          const headers = Object.keys(rawJson[0] || {});
          
          // โหลดค่า Aliases จาก Global Schema Settings ถ้ามี
          let aliases = {
            sku: 'sku, รหัสสินค้า, merchant, barcode, item code',
            qty: 'qty, quantity, จำนวน, stock, สต๊อก, สต็อก',
            price: 'price, ราคา, amount'
          };
          try {
            const saved = localStorage.getItem('global_schema_aliases');
            if (saved) {
              aliases = { ...aliases, ...JSON.parse(saved) };
            }
          } catch(e) {}

          // Use loose match as bounded regex like the original: /sku|รหัสสินค้า/i
          const createLooseMatcher = (str) => {
             const words = str.split(',').map(s => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
             if (words.length === 0) return /$^/;
             return new RegExp(words.join('|'), 'i');
          };

          const skuRegex = createLooseMatcher(aliases.sku);
          const qtyRegex = createLooseMatcher(aliases.qty);
          const priceRegex = createLooseMatcher(aliases.price);

          const skuKey = headers.find(h => skuRegex.test(h)) || headers[0];
          const qtyKey = headers.find(h => qtyRegex.test(h)) || headers[1];
          const priceKey = headers.find(h => priceRegex.test(h));

          const defaultMapping = { skuKey, qtyKey, priceKey };
          const parsedItems = transactionImportService.applyMapping(rawJson, defaultMapping);

          resolve({
            items: parsedItems,
            matchedKeys: defaultMapping,
            rawJson: rawJson,
            headers: headers
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * นำการตั้งค่าคอลัมน์ไปใช้กับข้อมูลดิบ
   */
  applyMapping: (rawJson, mapping) => {
    const { skuKey, qtyKey, priceKey } = mapping;
    return rawJson.map(row => ({
      sku: String(row[skuKey] || "").trim(),
      quantity: Number(row[qtyKey]) || 0,
      price: priceKey && row[priceKey] !== undefined && row[priceKey] !== "" ? Number(row[priceKey]) : undefined,
      raw: row
    })).filter(item => item.sku !== "" && item.quantity !== 0);
  },


  /**
   * หักหรือเพิ่มสต็อกและบันทึกประวัติ (Zero-Read Firestore Strategy)
   */
  processTransactions: async (items, actionType = 'deduct', managerUser) => {
    try {
      // 1. ดึงข้อมูลสต็อกปัจจุบันจาก GAS (0 Firebase Reads)
      await gasStockService.forceSync();
      const currentInventory = await gasStockService.fetchBackupInventory();
      
      const inventoryMap = new Map();
      currentInventory.forEach(item => inventoryMap.set(String(item.sku).trim(), item));

      const validUpdates = [];
      const notFound = [];

      // 2. คำนวณสต็อกใหม่
      items.forEach(item => {
        const product = inventoryMap.get(item.sku);
        if (product) {
          const oldStock = Number(product.stockQuantity) || 0;
          let newStock = oldStock;

          if (actionType === 'deduct') {
            newStock = Math.max(0, oldStock - item.quantity); // ป้องกันติดลบถ้าไม่ได้อนุญาต
          } else {
            newStock = oldStock + item.quantity;
          }

          if (newStock !== oldStock || item.price !== undefined) {
            validUpdates.push({
              sku: item.sku,
              name: product.name,
              oldStock,
              newStock,
              quantityChanged: actionType === 'deduct' ? -item.quantity : item.quantity,
              price: item.price !== undefined ? item.price : product.Price
            });
          }
        } else {
          notFound.push(item);
        }
      });

      if (validUpdates.length === 0) {
        return { success: true, updatedCount: 0, notFoundCount: notFound.length, message: "ไม่มีรายการที่ต้องอัปเดต" };
      }

      // 3. Batch Update ไปที่ Firebase Firestore (N Writes, 0 Reads)
      const chunks = [];
      for (let i = 0; i < validUpdates.length; i += 500) {
        chunks.push(validUpdates.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(update => {
          const docRef = doc(db, 'products', update.sku);
          const updateData = {
            stockQuantity: update.newStock,
            updatedAt: serverTimestamp()
          };
          if (update.price !== undefined) {
            updateData.Price = update.price;
          }
          batch.update(docRef, updateData);
          
          // คิวลง GAS ด้วยเพื่อให้ระบบตรงกัน
          gasStockService.queueUpdate({
            sku: update.sku,
            name: update.name,
            stockQuantity: update.newStock,
            Price: update.price !== undefined ? update.price : update.Price
          });
        });
        await batch.commit();
      }

      // 4. บันทึกประวัติ (History Logs) แบบรวบยอด
      gasHistoryService.log({
        level: 'INFO',
        module: 'Transaction Import',
        action: actionType === 'deduct' ? 'Bulk Deduct Stock' : 'Bulk Add Stock',
        actor: {
          uid: managerUser?.uid || auth.currentUser?.uid || 'Unknown',
          name: managerUser?.displayName || managerUser?.email || auth.currentUser?.email || 'System'
        },
        target: { id: 'Multiple', type: 'System' },
        details: {
          legacy_details: `อัปโหลดไฟล์อัปเดตสต็อกอัตโนมัติสำเร็จ ${validUpdates.length} รายการ (${actionType === 'deduct' ? 'หัก' : 'เพิ่ม'})`,
          actionType: actionType,
          totalUpdated: validUpdates.length,
          totalNotFound: notFound.length,
          tags: ['excel_import', 'bulk_update']
        }
      });

      // บันทึก History ย่อยสำหรับสินค้าแต่ละตัว
      validUpdates.forEach(update => {
        gasHistoryService.log({
          level: 'INFO',
          module: 'Inventory',
          action: 'Adjust Stock (Import)',
          target: { id: update.sku, name: update.name, type: 'Product' },
          details: {
            legacy_details: `อัปเดตสต็อกจากไฟล์ภายนอก (${actionType}): ${update.oldStock} -> ${update.newStock}`,
            changes: {
              stockQuantity: { from: update.oldStock, to: update.newStock }
            },
            tags: ['excel_import', update.sku]
          }
        });
      });

      // บังคับ flush เพื่อให้ระบบ GAS ทำงานทันที
      await gasStockService.forceSync();

      return {
        success: true,
        updatedCount: validUpdates.length,
        notFoundCount: notFound.length,
        message: `อัปเดตสำเร็จ ${validUpdates.length} รายการ`
      };

    } catch (error) {
      console.error("Error processing transactions:", error);
      throw error;
    }
  }
};
