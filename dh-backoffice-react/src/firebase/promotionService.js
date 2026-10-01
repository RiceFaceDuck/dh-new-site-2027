import { limit, collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { todoService } from './todoService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { inventorySyncMetaService } from './inventory/inventorySyncMetaService';

const COLLECTION_NAME = getCollectionPath('promotions');

// Helper for validating SKUs (IndexedDB 0-Read first, with Firestore chunked query fallback)
export const validateSkus = async (skusArray) => {
  if (!Array.isArray(skusArray) || skusArray.length === 0) return { validSkus: [], removedSkus: [] };
  
  // 1. Try zero-read cache from inventorySyncMetaService (Tier 1 memory / Tier 2 IndexedDB)
  try {
    const catalogResult = await inventorySyncMetaService.getOrFetchCatalog({ forceRefresh: false });
    const catalog = catalogResult?.catalog || catalogResult?.products || [];
    
    if (Array.isArray(catalog) && catalog.length > 0) {
      // Build a map of uppercase SKU -> canonical SKU
      const catalogSkuMap = new Map();
      for (const item of catalog) {
        const rawSku = item?.sku || item?.id;
        if (rawSku) {
          const trimmed = String(rawSku).trim();
          catalogSkuMap.set(trimmed.toUpperCase(), trimmed);
        }
      }
      
      const validSkus = [];
      const removedSkus = [];
      const seenValid = new Set();
      
      for (const rawInputSku of skusArray) {
        if (!rawInputSku) continue;
        const trimmedInput = String(rawInputSku).trim();
        const upperInput = trimmedInput.toUpperCase();
        
        if (catalogSkuMap.has(upperInput)) {
          const canonicalSku = catalogSkuMap.get(upperInput);
          if (!seenValid.has(canonicalSku)) {
            seenValid.add(canonicalSku);
            validSkus.push(canonicalSku);
          }
        } else {
          removedSkus.push(trimmedInput);
        }
      }
      
      return { validSkus, removedSkus };
    }
  } catch (err) {
    console.warn('⚠️ [promotionService] Catalog cache validation failed, falling back to Firestore query:', err);
  }

  // 2. Fallback: Firestore chunk query (max 30 per 'in' query)
  const validSkus = new Set();
  for (let i = 0; i < skusArray.length; i += 30) {
    const chunk = skusArray.slice(i, i + 30).map(s => String(s || '').trim()).filter(Boolean);
    if (chunk.length === 0) continue;
    const q = query(collection(db, getCollectionPath('products')), where('sku', 'in', chunk), limit(300));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const dataSku = doc.data()?.sku;
      if (dataSku) validSkus.add(String(dataSku).trim());
    });
  }
  
  const validSkusArray = Array.from(validSkus);
  const removedSkus = skusArray
    .map(s => String(s || '').trim())
    .filter(sku => sku && !validSkus.has(sku));
  return { validSkus: validSkusArray, removedSkus };
};

export const promotionService = {
  validateSkus,
  // 📥 ดึงโปรโมชันทั้งหมด (สำหรับหน้าจัดการของผู้จัดการ)
  getAllPromotions: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(300));
      const snapshot = await getDocs(q);
      const allPromos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return allPromos.filter(promo => !promo.deletedAt); // กรองโปรโมชันที่ถูกลบ (Soft Delete) ออก
    } catch (error) {
      console.error("🔥 Error fetching promotions:", error);
      return [];
    }
  },

  // 🟢 ดึงเฉพาะโปรโมชันที่กำลังเปิดใช้งาน (ประหยัด Read ใช้หน้า POS)
  getActivePromotions: async () => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('isActive', '==', true)
      , limit(300));
      const snapshot = await getDocs(q);
      // Sort in memory ประหยัด Index
      const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return promos.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
    } catch (error) {
      console.error("🔥 Error fetching active promotions:", error);
      return [];
    }
  },

  // ✨ สร้างโปรโมชันใหม่
  createPromotion: async (promoData, user) => {
    try {
      let finalSkus = promoData.applicableSkus || [];
      if (finalSkus.length > 0) {
        const { validSkus, removedSkus } = await validateSkus(finalSkus);
        finalSkus = validSkus;
        
        if (removedSkus.length > 0) {
          await historyService.addLog(
            'Promotion', 'Validate', 'SYSTEM', 
            `พบและลบ SKU ที่ไม่มีในสต็อกออกจากโปรโมชัน (${promoData.title}): ${removedSkus.join(', ')}`, 
            user.uid
          );
        }
      }

      const payload = {
        ...promoData,
        applicableSkus: finalSkus,
        isActive: true,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      
      // 📝 บันทึกประวัติ
      await historyService.addLog(
        'Promotion', 'Create', docRef.id, 
        `สร้างโปรโมชันใหม่: ${promoData.title} (${promoData.type})`, 
        user.uid
      );

      // 🔔 สร้าง Todo แจ้งเตือนพนักงานทุกคน (Broadcast)
      await todoService.createManualTask({
        type: 'promotion_alert',
        title: `📣 แจ้งโปรโมชันใหม่: ${promoData.title}`,
        description: `มีโปรโมชันใหม่ถูกเพิ่มเข้าระบบ\nเงื่อนไข: ${promoData.description || 'ไม่มีรายละเอียดเพิ่มเติม'}\nสามารถเรียกใช้งานได้ที่หน้า เปิดบิล (POS)`,
        priority: 'Medium',
        assignedTo: 'all',
        payload: {
          id: docRef.id,
          name: promoData.title,
          title: promoData.title,
          type: promoData.type,
          value: promoData.value,
          minSpend: promoData.minSpend || 0,
          endDate: promoData.endDate || null
        }
      }, user);

      return docRef.id;
    } catch (error) {
      console.error("🔥 Error creating promotion:", error);
      throw error;
    }
  },

  // 📝 แก้ไขโปรโมชัน / เปิด-ปิด สถานะ
  updatePromotion: async (promoId, updates, user, actionName = 'แก้ไข') => {
    try {
      const docRef = doc(db, COLLECTION_NAME, promoId);
      
      let finalUpdates = { ...updates };
      if (updates.applicableSkus) {
        const { validSkus, removedSkus } = await validateSkus(updates.applicableSkus);
        finalUpdates.applicableSkus = validSkus;
        
        if (removedSkus.length > 0) {
          await historyService.addLog(
            'Promotion', 'Validate', promoId, 
            `พบและลบ SKU ที่ไม่มีในสต็อกออกจากโปรโมชัน: ${removedSkus.join(', ')}`, 
            user.uid
          );
        }
      }

      await updateDoc(docRef, {
        ...finalUpdates,
        updatedAt: serverTimestamp()
      });

      await historyService.addLog(
        'Promotion', 'Update', promoId, 
        `${actionName}โปรโมชัน`, 
        user.uid
      );

      return true;
    } catch (error) {
      console.error("🔥 Error updating promotion:", error);
      throw error;
    }
  },

  // 🗑️ ลบโปรโมชัน (Soft Delete)
  deletePromotion: async (promoId, promoTitle, user) => {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, promoId), { isActive: false, deletedAt: serverTimestamp() });
      
      await historyService.addLog(
        'Promotion', 'Delete', promoId, 
        `ลบโปรโมชัน (Soft Delete): ${promoTitle}`, 
        user.uid
      );
      
      return true;
    } catch (error) {
      console.error("🔥 Error deleting promotion:", error);
      throw error;
    }
  }
};