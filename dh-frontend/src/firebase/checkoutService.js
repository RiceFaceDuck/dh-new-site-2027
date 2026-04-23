import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { cartService } from './cartService';

export const checkoutService = {
  /**
   * 🚀 ประมวลผลคำสั่งซื้อ (Atomic Transaction)
   * [อัปเกรด]: รองรับสถานะ Draft, Snapshot ข้อมูลร้านค้า/สินค้า, และแยกประเภท To-do B2B/Retail
   */
  processCheckout: async (payload) => {
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
      promoDiscount = 0,
      shippingFee = 0,
      appliedPromos = [],
      saveAddress = false
    } = payload;

    const orderId = `DH-${Date.now().toString().slice(-6)}`;
    const subTotal = cartData.total || 0; // ยอดรวมก่อนหักส่วนลด

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userRef);

        let currentWallet = userDoc.exists() ? (userDoc.data().stats?.creditBalance || 0) : 0;
        let accountType = userDoc.exists() ? (userDoc.data().userType || 'customer') : 'customer'; // 🚀 Snapshot Account Type
        let userUpdates = {};
        let hasUserUpdates = false;

        // 1. อัปเดตข้อมูลผู้ติดต่อและที่อยู่ถ้าลูกค้าเลือกว่าจะบันทึก
        if (saveAddress) {
          userUpdates.contactName = shippingInfo.fullName;
          userUpdates.phone = shippingInfo.phone;
          userUpdates.address = shippingInfo.address;
          userUpdates.logisticProvider = shippingInfo.logisticProvider;
          hasUserUpdates = true;
        }

        // 2. หักเงินจาก Wallet (เฉพาะกรณีชำระทันที Retail และมีการใช้ Wallet)
        if (!b2bInfo.isRequesting && walletUsed > 0) {
          if (currentWallet < walletUsed) {
            throw new Error("ยอดเงินใน Wallet ไม่เพียงพอ");
          }
          userUpdates['stats.creditBalance'] = currentWallet - walletUsed;
          userUpdates.updatedAt = serverTimestamp();
          hasUserUpdates = true;
        }

        if (hasUserUpdates) {
          transaction.update(userRef, userUpdates);
        }

        // 🚀 3. จัดเตรียม Item Snapshot (ล็อคราคาและข้อมูลสินค้า ณ ปัจจุบัน)
        const itemsSnapshot = cartData.items.map(item => ({
          id: item.id || item.sku,
          sku: item.sku,
          name: item.name || item.title,
          price: item.price, // ล็อคราคาขายปลีก
          qty: item.qty,
          image: item.image || item.imageUrl || ''
        }));

        // 4. สร้าง Order Document
        const orderRef = doc(db, 'orders', orderId);
        const orderData = {
          id: orderId,
          orderId: orderId,
          userId: user.uid,
          customerInfo: {
            uid: user.uid,
            name: shippingInfo.fullName,
            email: user.email,
            phone: shippingInfo.phone,
            accountType: accountType // 🚀 บันทึก Type ของร้านค้า (B2B/Retail)
          },
          items: itemsSnapshot,
          summary: {
            subTotal: subTotal,
            shippingFee: shippingFee,
            promoDiscount: promoDiscount,
            walletUsed: b2bInfo.isRequesting ? 0 : walletUsed, // ไม่ตัด Wallet ถ้าขอราคาส่ง
            finalTotal: b2bInfo.isRequesting ? 0 : finalPayable // ราคาส่งให้รอหลังบ้านสรุป
          },
          shippingInfo: shippingInfo,
          taxInfo: taxInfo,
          b2bRequest: b2bInfo.isRequesting ? {
            note: b2bInfo.note,
            isResolved: false
          } : null,
          paymentInfo: {
            method: b2bInfo.isRequesting ? 'pending' : (slipUrl ? 'Transfer' : 'Wallet'),
            slipUrl: slipUrl || null,
            walletDeducted: b2bInfo.isRequesting ? 0 : walletUsed
          },
          promotionsApplied: appliedPromos,
          freebies: matchedFreebie ? [matchedFreebie] : [],
          status: 'draft', // 🚀 [แผนงานข้อ 4]: บังคับสถานะเริ่มต้นเป็น draft เสมอ
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        transaction.set(orderRef, orderData);

        // 5. เคลียร์ตะกร้าสินค้า
        const cartRef = doc(db, 'carts', user.uid);
        transaction.update(cartRef, {
          items: [],
          total: 0,
          totalQty: 0,
          updatedAt: serverTimestamp()
        });

        // 🚀 6. สร้าง To-do ส่งเข้าหลังบ้าน
        const todoRef = doc(collection(db, 'todos'));
        if (b2bInfo.isRequesting) {
          // กรณีขอราคาส่ง (B2B)
          transaction.set(todoRef, {
            title: `ขอราคาส่ง (B2B) - ${shippingInfo.fullName}`, 
            description: `ออเดอร์: ${orderId}\nลูกค้าประเภท: ${accountType}\nจำนวนสินค้า: ${cartData.totalQty} ชิ้น\nหมายเหตุ: ${b2bInfo.note || '-'}`,
            type: 'WHOLESALE_APPROVAL', 
            priority: 'High', 
            status: 'pending',
            payload: { 
              orderId: orderId, 
              customerUid: user.uid, 
              accountType: accountType, // ส่ง Type ให้ Pricing Engine
              itemsSnapshot: itemsSnapshot // ส่งรายการสินค้าไปเลย ประหยัด Read ที่หน้า To-do
            },
            createdAt: serverTimestamp(), 
            updatedAt: serverTimestamp()
          });
        } else {
          // กรณีชำระเงินทันที (Retail)
          transaction.set(todoRef, {
            title: `ตรวจสอบยอดโอน (Retail) - ${shippingInfo.fullName}`, 
            description: `ออเดอร์: ${orderId}\nยอดแจ้งโอน: ฿${finalPayable.toLocaleString()}`,
            type: 'PAYMENT_VERIFICATION', 
            priority: 'Medium', 
            status: 'pending',
            payload: { 
              orderId: orderId, 
              customerUid: user.uid, 
              amount: finalPayable, 
              slipUrl: slipUrl || '',
              itemsSnapshot: itemsSnapshot 
            },
            createdAt: serverTimestamp(), 
            updatedAt: serverTimestamp()
          });
        }

        // 7. บันทึก History Log
        const logRef = doc(collection(db, 'history_logs'));
        let logMsg = b2bInfo.isRequesting 
          ? `ส่งคำขอราคาส่ง B2B (รอพนักงานประเมินราคา) ออเดอร์ ${orderId}`
          : `สร้างคำสั่งซื้อใหม่ ออเดอร์ ${orderId} ยอดชำระ ฿${finalPayable.toLocaleString()}`;
        
        if (walletUsed > 0 && !b2bInfo.isRequesting) {
          logMsg += ` (ตัด Wallet: ฿${walletUsed.toLocaleString()})`;
        }

        transaction.set(logRef, {
          module: 'Order', 
          action: 'Create', 
          targetId: orderId, 
          details: logMsg,
          actionBy: user.uid, 
          actorName: shippingInfo.fullName, 
          timestamp: serverTimestamp()
        });
      });

      return orderId;
    } catch (error) {
      console.error("🔥 Error processing checkout:", error);
      throw error;
    }
  }
};