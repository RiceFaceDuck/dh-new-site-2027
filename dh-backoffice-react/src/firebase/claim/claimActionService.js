import { doc, updateDoc, serverTimestamp, increment, arrayUnion, runTransaction } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const TODOS_COLLECTION = 'todos';

export const claimActionService = {
  approveRequest: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;

    const updates = {
      status: 'waiting_item',
      handledBy: adminUid,
      updatedAt: serverTimestamp()
    };
    if (payload.trackingNo) {
        updates['payload.trackingNo'] = payload.trackingNo;
    }

    await updateDoc(doc(db, TODOS_COLLECTION, todoId), updates);

    gasHistoryService.log({
      level: 'INFO',
      module: 'Claim',
      action: 'Approve',
      target: { id: payload.claimId, type: 'Task' },
      details: {
        legacy_details: `อนุมัติคำขอเคลม ${payload.sku} (รอรับสินค้าเสียจากลูกค้า)`,
        payload: payload
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  },

  markArrived: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;
    const qty = Number(payload.qty || 1);
    
    await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
      status: 'processing',
      updatedAt: serverTimestamp()
    });

    // เพิ่มสต๊อกสินค้าเสีย (Defect Stock) ไว้ตรวจสอบทีหลัง
    await updateDoc(doc(db, getCollectionPath('products'), payload.sku), { 
        defectQuantity: increment(qty) 
    });

    gasHistoryService.log({
      level: 'INFO',
      module: 'Claim',
      action: 'ItemArrived',
      target: { id: payload.claimId, type: 'Task' },
      details: {
        legacy_details: `รับของเสียเข้าคลัง (${qty} ชิ้น) กำลังตรวจสอบเพื่อเบิกของใหม่ ${payload.sku}`,
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  },

  completeRequest: async (task, adminUid, adminName) => {
    const { payload, id: todoId } = task;
    const qty = Number(payload.qty || 1);
    const isSwapSku = payload.isSwapSku || false;

    const updateData = {
      status: 'completed',
      updatedAt: serverTimestamp()
    };
    if (payload.returnTrackingNo) {
        updateData['payload.returnTrackingNo'] = payload.returnTrackingNo;
    }
    
    let finalNewStock = 0;
    let productData = null;
    let newOrderId = null;

    // เตรียมตัวแปรสำหรับการเงิน
    const originalPrice = Number(payload.originalPricePerUnit || 0);
    const swapPrice = Number(payload.swapPricePerUnit || 0);
    const refundAmount = originalPrice * qty;
    const chargeAmount = swapPrice * qty;
    const netDifference = chargeAmount - refundAmount; // ส่วนต่างที่เกิดขึ้น

    await runTransaction(db, async (transaction) => {
      // 1. ดึงข้อมูลสต๊อกสินค้าที่จะเบิกเคลม (ถ้า Swap จะเบิก swapSku, ถ้าปกติเบิก skuเดิม)
      const targetSku = isSwapSku ? payload.swapSku : payload.sku;
      const pRef = doc(db, getCollectionPath('products'), targetSku);
      const pSnap = await transaction.get(pRef);
      if (!pSnap.exists()) {
        throw new Error(`ไม่พบสินค้า SKU: ${targetSku} ในระบบ`);
      }

      productData = pSnap.data();
      const currentStock = Number(productData.stockQuantity || 0);

      if (currentStock < qty) {
        throw new Error(`สินค้า ${productData.sku} สต็อกคงเหลือไม่เพียงพอสำหรับทำรายการเคลม (คงเหลือ ${currentStock} ชิ้น, ต้องการ ${qty} ชิ้น)`);
      }

      finalNewStock = currentStock - qty;

      // หักสต๊อกดีของเป้าหมาย
      transaction.update(pRef, { 
        stockQuantity: finalNewStock,
        'stats.sold': increment(qty)
      });

      // หักสต๊อกของเสีย (เคลียร์ยอด Defect ที่รับมาตอน Mark Arrived)
      if (isSwapSku) {
         const defectRef = doc(db, getCollectionPath('products'), payload.sku);
         transaction.update(defectRef, { defectQuantity: increment(-qty) });
      } else {
         transaction.update(pRef, { defectQuantity: increment(-qty) });
      }

      // 2. อัปเดตสถานะใบเคลม To-do
      transaction.update(doc(db, TODOS_COLLECTION, todoId), updateData);

      // 3. บันทึกข้อมูลและรหัสเคลมลงในประวัติของบิลเดิม
      if (payload.orderDocId) {
        const orderRef = doc(db, getCollectionPath('orders'), payload.orderDocId);
        transaction.update(orderRef, {
          refundsAndClaims: arrayUnion({
            type: isSwapSku ? 'ClaimSwap' : 'Claim',
            id: payload.claimId,
            sku: payload.sku,
            swapSku: isSwapSku ? payload.swapSku : null,
            qty: qty,
            amount: netDifference, // ส่วนต่างราคาสุทธิ
            approvedAt: new Date().toISOString()
          })
        });
      }

      // 4. บัญชีและการเงิน (คืนของเก่าเข้า Wallet + หักของใหม่จาก Wallet)
      const customerUid = payload.customerUid;
      if (customerUid && customerUid !== 'Walk-in' && customerUid !== 'WALK-IN') {
        const userRef = doc(db, getCollectionPath('users'), customerUid);
        const userSnap = await transaction.get(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentWallet = Number(userData.walletBalance || 0);

          if (netDifference > 0 && currentWallet < netDifference) {
            throw new Error(`ลูกค้ามียอดเงินใน Wallet ไม่เพียงพอสำหรับชำระส่วนต่าง (ยอดคงเหลือ ${currentWallet} บาท, ต้องการชำระเพิ่ม ${netDifference} บาท) กรุณาให้ลูกค้าเติมเงินก่อนทำรายการ`);
          }

          // คำนวณ Wallet ใหม่: คืนเงินค่าของเก่า และหักเงินค่าของใหม่
          // Wallet = Wallet + refundAmount - chargeAmount (ซึ่งก็คือ Wallet - netDifference)
          transaction.update(userRef, {
            walletBalance: increment(-netDifference),
            updatedAt: serverTimestamp()
          });

          // บันทึกธุรกรรม Wallet 2 รายการ
          // 4.1 คืนของเก่า (REFUND)
          const walletRefundRef = doc(collection(db, getCollectionPath('users'), customerUid, 'wallet_transactions'));
          transaction.set(walletRefundRef, {
            transactionId: `TXW_CLM_REF_${payload.claimId}`,
            type: 'REFUND',
            amount: refundAmount,
            status: 'SUCCESS',
            note: `คืนเงินสินค้าเดิมจากใบเคลมสลับรุ่น (${payload.claimId}) SKU: ${payload.sku}`,
            operatorUid: adminUid || 'System',
            timestamp: serverTimestamp()
          });

          // 4.2 หักของใหม่ (SPEND)
          const walletSpendRef = doc(collection(db, getCollectionPath('users'), customerUid, 'wallet_transactions'));
          transaction.set(walletSpendRef, {
            transactionId: `TXW_CLM_SPD_${payload.claimId}`,
            type: 'SPEND',
            amount: chargeAmount,
            status: 'SUCCESS',
            note: `ชำระค่าสินค้าตัวใหม่ที่เคลมเปลี่ยนรุ่น (${payload.claimId}) SKU: ${payload.swapSku}`,
            operatorUid: adminUid || 'System',
            timestamp: serverTimestamp()
          });
        }
      }

      // 5. สร้างใบเสร็จการขาย Order ใหม่รันเลขต่อเนื่อง (เฉพาะกรณี Swap SKU)
      if (isSwapSku) {
        const { getRandomShard } = await import('dh-shared/src/utils/counterUtils');
        const shardId = getRandomShard(5);
        const yearStr = new Date().getFullYear().toString();
        const counterRef = doc(db, 'counters', `receipt_sequence_${shardId}`);
        const counterSnap = await transaction.get(counterRef);

        const currentSeq = (counterSnap.exists() ? counterSnap.data()[yearStr] || 0 : 0) + 1;
        const paddedSeq = String(currentSeq).padStart(4, '0');
        newOrderId = `DH-${shardId}-${yearStr.slice(2)}-${paddedSeq}`;

        // อัปเดต Shard Counter
        transaction.set(counterRef, {
          [yearStr]: currentSeq,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // คำนวณวันหมดอายุประกันของตัวใหม่
        // default: ประกันคงเหลือเดิม หรือขยายวันเพิ่ม
        let newWarrantyExpiry = null;
        if (payload.newWarrantyDays !== null) {
          const expDate = new Date();
          expDate.setDate(expDate.getDate() + Number(payload.newWarrantyDays));
          newWarrantyExpiry = expDate.toISOString();
        }

        const newOrderRef = doc(db, getCollectionPath('orders'), newOrderId);
        
        // บันทึก Order ใหม่
        transaction.set(newOrderRef, {
          id: newOrderId,
          orderId: newOrderId,
          priceMode: payload.customerUid && payload.customerUid !== 'Walk-in' ? 'wholesale' : 'retail',
          customer: {
            uid: payload.customerUid || 'Walk-in',
            displayName: payload.customerName || 'ลูกค้าทั่วไป',
            name: payload.customerName || 'ลูกค้าทั่วไป'
          },
          items: [{
            sku: payload.swapSku,
            name: payload.swapProductName,
            qty: qty,
            price: swapPrice,
            priceAtPurchase: swapPrice,
            nameAtPurchase: payload.swapProductName,
            warrantyExpiryDate: newWarrantyExpiry
          }],
          totals: {
            netTotal: chargeAmount,
            finalTotal: chargeAmount
          },
          summary: {
            netTotal: chargeAmount,
            finalTotal: chargeAmount,
            walletUsed: chargeAmount
          },
          finalTotal: chargeAmount,
          netTotal: chargeAmount,
          walletUsedAmount: chargeAmount,
          orderStatus: 'paid',
          status: 'paid',
          paymentMethod: 'Wallet',
          isStockDeducted: true,
          note: `บิลสำหรับการเคลมเปลี่ยนรุ่นสินค้า (อ้างอิงบิลเดิม: ${payload.orderId}, ใบเคลม: ${payload.claimId})`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: adminUid,
          creatorName: adminName
        });
      }
    });

    // 6. ซิงก์สต๊อกไป GAS ด้วยสต๊อกคงเหลือจริงที่คำนวณสำเร็จ
    if (productData) {
      gasStockService.queueUpdate({
          ...productData,
          sku: isSwapSku ? payload.swapSku : payload.sku,
          stockQuantity: finalNewStock
      });
      await gasStockService.forceSync();
    }

    // 7. บันทึกประวัติ Log (Audit Trail)
    gasHistoryService.log({
      level: 'INFO',
      module: 'Claim',
      action: 'Completed',
      target: { id: payload.claimId, type: 'Task' },
      details: {
        legacy_details: isSwapSku 
          ? `เคลมเปลี่ยนรุ่นสินค้าสำเร็จ จาก ${payload.sku} ➔ ${payload.swapSku} จำนวน ${qty} ชิ้น (สร้างบิลเลขที่ ${newOrderId})`
          : `เคลมเปลี่ยนสินค้าสำเร็จ ${payload.sku} จำนวน ${qty} ชิ้น (เบิกสต๊อกของใหม่)`,
        newOrderId: newOrderId || null,
        isSwapSku,
        netDifference
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });

    // ✨ บันทึกประวัติย่อยระดับ SKU สำหรับการดึงสต๊อกใหม่ไปเคลม
    setTimeout(() => {
      // 7.1 บันทึกประวัติสินค้าใหม่ที่ถูกเบิก
      gasHistoryService.log({
        level: 'INFO',
        module: 'Claim',
        action: 'SKU_CLAIM_DISPATCH',
        target: { id: isSwapSku ? payload.swapSku : payload.sku, type: 'Product' },
        details: {
          type: 'เบิกเปลี่ยนรุ่น',
          qtyChange: -qty,
          reference: payload.claimId,
          legacy_details: isSwapSku
            ? `เบิกสินค้าตัวใหม่เคลมเปลี่ยนรุ่น (${payload.claimId}) สลับจากรุ่นเดิม ${payload.sku}`
            : `ตัดสต๊อกเพื่อเคลมเปลี่ยนสินค้า (${payload.claimId})`
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager' }
      });

      // 7.2 บันทึกประวัติสินค้าเก่าที่เป็นของเสีย (เฉพาะกรณี Swap SKU)
      if (isSwapSku) {
        gasHistoryService.log({
          level: 'INFO',
          module: 'Claim',
          action: 'SKU_CLAIM_RETURN',
          target: { id: payload.sku, type: 'Product' },
          details: {
            type: 'คืนของเสีย',
            qtyChange: qty,
            reference: payload.claimId,
            legacy_details: `รับของเสียเข้าคลังจากการเคลมเปลี่ยนรุ่น (${payload.claimId}) สลับไปรุ่นใหม่ ${payload.swapSku}`
          },
          actorOverride: { uid: adminUid, name: adminName || 'Manager' }
        });
      }
    }, 0);

    return true;
  },

  rejectRequest: async (task, reason, adminUid, adminName) => {
    await updateDoc(doc(db, TODOS_COLLECTION, task.id), {
      status: 'rejected',
      handledBy: adminUid,
      rejectReason: reason,
      updatedAt: serverTimestamp()
    });
    
    gasHistoryService.log({
      level: 'ERROR',
      module: 'Claim',
      action: 'Reject',
      target: { id: task.payload.claimId, type: 'Task' },
      details: {
        legacy_details: `ไม่อนุมัติคำขอ: ${reason}`,
        reason: reason,
        task_id: task.id
      },
      actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
    });
    return true;
  }
};
