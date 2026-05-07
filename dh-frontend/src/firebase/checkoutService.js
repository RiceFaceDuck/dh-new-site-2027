import { db } from './config';
import { doc, collection, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';

/**
 * ⚡️ Smart Checkout Service
 * บริการจัดการคำสั่งซื้อแบบรัดกุม ใช้ระบบ Double-entry Transaction
 * ป้องกันยอดเงิน/แต้ม ติดลบ และประหยัด Firestore Writes ขั้นสุด
 */

// 1. ฟังก์ชันส่งยืนยันคำสั่งซื้อหลัก (Export แยกชื่อ เพื่อรองรับ Checkout.jsx เดิม)
export const submitOrder = async (user, cartItems, checkoutState, totals, slipUrl = null, saveProfile = false) => {
  if (!user || !user.uid) throw new Error("กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ");
  if (!cartItems || cartItems.length === 0) throw new Error("ตะกร้าสินค้าว่างเปล่า กรุณาเลือกสินค้าก่อน");

  const orderRef = doc(collection(db, "orders")); // สร้าง Reference ล่วงหน้า
  const userRef = doc(db, "users", user.uid);
  const counterRef = doc(db, "system_counters", "orders");

  // 🔥 การใช้ runTransaction: ล็อกการทำงานทั้งหมดเป็นเนื้อเดียว (Atomic)
  return await runTransaction(db, async (transaction) => {
    
    // 1. [READ] ดึงข้อมูลผู้ใช้เพื่อเช็คยอดคงเหลือ และดึงเลขรันบิลล่าสุด
    const userDoc = await transaction.get(userRef);
    const counterDoc = await transaction.get(counterRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    // ตรวจสอบแต้ม/Wallet (ถ้ามีการใช้) ว่ามีพอหรือไม่ ป้องกันการแฮกแก้ไขตัวเลขจากหน้าบ้าน
    const usePoints = checkoutState?.usePoints || 0;
    const useWallet = checkoutState?.useWallet || 0;
    
    if (usePoints > 0 && (userData.points || 0) < usePoints) {
      throw new Error("แต้มสะสมของคุณไม่เพียงพอ");
    }
    if (useWallet > 0 && (userData.walletBalance || 0) < useWallet) {
      throw new Error("ยอดเงินใน Wallet ของคุณไม่เพียงพอ");
    }

    // จัดการข้อมูลโปรโมชั่นที่ถูกใช้ (เพิ่มสัญลักษณ์ ✅ ให้เห็นชัดเจนว่าผ่านการคิดโปรโมชั่นมาแล้ว)
    const appliedPromos = checkoutState?.appliedPromotions?.map(p => `✅ ${p.name || 'โปรโมชั่น'}`) || [];

    // 2. เตรียมข้อมูล Order Data
    const orderData = {
      orderId: orderRef.id,
      userId: user.uid,
      items: cartItems,
      shippingAddress: checkoutState?.customerData || null,
      taxInvoice: checkoutState?.taxData || null,
      paymentMethod: checkoutState?.paymentMethod || "transfer",
      paymentSlipUrl: slipUrl,
      status: slipUrl ? "pending_payment_verification" : "pending_payment", // รอตรวจสอบสลิป
      totals: totals,
      calculationLog: {
        promotions: appliedPromos, // ✅ อัปเดต: เก็บรายการโปรโมชั่นที่ใช้งาน
        freebies: checkoutState?.qualifiedFreebies || [],
        discountCode: checkoutState?.discountCode || null,
        discountAmount: checkoutState?.discountAmount || 0,
        usedPoints: usePoints,
        usedWallet: useWallet,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // [WRITE] บันทึก Order
    transaction.set(orderRef, orderData);

    // 3. [WRITE] ตัดแต้ม / ตัด Wallet ผู้ใช้งาน
    if (usePoints > 0 || useWallet > 0 || saveProfile) {
      const userUpdateData = {};
      if (usePoints > 0) userUpdateData.points = (userData.points || 0) - usePoints;
      if (useWallet > 0) userUpdateData.walletBalance = (userData.walletBalance || 0) - useWallet;
      
      // Auto-save Profile 
      if (saveProfile && checkoutState?.customerData) {
        userUpdateData.shippingAddress = checkoutState.customerData;
      }
      
      transaction.update(userRef, userUpdateData);
    }

    // 4. [WRITE] แจ้งเตือนไปหลังบ้าน (Todo) หากมีการแนบสลิปมาแล้ว
    if (slipUrl) {
      const todoRef = doc(collection(db, "todos"));
      transaction.set(todoRef, {
        type: "verify_slip",
        status: "pending",
        title: `ตรวจสอบการชำระเงิน: ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()}`,
        orderId: orderRef.id,
        userId: user.uid,
        customerName: checkoutState?.customerData?.fullName || "ลูกค้าทั่วไป",
        amount: totals?.netTotal || 0,
        slipUrl: slipUrl,
        requestedAt: serverTimestamp()
      });
    }

    // 4.5 🌟 [WRITE] แจ้งเตือนไปหลังบ้าน (Todo) กรณีลูกค้าขอใบกำกับภาษี
    if (checkoutState?.taxData) {
      const taxTodoRef = doc(collection(db, "todos"));
      transaction.set(taxTodoRef, {
        type: "issue_tax_invoice",
        status: "pending",
        title: `ออกใบกำกับภาษี: ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()}`,
        orderId: orderRef.id,
        userId: user.uid,
        customerName: checkoutState.taxData.name || checkoutState?.customerData?.fullName || "ลูกค้าทั่วไป",
        payload: {
          taxInvoice: checkoutState.taxData,
          orderId: orderRef.id
        },
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }

    // 5. [WRITE] บันทึก History Log สำหรับลูกค้า
    const historyRef = doc(collection(db, `users/${user.uid}/historyLogs`));
    transaction.set(historyRef, {
      orderId: orderRef.id,
      action: "PLACE_ORDER",
      title: "สั่งซื้อสินค้าสำเร็จ",
      description: slipUrl ? `ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()} รอตรวจสอบการชำระเงิน` : `ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()} รอการชำระเงิน`,
      amount: totals?.netTotal || 0,
      createdAt: serverTimestamp()
    });

    return { success: true, orderId: orderRef.id, message: "สร้างคำสั่งซื้อสำเร็จ" };
  });
};


/**
 * ฟังก์ชันสำหรับแยกกระแส ขอราคาส่งโดยเฉพาะ (ใช้ Batch Write เนื่องจากไม่มีการตัดแต้ม)
 */
export const createWholesaleRequest = async (user, cartItems, checkoutState, totals) => {
  if (!user || !user.uid) throw new Error("กรุณาเข้าสู่ระบบก่อนดำเนินการ");
  if (!cartItems || cartItems.length === 0) throw new Error("ตะกร้าสินค้าว่างเปล่า");

  const batch = writeBatch(db);
  const orderRef = doc(collection(db, "orders"));
  const todoRef = doc(collection(db, "todos"));
  const historyRef = doc(collection(db, `users/${user.uid}/historyLogs`));

  const customerName = checkoutState?.customerData?.fullName || "ลูกค้าทั่วไป";
  
  const wholesaleNote = `บริษัท/ร้าน: ${checkoutState?.customerData?.company || 'ไม่ได้ระบุ'} | เหตุผล: ${checkoutState?.wholesaleReason || 'สั่งซื้อจำนวนมาก'}`;
  
  const appliedPromos = checkoutState?.appliedPromotions?.map(p => `✅ ${p.name || 'โปรโมชั่น'}`) || [];

  // 1. สร้าง Draft Order
  const orderData = {
    orderId: orderRef.id,
    userId: user.uid,
    items: cartItems,
    status: "awaiting_wholesale_price", // สถานะรอราคาส่ง
    shippingAddress: checkoutState?.customerData || null,
    taxInvoice: checkoutState?.taxData || null, // 📝 บันทึกข้อมูลใบกำกับภาษีลง Order
    totals: totals, // ยอดคำนวณราคาปลีก (เพื่อเปรียบเทียบ)
    wholesaleNote: wholesaleNote, 
    calculationLog: {
      promotions: appliedPromos, 
      freebies: checkoutState?.qualifiedFreebies || [],
      discountCode: checkoutState?.discountCode || null,
      discountAmount: checkoutState?.discountAmount || 0,
      usedPoints: checkoutState?.usePoints || 0,
      usedWallet: checkoutState?.useWallet || 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  batch.set(orderRef, orderData);

  // 2. สร้าง To-do ขอราคาส่ง ให้ผู้จัดการพิจารณา
  const taskData = {
    type: "wholesale_request",
    status: "pending", 
    title: "ขอราคาส่ง (B2B) จากลูกค้าหน้าเว็บ",
    orderId: orderRef.id,
    userId: user.uid,
    customerName: customerName,
    totalAmount: totals?.subtotal || cartItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0),
    requestedAt: serverTimestamp(),
    payload: {
      items: cartItems,
      itemsSnapshot: cartItems,
      shippingFee: checkoutState?.shippingCost || 0,
      promoDiscount: checkoutState?.discountAmount || 0,
      freebies: checkoutState?.qualifiedFreebies?.map(f => f.itemName).join(', ') || '',
      reason: checkoutState?.wholesaleReason || 'ไม่ได้ระบุเหตุผล',
      checkoutSnapshot: checkoutState || {}, 
      originalTotals: totals 
    },
    createdAt: serverTimestamp(),
    createdBy: user.uid
  };

  batch.set(todoRef, taskData);

  // 2.5 🌟 สร้าง To-do ออกใบกำกับภาษี (ถ้ามีการขอไว้)
  if (checkoutState?.taxData) {
    const taxTodoRef = doc(collection(db, "todos"));
    batch.set(taxTodoRef, {
      type: "issue_tax_invoice",
      status: "pending",
      title: `ออกใบกำกับภาษี (ออเดอร์ราคาส่ง): #${orderRef.id.slice(-6).toUpperCase()}`,
      orderId: orderRef.id,
      userId: user.uid,
      customerName: checkoutState.taxData.name || checkoutState?.customerData?.fullName || "ลูกค้าทั่วไป",
      payload: {
        taxInvoice: checkoutState.taxData,
        orderId: orderRef.id
      },
      requestedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }

  // 3. บันทึก History Log ลง Sub-collection ของ User
  const historyData = {
    orderId: orderRef.id,
    action: 'REQUEST_WHOLESALE',
    title: 'ส่งคำขอพิจารณาราคาส่ง',
    description: `ระบบกำลังส่งคำขอราคาส่งไปยังเจ้าหน้าที่ (ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()})`,
    amount: totals?.netTotal || 0,
    createdAt: serverTimestamp(),
  };
  batch.set(historyRef, historyData);

  // สั่งบันทึกรวดเดียว (Batch Commit)
  await batch.commit();

  return { 
    success: true, 
    orderId: orderRef.id, 
    message: "ส่งคำขอราคาส่งเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ติดต่อกลับ" 
  };
};