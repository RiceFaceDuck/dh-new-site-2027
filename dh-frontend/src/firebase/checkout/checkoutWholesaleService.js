import { db } from '../config';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';

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

  const orderData = {
    orderId: orderRef.id,
    userId: user.uid,
    items: cartItems,
    status: "awaiting_wholesale_price", 
    shippingAddress: checkoutState?.customerData || null,
    taxInvoice: checkoutState?.taxData || null,
    totals: totals,
    wholesaleNote: wholesaleNote, 
    calculationLog: {
      promotions: appliedPromos, 
      freebies: checkoutState?.qualifiedFreebies || [],
      discountCode: checkoutState?.discountCode || null,
      discountAmount: checkoutState?.discountAmount || 0,
      usedWallet: checkoutState?.useWallet || 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  batch.set(orderRef, orderData);

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

  const historyData = {
    orderId: orderRef.id,
    action: 'REQUEST_WHOLESALE',
    title: 'ส่งคำขอพิจารณาราคาส่ง',
    description: `ระบบกำลังส่งคำขอราคาส่งไปยังเจ้าหน้าที่ (ออเดอร์ #${orderRef.id.slice(-6).toUpperCase()})`,
    amount: totals?.netTotal || 0,
    createdAt: serverTimestamp(),
  };
  batch.set(historyRef, historyData);

  await batch.commit();

  return { 
    success: true, 
    orderId: orderRef.id, 
    message: "ส่งคำขอราคาส่งเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ติดต่อกลับ" 
  };
};
