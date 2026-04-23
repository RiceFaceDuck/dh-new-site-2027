import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'carts';

export const cartService = {
  /**
   * 🛒 ดึงข้อมูลตะกร้าสินค้าปัจจุบัน (ใช้โควต้า 1 Read)
   */
  getCart: async (uid) => {
    if (!uid) return { items: [], total: 0, totalQty: 0 };
    try {
      const cartRef = doc(db, COLLECTION_NAME, uid);
      const snap = await getDoc(cartRef);
      
      if (snap.exists()) {
        return snap.data();
      }
      return { items: [], total: 0, totalQty: 0 };
    } catch (error) {
      console.error("🔥 Error fetching cart:", error);
      throw error;
    }
  },

  /**
   * ➕ หยิบสินค้าใส่ตะกร้า (Smart Update)
   * ถ้ามีสินค้าเดิมอยู่แล้ว จะทำการบวกจำนวนเพิ่มให้ ไม่สร้างรายการซ้ำซ้อน
   */
  addToCart: async (uid, product, qty = 1) => {
    if (!uid) throw new Error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
    
    try {
      const cartRef = doc(db, COLLECTION_NAME, uid);
      const snap = await getDoc(cartRef);
      
      let currentItems = [];
      if (snap.exists()) {
        currentItems = snap.data().items || [];
      }

      // เช็คว่ามีสินค้านี้ในตะกร้าหรือยัง (อิงจาก ID หรือ SKU)
      const productId = product.id || product.sku;
      const existingItemIndex = currentItems.findIndex(item => (item.id || item.sku) === productId);

      if (existingItemIndex > -1) {
        // มีอยู่แล้ว -> บวกจำนวนเพิ่ม
        currentItems[existingItemIndex].qty += qty;
      } else {
        // ยังไม่มี -> เพิ่มรายการใหม่
        currentItems.push({
          id: productId,
          sku: product.sku || '-',
          name: product.name,
          price: product.retailPrice || product.price || 0, // ใช้ราคาขายปลีกเป็นหลัก (เตรียมต่อยอดราคาส่ง B2B ในอนาคต)
          image: product.images?.[0] || product.image || '',
          qty: qty
        });
      }

      // คำนวณยอดรวมใหม่ทั้งหมดในหน่วยความจำ ก่อนส่งขึ้น Cloud
      const totalSummary = currentItems.reduce(
        (acc, item) => {
          acc.total += item.price * item.qty;
          acc.totalQty += item.qty;
          return acc;
        },
        { total: 0, totalQty: 0 }
      );

      // บันทึกทับ Document เดิม (ใช้โควต้า 1 Write)
      await setDoc(cartRef, {
        uid: uid,
        items: currentItems,
        total: totalSummary.total,
        totalQty: totalSummary.totalQty,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { success: true, cartTotal: totalSummary.totalQty };
    } catch (error) {
      console.error("🔥 Error adding to cart:", error);
      throw error;
    }
  },

  /**
   * ➖ ลบสินค้า หรือ อัปเดตจำนวนในหน้าตะกร้า
   */
  updateCartItemQty: async (uid, productId, newQty) => {
    if (!uid) return;
    
    try {
      const cartRef = doc(db, COLLECTION_NAME, uid);
      const snap = await getDoc(cartRef);
      if (!snap.exists()) return;

      let currentItems = snap.data().items || [];
      
      if (newQty <= 0) {
        // ลบออกจากตะกร้า
        currentItems = currentItems.filter(item => (item.id || item.sku) !== productId);
      } else {
        // อัปเดตจำนวน
        const existingItemIndex = currentItems.findIndex(item => (item.id || item.sku) === productId);
        if (existingItemIndex > -1) {
          currentItems[existingItemIndex].qty = newQty;
        }
      }

      const totalSummary = currentItems.reduce(
        (acc, item) => {
          acc.total += item.price * item.qty;
          acc.totalQty += item.qty;
          return acc;
        },
        { total: 0, totalQty: 0 }
      );

      await setDoc(cartRef, {
        items: currentItems,
        total: totalSummary.total,
        totalQty: totalSummary.totalQty,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return true;
    } catch (error) {
      console.error("🔥 Error updating cart qty:", error);
      throw error;
    }
  },

  /**
   * 🧹 ล้างตะกร้า (เรียกใช้หลังจากสร้างออเดอร์ (Checkout) สำเร็จ)
   */
  clearCart: async (uid) => {
    try {
      const cartRef = doc(db, COLLECTION_NAME, uid);
      await setDoc(cartRef, {
        items: [],
        total: 0,
        totalQty: 0,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("🔥 Error clearing cart:", error);
    }
  }
};