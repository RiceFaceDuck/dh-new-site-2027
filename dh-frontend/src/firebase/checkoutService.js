import { db } from './config';
import { doc, collection, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';

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

  // 🔥 การใช้ runTransaction: ล็อกการทำงานทั้งหมดเป็นเนื้อเดียว (Atomic)
  return await runTransaction(db, async (transaction) => {
    
    // 1. [READ] ดึงข้อมูลผู้ใช้เพื่อเช็คยอดคงเหลือ
    const userDoc = await transaction.get(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};

    // 🛑 Data Validation: ตรวจสอบไม่ให้ตัดแต้มเกินยอดที่มีจริง (Safe Check ป้องกันค่าว่าง)
    const currentPoints = userData.creditPoints || 0;
    const currentWallet = userData.walletBalance || 0;
    const usePoints = checkoutState?.usePoints || 0;
    const useWallet = checkoutState?.useWallet || 0;

    if (usePoints > currentPoints) throw new Error("Credit Point ของคุณไม่เพียงพอ");
    if (useWallet > currentWallet) throw new Error("ยอดเงิน Wallet ของคุณไม่เพียงพอ");

    // 2. โครงสร้างอัจฉริยะ: แยกสายงานตามแผน (Retail vs Wholesale)
    const isWholesale = checkoutState?.isWholesaleRequest || false;
    const orderType = isWholesale ? "wholesale" : "retail";
    
    const status = isWholesale 
      ? "pending_wholesale" 
      : (slipUrl ? "pending_verification" : "pending_payment");

    // 📦 ประกอบ Data Model สำหรับ Order
    const orderData = {
      orderId: orderRef.id,
      userId: user.uid,
      customerName: user.displayName || user.email || 'Customer',
      orderType: orderType,
      status: status,
      
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity,
        sku: item.sku || ''
      })),
      
      totals: totals || {
        // Fallback เผื่อเวอร์ชันเก่าไม่ได้ส่ง totals มา
        count: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      },
      
      shippingDetails: {
        method: checkoutState?.shippingMethod || "standard",
        cost: checkoutState?.shippingCost || 0,
      },
      
      taxDetails: checkoutState?.requestTax ? checkoutState.taxInfo : null,
      
      calculationLog: {
        promotions: checkoutState?.appliedPromotions || [],
        discountCode: checkoutState?.discountCode || null,
        discountAmount: checkoutState?.discountAmount || 0,
        usedPoints: usePoints,
        usedWallet: useWallet,
      },
      
      notes: {
        general: checkoutState?.note || "",
        wholesale: checkoutState?.wholesaleNote || ""
      },
      
      paymentProof: slipUrl ? { url: slipUrl, verified: false, uploadedAt: serverTimestamp() } : null,
      
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // 3. [WRITE] สร้างเอกสารคำสั่งซื้อ
    transaction.set(orderRef, orderData);

    // 4. [WRITE] Double-entry Bookkeeping
    let profileUpdates = {};
    
    if (usePoints > 0) {
      profileUpdates.creditPoints = currentPoints - usePoints;
      const pointTxRef = doc(collection(db, "transactions"));
      transaction.set(pointTxRef, {
        userId: user.uid,
        orderId: orderRef.id,
        type: "deduct",
        currency: "point",
        amount: usePoints,
        note: `แลก Credit Point เป็นส่วนลดสำหรับคำสั่งซื้อ #${orderRef.id}`,
        createdAt: serverTimestamp()
      });
    }
    
    if (useWallet > 0) {
      profileUpdates.walletBalance = currentWallet - useWallet;
      const walletTxRef = doc(collection(db, "transactions"));
      transaction.set(walletTxRef, {
        userId: user.uid,
        orderId: orderRef.id,
        type: "deduct",
        currency: "wallet",
        amount: useWallet,
        note: `ชำระเงิน (ตัด Wallet) สำหรับคำสั่งซื้อ #${orderRef.id}`,
        createdAt: serverTimestamp()
      });
    }

    // 5. [WRITE] Lazy Profile Update
    if (saveProfile) {
      if (checkoutState?.taxInfo) profileUpdates.taxInfo = checkoutState.taxInfo;
      if (checkoutState?.note) profileUpdates.defaultDeliveryNote = checkoutState.note; 
    }

    if (Object.keys(profileUpdates).length > 0) {
      transaction.update(userRef, profileUpdates);
    }

    return orderRef.id;
  });
};

// 2. ⚡️เพิ่มฟังก์ชันนี้กลับมา (Backward Compatibility) เพื่อไม่ให้หน้าเว็บเดิม Crash
// ฟังก์ชันสำหรับขอราคาส่งแบบเดิม แปลงให้ใช้งานร่วมกับระบบใหม่ได้ทันที
export const createWholesaleRequest = async (user, cartItems, customerData, totals = null) => {
  if (!user || !user.uid) throw new Error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
  if (!cartItems || cartItems.length === 0) throw new Error("ตะกร้าสินค้าว่างเปล่า");

  const orderRef = doc(collection(db, "orders"));
  const taskRef = doc(collection(db, "tasks"));

  const customerName = user.displayName || customerData?.name || 'Customer';

  return await runTransaction(db, async (transaction) => {
    const orderData = {
      orderId: orderRef.id,
      userId: user.uid,
      customerName: customerName,
      orderType: "wholesale",
      status: "pending_wholesale", // เด้งไป To-do แอดมินทันที
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        quantity: item.quantity,
        sku: item.sku || ''
      })),
      totals: totals || {
        count: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: cartItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0)
      },
      notes: {
        general: customerData?.note || "",
        wholesale: customerData?.wholesaleNote || ""
      },
      companyInfo: customerData?.company || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    transaction.set(orderRef, orderData);

    const taskData = {
      type: "wholesale_request",
      status: "todo",
      title: "ขอราคาส่ง (B2B) จากลูกค้าหน้าเว็บ",
      orderId: orderRef.id,
      customerName: customerName,
      totalAmount: totals?.subtotal || cartItems.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0),
      createdAt: serverTimestamp(),
      createdBy: user.uid
    };

    transaction.set(taskRef, taskData);

    return orderRef.id;
  });
};

// เผื่อไฟล์อื่นดึงรูปแบบ Object 
export const checkoutService = {
  submitOrder,
  createWholesaleRequest
};

export default checkoutService;