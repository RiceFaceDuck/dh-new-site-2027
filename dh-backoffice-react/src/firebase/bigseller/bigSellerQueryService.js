import { gasStockService } from '../gasStockService.js';
import { db } from '../config.js';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils.js';
import { inventorySyncMetaService } from '../inventory/inventorySyncMetaService.js';

// Filter out test and simulation SKU artifacts
export function isTestProduct(sku = '', name = '') {
  const s = String(sku || '').trim().toUpperCase();
  const n = String(name || '').trim().toUpperCase();
  return s.startsWith('SKU-TEST') || s.startsWith('TEST-') || s.startsWith('DUMMY-') || s.startsWith('SIM-') || n.includes('ม้าดำ');
}

export function parsePrice(val) {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

export function formatChangeTime(timestamp) {
  if (!timestamp) return '';
  let dateObj = null;
  if (typeof timestamp.toDate === 'function') {
    dateObj = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    dateObj = timestamp;
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) dateObj = parsed;
  }
  if (!dateObj) return '';
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')} น.`;
}

export function computeInventoryDiff({ previousInventory = [], currentInventory = [], lastResetDate = new Date() }) {
  const prevMap = new Map();
  previousInventory.forEach(item => {
    if (item.sku) prevMap.set(String(item.sku).trim().toUpperCase(), item);
  });

  const currMap = new Map();
  currentInventory.forEach(item => {
    if (item.sku) currMap.set(String(item.sku).trim().toUpperCase(), item);
  });

  const increased = [];
  const decreased = [];
  const priceChanged = [];
  const otherChanged = [];

  currentInventory.forEach(curr => {
    if (!curr.sku || isTestProduct(curr.sku, curr.name)) return;
    const skuKey = String(curr.sku).trim().toUpperCase();
    const prev = prevMap.get(skuKey);

    const currStock = Number(curr.stockQuantity) || 0;
    let currPrice = Number(curr.wholesalePrice ?? curr.Price ?? curr.price) || 0;

    if (!prev) {
      if (currStock > 0) {
        increased.push({
          sku: curr.sku,
          name: curr.name,
          oldStock: 0,
          newStock: currStock,
          updatedAt: curr.updatedAt,
          updatedAtText: formatChangeTime(curr.updatedAt)
        });
      }
      return;
    }

    const prevStock = Number(prev.stockQuantity) || 0;
    const prevPrice = Number(prev.wholesalePrice ?? prev.Price ?? prev.price) || 0;
    if (currPrice === 0 && prevPrice > 0) {
      currPrice = prevPrice;
    }

    const updatedAt = curr.updatedAt;
    const updatedAtText = formatChangeTime(updatedAt);

    if (currStock > prevStock) {
      increased.push({
        sku: curr.sku,
        name: curr.name,
        oldStock: prevStock,
        newStock: currStock,
        updatedAt,
        updatedAtText
      });
    } else if (currStock < prevStock) {
      decreased.push({
        sku: curr.sku,
        name: curr.name,
        oldStock: prevStock,
        newStock: currStock,
        updatedAt,
        updatedAtText
      });
    }

    if (currPrice !== prevPrice) {
      priceChanged.push({
        sku: curr.sku,
        name: curr.name,
        oldPrice: prevPrice,
        newPrice: currPrice,
        updatedAt,
        updatedAtText
      });
    }

    // Name or category changes
    const details = [];
    if (curr.name && prev.name && curr.name !== prev.name) {
      details.push('ชื่อเปลี่ยน');
    }
    if (curr.category && prev.category && curr.category !== prev.category) {
      details.push(`เปลี่ยนหมวดหมู่เป็น ${curr.category}`);
    }
    if (details.length > 0) {
      otherChanged.push({
        sku: curr.sku,
        name: curr.name,
        details: details.join(', '),
        updatedAt,
        updatedAtText
      });
    }
  });

  // Items removed or missing in current inventory
  previousInventory.forEach(prev => {
    if (!prev.sku || isTestProduct(prev.sku, prev.name)) return;
    const skuKey = String(prev.sku).trim().toUpperCase();
    if (!currMap.has(skuKey)) {
      const oldStock = Number(prev.stockQuantity) || 0;
      if (oldStock > 0) {
        decreased.push({
          sku: prev.sku,
          name: prev.name || '(สินค้านี้ถูกลบออกจาก Big Seller)',
          oldStock,
          newStock: 0
        });
      }
    }
  });

  return {
    increased,
    decreased,
    priceChanged,
    otherChanged,
    currentInventory,
    lastResetDate
  };
}

class BigSellerQueryService {
  /**
   * ดึงเวลา Reset ล่าสุดจาก Firestore
   */
  async getLastResetTime() {
    try {
      const docRef = doc(db, getCollectionPath('system_counters'), 'bigseller_baseline');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().lastResetAt) {
        const ts = docSnap.data().lastResetAt;
        return ts.toDate ? ts.toDate() : new Date(ts);
      }
    } catch (e) {
      console.error("Error fetching reset time:", e);
    }
    return new Date();
  }

  /**
   * อ่าน Baseline Snapshot และแกะ Schema { s, q, p, n } หรือ { sku, stockQuantity, Price, name }
   */
  async getBaselineSnapshot() {
    try {
      const docRef = doc(db, getCollectionPath('system_counters'), 'bigseller_baseline');
      const docSnap = await getDoc(docRef);
      let previousInventory = [];
      let lastResetTimestamp = null;
      let lastResetDate = new Date();

      if (docSnap.exists() && docSnap.data().inventory) {
        previousInventory = docSnap.data().inventory.map(item => {
          const wp = Number(item.wp === undefined ? (item.wholesalePrice ?? item.p ?? item.Price ?? item.price ?? 0) : item.wp);
          const rp = Number(item.rp === undefined ? (item.retailPrice ?? wp) : item.rp);
          const price = wp > 0 ? wp : rp;
          const retail = rp > 0 ? rp : price;
          return {
            sku: String(item.s || item.sku || '').trim().toUpperCase(),
            stockQuantity: Number(item.q === undefined ? (item.stockQuantity ?? item.qty ?? 0) : item.q),
            retailPrice: retail,
            wholesalePrice: price,
            Price: price,
            price: price,
            name: item.n || item.name || ''
          };
        }).filter(item => item.sku !== '');

        if (docSnap.data().lastResetAt) {
          lastResetTimestamp = docSnap.data().lastResetAt;
          lastResetDate = lastResetTimestamp.toDate ? lastResetTimestamp.toDate() : new Date(lastResetTimestamp);
        }
      }

      return { previousInventory, lastResetTimestamp, lastResetDate };
    } catch (err) {
      console.error("Error fetching baseline snapshot:", err);
      return { previousInventory: [], lastResetTimestamp: null, lastResetDate: new Date() };
    }
  }

  /**
   * บันทึก Baseline โดยบีบอัดฟิลด์ { s, q, p, rp, wp } ป้องกันขนาดเอกสารเกิน 800KB
   */
  async saveBaselineOnly(inventory) {
    try {
      const docRef = doc(db, getCollectionPath('system_counters'), 'bigseller_baseline');
      const compacted = inventory
        .filter(item => !isTestProduct(item.sku, item.name))
        .map(item => {
          const rp = Number(item.retailPrice ?? 0);
          const wp = Number(item.wholesalePrice ?? item.Price ?? item.price ?? 0);
          const p = wp > 0 ? wp : (rp > 0 ? rp : 0);
          const r = rp > 0 ? rp : p;
          return {
            s: String(item.sku || '').trim().toUpperCase(),
            q: Number(item.stockQuantity ?? item.qty ?? 0),
            p,
            rp: r,
            wp: p
          };
        })
        .filter(item => item.s !== '');

      await setDoc(docRef, {
        lastResetAt: serverTimestamp(),
        inventory: compacted,
        itemCount: compacted.length
      });
      return true;
    } catch (err) {
      console.error("Error saving baseline only:", err);
      return false;
    }
  }

  /**
   * รีเซ็ต Baseline โดยบันทึกข้อมูลปัจจุบันลง Firestore และรีเซ็ต pending changes
   */
  async resetBaseline(currentInventory) {
    try {
      const docRef = doc(db, getCollectionPath('system_counters'), 'bigseller_baseline');
      const pendingRef = doc(db, getCollectionPath('catalogs'), 'sync_pending_changes');

      const compacted = currentInventory
        .filter(item => !isTestProduct(item.sku, item.name))
        .map(item => {
          const rp = Number(item.retailPrice ?? 0);
          const wp = Number(item.wholesalePrice ?? item.Price ?? item.price ?? 0);
          const p = wp > 0 ? wp : (rp > 0 ? rp : 0);
          const r = rp > 0 ? rp : p;
          return {
            s: String(item.sku || '').trim().toUpperCase(),
            q: Number(item.stockQuantity ?? item.qty ?? 0),
            p,
            rp: r,
            wp: p
          };
        })
        .filter(item => item.s !== '');

      const jsonLength = JSON.stringify(compacted).length;
      if (jsonLength > 819200) {
        console.warn(`[BaselineService] WARNING: Baseline document size (${Math.round(jsonLength / 1024)} KB) exceeds 800KB ceiling.`);
      }

      const nowTs = serverTimestamp();
      await setDoc(docRef, {
        lastResetAt: nowTs,
        inventory: compacted,
        itemCount: compacted.length
      });

      await setDoc(pendingRef, {
        id: 'sync_pending_changes',
        lastUpdated: nowTs,
        changes: { increased: [], decreased: [], priceChanged: [], otherChanged: [] },
        pendingCount: 0
      }, { merge: true }).catch(e => console.warn("Could not reset sync chunk:", e.message));

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('bigseller_last_export_state');
        localStorage.removeItem('bigseller_reset_date');
      }

      return true;
    } catch (e) {
      console.error("Error resetting baseline:", e);
      throw e;
    }
  }

  /**
   * คำนวณความเปลี่ยนแปลง (Calculate Changes) ด้วย Local-First Catalog (0 Reads) & Incremental Diff
   */
  async calculateChanges() {
    try {
      // 1. ส่งคิว GAS ที่ค้างอยู่ (non-blocking)
      await gasStockService.forceSync();

      // 2. ดึง Baseline เดิมจาก Firestore
      const { previousInventory, lastResetTimestamp, lastResetDate } = await this.getBaselineSnapshot();
      let currentInventory = [];

      if (lastResetTimestamp) {
        // Incremental Mode: ดึงเฉพาะสินค้าที่มีการแก้ไขตั้งแต่วันที่ Reset ล่าสุด (ประหยัด Quota Firestore)
        const productsCol = collection(db, getCollectionPath('products'));
        const q = query(productsCol, where('updatedAt', '>=', lastResetTimestamp), limit(500));
        const snap = await getDocs(q);
        const updatedMap = new Map();

        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const sku = String(docSnap.id || data.sku || '').trim().toUpperCase();
          if (sku && !isTestProduct(sku, data.name)) {
            const rp = parsePrice(data.retailPrice ?? data.Price ?? data.price ?? data.wholesalePrice);
            const wp = parsePrice(data.wholesalePrice ?? data.price ?? data.Price);
            const retail = rp > 0 ? rp : (wp > 0 ? wp : 0);
            const wholesale = wp > 0 ? wp : (rp > 0 ? rp : 0);
            updatedMap.set(sku, {
              sku,
              name: data.name || '',
              stockQuantity: Number(data.stockQuantity || data.qty || 0),
              retailPrice: retail,
              wholesalePrice: wholesale,
              Price: wholesale,
              price: wholesale,
              updatedAt: data.updatedAt || null,
              isActive: data.isActive !== false
            });
          }
        });

        // ประกบรายการแก้ไขเข้ากับ Baseline เดิม
        currentInventory = previousInventory.map(item => ({ ...item }));
        for (const [sku, updatedItem] of updatedMap.entries()) {
          const idx = currentInventory.findIndex(x => x.sku === sku);
          if (updatedItem.isActive) {
            if (idx === -1) {
              currentInventory.push(updatedItem);
            } else {
              currentInventory[idx] = updatedItem;
            }
          } else {
            if (idx !== -1) {
              currentInventory.splice(idx, 1);
            }
          }
        }
      } else {
        // Cold Start / ไม่มี Reset Timestamp: ดึงจาก 3-Tier Cache (IndexedDB 0 Reads!)
        const catalogData = await inventorySyncMetaService.getOrFetchCatalog();
        currentInventory = (catalogData?.products || []).map(p => {
          const rp = parsePrice(p.retailPrice ?? p.Price ?? p.price ?? p.wholesalePrice);
          const wp = parsePrice(p.wholesalePrice ?? p.price ?? p.Price);
          const retail = rp > 0 ? rp : (wp > 0 ? wp : 0);
          const wholesale = wp > 0 ? wp : (rp > 0 ? rp : 0);
          return {
            sku: String(p.sku || p.id || '').trim().toUpperCase(),
            name: p.name || '',
            stockQuantity: Number(p.stockQuantity || p.qty || 0),
            retailPrice: retail,
            wholesalePrice: wholesale,
            Price: wholesale,
            price: wholesale
          };
        }).filter(item => item.sku !== '' && !isTestProduct(item.sku, item.name));

        if (!currentInventory || currentInventory.length === 0) {
          throw new Error("ไม่พบข้อมูลสินค้าในคลัง");
        }

        await this.saveBaselineOnly(currentInventory);
      }

      return computeInventoryDiff({
        previousInventory,
        currentInventory,
        lastResetDate
      });
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
    const catalogData = await inventorySyncMetaService.getOrFetchCatalog();
    const currentInventory = (catalogData?.products || []).map(p => {
      const rp = parsePrice(p.retailPrice ?? p.Price ?? p.price ?? p.wholesalePrice);
      const wp = parsePrice(p.wholesalePrice ?? p.price ?? p.Price);
      const retail = rp > 0 ? rp : (wp > 0 ? wp : 0);
      const wholesale = wp > 0 ? wp : (rp > 0 ? rp : 0);
      return {
        sku: String(p.sku || p.id || '').trim().toUpperCase(),
        name: p.name || '',
        stockQuantity: Number(p.stockQuantity || p.qty || 0),
        retailPrice: retail,
        wholesalePrice: wholesale,
        Price: wholesale,
        price: wholesale
      };
    }).filter(item => item.sku !== '' && !isTestProduct(item.sku, item.name));

    await this.resetBaseline(currentInventory);

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
