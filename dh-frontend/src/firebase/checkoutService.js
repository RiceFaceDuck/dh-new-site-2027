import { db } from './config';
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

export const checkoutService = {
  /**
   * ประมวลผลคำสั่งซื้อด้วยระบบ Transaction (Atomic Operations)
   * รัดกุม ปลอดภัย และประหยัด Reads/Writes กับ Firebase
   * รับ Payload ตรงจาก Checkout.jsx
   * @param {string} userId - ID ของลูกค้า
   * @param {Object} orderData - ข้อมูลสรุปคำสั่งซื้อ
   */
  async processCheckout(userId, orderData) {
    if (!userId) {
      throw new Error("ข้อมูลผู้ใช้ไม่สมบูรณ์ หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }

    if (!orderData || !orderData.items || orderData.items.length === 0) {
      throw new Error("ไม่มีสินค้าในตะกร้า ไม่สามารถทำรายการได้");
    }

    const {
      items,
      // shippingAddress,
      // contactPhone,
      // paymentMethod,
      totalInfo
    } = orderData;

    const discountFromPoints = totalInfo.discountFromPoints || 0;

    try {
      // เริ่มต้น Transaction
      const orderId = await runTransaction(db, async (transaction) => {
        
        // 1. เตรียม References ที่ต้องใช้ตามโครงสร้างใหม่
        const userWalletRef = doc(db, 'artifacts', appId, 'users', userId, 'wallet', 'default');
        // const cartRef = doc(db, 'artifacts', appId, 'users', userId, 'cart', 'data');
        const newOrderRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'orders'));

        // เตรียม References สำหรับสินค้าในตะกร้าเพื่อตรวจและหักสต๊อก
        const productRefs = items.map(item => ({
          ref: doc(db, 'artifacts', appId, 'public', 'data', 'products', item.id || item.productId),
          item: item
        }));

        // ==========================================
        // [READ] อ่านข้อมูลทั้งหมดก่อน (กฎของ Firestore Transaction)
        // ==========================================
        
        let currentBalance = 0;

        // อ่านข้อมูล Wallet เฉพาะเมื่อมีการใช้แต้มเป็นส่วนลด
        if (discountFromPoints > 0) {
          const walletDoc = await transaction.get(userWalletRef);
          if (!walletDoc.exists()) {
            throw new Error("ไม่พบข้อมูลกระเป๋าเงิน (Wallet) ของคุณ");
          }
          currentBalance = walletDoc.data().balance || 0;

          if (currentBalance < discountFromPoints) {
            throw new Error(`ยอดแต้มในระบบไม่เพียงพอ (คุณมี ${currentBalance} Pts แต่พยายามใช้ ${discountFromPoints} Pts)`);
          }
        }

        // อ่านข้อมูลสินค้า เพื่อตรวจสต๊อก
        const productDocs = [];
        for (const p of productRefs) {
          const pDoc = await transaction.get(p.ref);
          if (!pDoc.exists()) {
            throw new Error(`ไม่พบสินค้า (${p.item.name}) ในคลังสินค้า`);
          }
          
          const pData = pDoc.data();
          // ดึงจำนวนสต๊อกจากรูปแบบข้อมูลที่อาจแตกต่างกัน
          const stock = pData.stock?.quantity || pData.stock || pData.qty || 0;

          if (stock < p.item.quantity) {
            throw new Error(`สินค้า ${p.item.name} มีสต๊อกไม่เพียงพอ (คงเหลือ ${stock} ชิ้น)`);
          }
          productDocs.push({ doc: pDoc, item: p.item, currentStock: stock });
        }

        // ==========================================
        // [WRITE] บันทึกข้อมูล (เมื่อตรวจสอบเงื่อนไขผ่านทั้งหมด)
        // ==========================================

        // 1. หักสต๊อกสินค้า
        for (const p of productDocs) {
          const newStock = p.currentStock - p.item.quantity;
          // อัปเดตสต๊อก ขึ้นอยู่กับโครงสร้างข้อมูลของสินค้า
          if (typeof p.doc.data().stock === 'object') {
             transaction.update(p.doc.ref, { 'stock.quantity': newStock });
          } else {
             transaction.update(p.doc.ref, { stock: newStock });
          }
        }

        // 2. หัก Wallet และสร้าง History Log (ถ้ามีการใช้แต้ม)
        if (discountFromPoints > 0) {
          transaction.update(userWalletRef, { balance: currentBalance - discountFromPoints });

          const historyLogRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'credit_history'));
          transaction.set(historyLogRef, {
            type: 'spend',
            points: discountFromPoints,
            note: `ใช้เป็นส่วนลดสำหรับคำสั่งซื้อ #${newOrderRef.id.substring(0,8)}`,
            referenceId: newOrderRef.id,
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        }

        // 3. สร้างเอกสารคำสั่งซื้อ (Order) ใน Folder ของ User
        let orderStatus = 'waiting_payment';
        if (totalInfo.grandTotal === 0) {
           orderStatus = 'paid'; // ถ้าใช้แต้มจ่ายเต็มจำนวน
        }
        
        if (orderData.b2bInfo?.isRequesting) {
           orderStatus = 'b2b_request'; // ถ้าเป็นรายการขอราคาส่ง B2B
        }

        const orderPayload = {
          orderId: newOrderRef.id,
          userId,
          ...orderData, // ดึงข้อมูล taxInfo, b2bInfo และอื่นๆ ที่ส่งมาจาก Checkout.jsx
          orderStatus: orderStatus,
          status: orderStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(newOrderRef, orderPayload);

        // 4. สร้าง Log ส่งให้แอดมินรับทราบ (History_logs ส่วนกลาง)
        const adminLogMessage = orderData.b2bInfo?.isRequesting ? 'มีคำขอราคาส่งใหม่ B2B' : 'มีคำสั่งซื้อใหม่ รอยืนยันการชำระเงิน';
        const adminLogRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'History_logs'));
        transaction.set(adminLogRef, {
          type: orderData.b2bInfo?.isRequesting ? 'B2B_REQUEST' : 'NEW_ORDER',
          orderId: newOrderRef.id,
          userId: userId,
          amount: totalInfo.grandTotal || 0,
          message: adminLogMessage,
          timestamp: serverTimestamp(),
          status: 'unread'
        });

        // 5. ไม่จำเป็นต้องลบ Cart ในนี้ เพราะ Checkout.jsx จะเรียก cartService.clearCart() ให้แล้ว
        // (แยกให้ชัดเจนตามสถาปัตยกรรมของคุณ)

        return newOrderRef.id;
      });

      return { success: true, orderId };

    } catch (error) {
      console.error("❌ Checkout Service Error: ", error);
      throw error; 
    }
  }
};