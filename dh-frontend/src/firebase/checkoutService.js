import { db } from './config';
import { 
  collection, 
  addDoc, 
  doc, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * 🛒 1. การสั่งซื้อแบบปกติ (Retail Checkout)
 * ใช้ Transaction เพื่อความปลอดภัยสูงสุดในการบันทึก Order และ Task พร้อมกัน
 */
export const processCheckout = async (userId, orderData) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. สร้าง Reference สำหรับเอกสารใหม่ (เพื่อเอา ID มาใช้เชื่อมโยงกัน)
      const orderRef = doc(collection(db, 'orders'));
      const taskRef = doc(collection(db, 'tasks'));

      // 2. เตรียมข้อมูล Order
      const finalOrder = {
        ...orderData,
        orderId: orderRef.id,
        userId: userId,
        status: 'pending_payment', // รอชำระเงิน หรือรอตรวจสอบสลิป
        orderType: 'retail',
        updatedAt: serverTimestamp(),
      };

      // 3. เตรียมข้อมูล Task สำหรับ Todo หลังบ้าน
      const todoTask = {
        orderId: orderRef.id,
        userId: userId,
        type: 'new_order',
        title: `ออเดอร์ใหม่จากลูกค้า (${orderData.items.length} รายการ)`,
        customerName: orderData.taxInvoice?.name || 'ลูกค้าทั่วไป',
        totalAmount: orderData.totalAmount,
        status: 'todo', // สถานะเริ่มต้นใน Todo
        priority: 'normal',
        createdAt: serverTimestamp(),
      };

      // 4. ทำการเขียนข้อมูลพร้อมกัน (Atomic Write)
      transaction.set(orderRef, finalOrder);
      transaction.set(taskRef, todoTask);

      return orderRef.id;
    });

    return result;
  } catch (error) {
    console.error("Process Checkout Error: ", error);
    throw new Error("ไม่สามารถบันทึกข้อมูลการสั่งซื้อได้: " + error.message);
  }
};

/**
 * 📦 2. การขอราคาส่ง (Wholesale Request)
 * ส่งคำร้องเข้าไปในระบบเพื่อให้ผู้จัดการประเมินราคา
 */
export const createWholesaleRequest = async (userId, orderData) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const orderRef = doc(collection(db, 'orders'));
      const taskRef = doc(collection(db, 'tasks'));

      // โครงสร้าง Order สำหรับราคาส่ง (สถานะเริ่มต้นจะต่างออกไป)
      const wholesaleOrder = {
        ...orderData,
        orderId: orderRef.id,
        userId: userId,
        status: 'pending_wholesale_price', // รอผู้จัดการตั้งราคา
        orderType: 'wholesale',
        initialTotalAmount: orderData.totalAmount, // เก็บราคาปลีกเดิมไว้เทียบ
        finalTotalAmount: 0, // รอผู้จัดการกรอก
        updatedAt: serverTimestamp(),
      };

      // สร้าง Task ประเภทพิเศษเพื่อให้ผู้จัดการเห็นชัดเจน
      const wholesaleTask = {
        orderId: orderRef.id,
        userId: userId,
        type: 'wholesale_request',
        title: '📢 คำร้องขอราคาส่ง (รอประเมินราคา)',
        customerName: orderData.taxInvoice?.name || 'ลูกค้าขายส่ง',
        itemCount: orderData.items.length,
        status: 'todo',
        priority: 'high', // งานขอราคาส่งควรให้ความสำคัญสูง
        createdAt: serverTimestamp(),
      };

      transaction.set(orderRef, wholesaleOrder);
      transaction.set(taskRef, wholesaleTask);

      return orderRef.id;
    });

    return result;
  } catch (error) {
    console.error("Wholesale Request Error: ", error);
    throw new Error("ไม่สามารถส่งคำร้องขอราคาส่งได้: " + error.message);
  }
};

/**
 * 💳 3. ฟังก์ชันเสริมสำหรับการใช้ Wallet (ในอนาคต)
 * เตรียมไว้สำหรับกรณีลูกค้ากดยืนยันชำระเงินผ่านยอดค้างในระบบ
 */
export const payWithWallet = async (userId, amount, orderId) => {
  const userRef = doc(db, 'users', userId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) throw "ไม่พบข้อมูลผู้ใช้";

      const currentWallet = userSnap.data().wallet || 0;
      if (currentWallet < amount) throw "ยอดเงินใน Wallet ไม่เพียงพอ";

      // หักเงิน และบันทึกประวัติ
      transaction.update(userRef, { 
        wallet: currentWallet - amount,
        updatedAt: serverTimestamp()
      });
      
      // อัปเดตสถานะ Order
      const orderRef = doc(db, 'orders', orderId);
      transaction.update(orderRef, { 
        status: 'paid',
        paymentMethod: 'wallet',
        paidAt: serverTimestamp() 
      });
    });
    return true;
  } catch (error) {
    console.error("Wallet Payment Error: ", error);
    throw error;
  }
};