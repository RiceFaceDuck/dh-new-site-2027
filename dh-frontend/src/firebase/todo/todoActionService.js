import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';

/**
 * Single Responsibility: Handling the creation of Todo tasks.
 * Extracted from checkout to keep transaction logic clean.
 */

export const appendPaymentVerificationTodo = (transaction, orderId, user, checkoutState, totals, slipUrl) => {
    if (!slipUrl) return;
    
    const todoRef = doc(collection(db, "todos"));
    transaction.set(todoRef, {
        type: "verify_slip",
        status: "pending",
        title: `ตรวจสอบการชำระเงิน: ออเดอร์ #${orderId.slice(-6).toUpperCase()}`,
        orderId: orderId,
        userId: user.uid,
        customerName: checkoutState?.customerData?.fullName || "ลูกค้าทั่วไป",
        amount: totals?.netTotal || 0,
        slipUrl: slipUrl,
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp()
    });
};

export const appendTaxInvoiceTodo = (transaction, orderId, user, checkoutState) => {
    if (!checkoutState?.taxData) return;

    const taxTodoRef = doc(collection(db, "todos"));
    transaction.set(taxTodoRef, {
        type: "issue_tax_invoice",
        status: "pending",
        title: `ออกใบกำกับภาษี: ออเดอร์ #${orderId.slice(-6).toUpperCase()}`,
        orderId: orderId,
        userId: user.uid,
        customerName: checkoutState.taxData.name || checkoutState?.customerData?.fullName || "ลูกค้าทั่วไป",
        payload: {
            taxInvoice: checkoutState.taxData,
            orderId: orderId
        },
        requestedAt: serverTimestamp(),
        createdAt: serverTimestamp()
    });
};
