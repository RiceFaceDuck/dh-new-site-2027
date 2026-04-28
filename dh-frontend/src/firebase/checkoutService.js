import { db } from './config';
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

export const checkoutService = {
  /**
   * ประมวลผลคำสั่งซื้อด้วยระบบ Transaction (Atomic Operations)
   * รัดกุม ปลอดภัย และประหยัด Reads/Writes กับ Firebase
   * รับ Payload ตรงจาก Checkout.jsx
   */
  async processCheckout(payload) {
    const {
      user,
      cartData,
      shippingInfo,
      taxInfo,
      b2bInfo,
      walletUsed,
      finalPayable,
      slipUrl,
      matchedFreebie,
      promoDiscount,
      shippingFee,
      appliedPromos,
      saveAddress
    } = payload;

    // 1. Safety Guard: ตรวจสอบความสมบูรณ์ของ User เพื่อป้องกัน Error: Cannot read properties of undefined
    const userId = user?.uid;
    if (!userId) {
      throw new Error("ข้อมูลผู้ใช้ไม่สมบูรณ์ หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }

    if (!cartData || !cartData.items || cartData.items.length === 0) {
      throw new Error("ไม่มีสินค้าในตะกร้า ไม่สามารถทำรายการได้");
    }

    try {
      // 2. เริ่มต้น Transaction (หักสต๊อก, ลด Wallet, สร้างออเดอร์, ลบตะกร้า จะต้องสำเร็จพร้อมกันทั้งหมด)
      const orderId = await runTransaction(db, async (transaction) => {
        
        // เตรียม References ที่ต้องใช้
        const userRef = doc(db, 'users', userId);
        const cartRef = doc(db, 'carts', userId);
        const newOrderRef = doc(collection(db, 'orders'));

        const productRefs = cartData.items.map(item => ({
          ref: doc(db, 'products', item.id || item.productId),
          item: item
        }));

        // ==========================================
        // [READ] อ่านข้อมูลทั้งหมดก่อน (กฎของ Firestore Transaction)
        // ==========================================
        
        // อ่านข้อมูล User เพื่อตรวจสอบ Wallet / ยอดคงเหลือ
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("ไม่พบข้อมูลบัญชีผู้ใช้ในระบบ");
        const userData = userDoc.data();

        let targetWalletField = '';
        let currentBalance = 0;

        // ตรวจสอบกระเป๋าเงิน (รองรับทั้งระบบเดิมและระบบใหม่ที่ใช้ stats.creditBalance หรือ partnerCredit)
        if (walletUsed > 0) {
          const creditBalance = userData.stats?.creditBalance || 0;
          const partnerCredit = userData.partnerCredit || 0;

          if (creditBalance >= walletUsed) {
            targetWalletField = 'stats.creditBalance';
            currentBalance = creditBalance;
          } else if (partnerCredit >= walletUsed) {
            targetWalletField = 'partnerCredit';
            currentBalance = partnerCredit;
          } else {
            throw new Error("ยอดเงินในระบบ (Wallet) ไม่เพียงพอสำหรับการทำรายการ");
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
          if ((pData.stock || 0) < p.item.qty) {
            throw new Error(`สินค้า ${p.item.name} มีสต๊อกไม่เพียงพอ (คงเหลือ ${pData.stock || 0} ชิ้น)`);
          }
          productDocs.push({ doc: pDoc, item: p.item });
        }

        // ==========================================
        // [WRITE] บันทึกข้อมูล (เมื่อตรวจสอบเงื่อนไขผ่านทั้งหมด)
        // ==========================================

        // 1. หักสต๊อกสินค้า
        for (const p of productDocs) {
          const newStock = p.doc.data().stock - p.item.qty;
          transaction.update(p.doc.ref, { stock: newStock });
        }

        // 2. อัปเดตข้อมูลผู้ใช้ (หัก Wallet และ/หรือ บันทึกที่อยู่ใหม่)
        const userUpdates = {};
        if (walletUsed > 0 && targetWalletField) {
          userUpdates[targetWalletField] = currentBalance - walletUsed;
        }
        if (saveAddress) {
          userUpdates.address = shippingInfo.address;
          userUpdates.phone = shippingInfo.phone;
          userUpdates.contactName = shippingInfo.fullName;
          userUpdates.logisticProvider = shippingInfo.logisticProvider;
        }
        if (Object.keys(userUpdates).length > 0) {
          transaction.update(userRef, userUpdates);
        }

        // 3. Double-entry Bookkeeping: สร้าง History Log บันทึกการหัก Wallet
        if (walletUsed > 0) {
          const walletLogRef = doc(collection(db, 'walletLogs'));
          transaction.set(walletLogRef, {
            userId,
            type: 'deduct',
            amount: walletUsed,
            reason: `ชำระค่าสินค้า สำหรับคำสั่งซื้อ #${newOrderRef.id}`,
            orderId: newOrderRef.id,
            createdAt: serverTimestamp()
          });
        }

        // 4. สร้างเอกสารคำสั่งซื้อ (Order)
        // จัดการสถานะอัตโนมัติ เพื่อเชื่อมโยงให้หลังบ้านทำงานต่อได้ทันที
        let orderStatus = 'pending';
        if (b2bInfo?.isRequesting) {
          orderStatus = 'draft'; // บิล B2B รอพนักงานหลังบ้านตีราคา
        } else if (finalPayable === 0) {
          orderStatus = 'paid'; // ใช้ Wallet จ่ายเต็มจำนวน
        } else if (slipUrl) {
          orderStatus = 'verifying_slip'; // รอแอดมินตรวจสลิป
        }

        const orderPayload = {
          orderId: newOrderRef.id,
          userId,
          customerName: shippingInfo.fullName,
          items: cartData.items,
          shippingInfo,
          taxInfo: taxInfo?.isRequesting ? taxInfo : null,
          b2bInfo: b2bInfo?.isRequesting ? b2bInfo : null,
          summary: {
            subtotal: cartData.total || 0,
            shippingFee,
            promoDiscount,
            walletUsed,
            finalPayable
          },
          appliedPromos: appliedPromos || [],
          matchedFreebie: matchedFreebie || null,
          slipUrl: slipUrl || null,
          status: orderStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(newOrderRef, orderPayload);

        // 5. เคลียร์ตะกร้าสินค้าของลูกค้า
        transaction.delete(cartRef);

        return newOrderRef.id;
      });

      return { success: true, orderId };

    } catch (error) {
      console.error("❌ Checkout Service Error: ", error);
      throw error; 
    }
  }
};