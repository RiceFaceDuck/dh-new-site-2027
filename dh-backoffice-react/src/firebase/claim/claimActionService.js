import { doc, updateDoc, serverTimestamp, increment, arrayUnion, runTransaction } from 'firebase/firestore';
import { db } from '../config';
import { gasHistoryService } from '../gasHistoryService';
import { gasStockService } from '../gasStockService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const CLAIMS_COLLECTION = getCollectionPath('claims');

export const claimActionService = {
  approveRequest: async (task, adminUid, adminName) => {
    try {
      const { payload, id: todoId } = task;

      const updates = {
        status: 'waiting_item',
        handledBy: adminUid,
        updatedAt: serverTimestamp()
      };
      if (payload.trackingNo) {
          updates['payload.trackingNo'] = payload.trackingNo;
      }
      if (payload.differencePayment) {
          updates['payload.differencePayment'] = payload.differencePayment;
      }
      if (payload.isDifferencePaid !== undefined) {
          updates['payload.isDifferencePaid'] = payload.isDifferencePaid;
      }
      if (payload.differenceSlipUrl) {
          updates['payload.differenceSlipUrl'] = payload.differenceSlipUrl;
      }
      if (payload.differenceWalletAmount !== undefined) {
          updates['payload.differenceWalletAmount'] = payload.differenceWalletAmount;
      }
      if (payload.differenceDirectAmount !== undefined) {
          updates['payload.differenceDirectAmount'] = payload.differenceDirectAmount;
      }
      if (payload.differencePaidAt) {
          updates['payload.differencePaidAt'] = payload.differencePaidAt;
      }

      await updateDoc(doc(db, CLAIMS_COLLECTION, todoId), updates);

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
    } catch (error) {
      console.error("🔥 Error in approveRequest:", error);
      throw error;
    }
  },

  markArrived: async (task, adminUid, adminName) => {
    try {
      const { payload, id: todoId } = task;
      const qty = Number(payload.qty || 1);
      
      await runTransaction(db, async (transaction) => {
        const todoRef = doc(db, CLAIMS_COLLECTION, todoId);
        const todoSnap = await transaction.get(todoRef);
        
        if (!todoSnap.exists()) throw new Error("ไม่พบรายการคำขอ (Todo not found)");
        if (todoSnap.data().status === 'processing') throw new Error("รายการนี้กำลังถูกดำเนินการไปแล้ว (Task is already processing)");

        transaction.update(todoRef, {
          status: 'processing',
          updatedAt: serverTimestamp()
        });
        
        // เพิ่มสต๊อกสินค้าเสีย (Defect Stock) ไว้ตรวจสอบทีหลัง
        transaction.update(doc(db, getCollectionPath('products'), payload.sku), { 
            defectQuantity: increment(qty) 
        });
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
    } catch (error) {
      console.error("🔥 Error in markArrived:", error);
      throw error;
    }
  },

  completeRequest: async (task, adminUid, adminName) => {
    try {
      const { payload, id: todoId } = task;
      const qty = Number(payload.qty || 1);
      const isSwapSku = payload.isSwapSku || task.type === 'EXCHANGE_APPROVAL' || !!payload.swapSku;

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
      // ✅ [SECURITY FIX] ตรวจสอบว่าเป็นสลับรุ่นหรือไม่ ถ้าไม่ใช่ให้ตั้งค่าทุกอย่างเป็น 0 ป้องกันการคืนเงินฟรีๆ
      const originalPrice = isSwapSku ? Number(payload.originalPricePerUnit || 0) : 0;
      const swapPrice = isSwapSku ? Number(payload.swapPricePerUnit || 0) : 0;
      const refundAmount = originalPrice * qty;
      const chargeAmount = swapPrice * qty;
      const netDifference = chargeAmount - refundAmount; // ส่วนต่างที่เกิดขึ้น

      await runTransaction(db, async (transaction) => {
        // --- 1. READ OPERATIONS (Must be done before writes) ---
        // 0. ดึงและตรวจสอบสถานะ To-do ก่อนเพื่อป้องกันการรันรายการซ้ำซ้อน (Idempotency check)
        const taskRef = doc(db, CLAIMS_COLLECTION, todoId);
        const taskSnap = await transaction.get(taskRef);
        if (taskSnap.exists()) {
          const taskData = taskSnap.data();
          if (taskData.status === 'completed') {
            throw new Error("ใบเคลมนี้ถูกอนุมัติเสร็จสิ้นไปแล้ว (Duplicate Request Prevention)");
          }
        }

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

        // ดึงข้อมูลสินค้าเดิม (Original SKU) สำหรับจัดการสภาพสินค้าที่ส่งคืน
        const origSku = payload.sku;
        const isSameSku = targetSku === origSku;
        const origRef = isSameSku ? pRef : doc(db, getCollectionPath('products'), origSku);
        const origSnap = isSameSku ? pSnap : await transaction.get(origRef);
        const origData = origSnap?.exists() ? origSnap.data() : productData;

        const itemCondition = payload.itemCondition || 'defective';
        const isGoodCondition = itemCondition === 'good';
        const wasItemArrived = taskSnap.data()?.status === 'processing';

        // 2. ดึงข้อมูลกระเป๋าเงินลูกค้า (User Wallet)
        const customerUid = payload.customerUid;
        const hasValidCustomer = customerUid && customerUid !== 'Walk-in' && customerUid !== 'WALK-IN';
        let userRef = null;
        let userSnap = null;
        if (hasValidCustomer) {
          userRef = doc(db, getCollectionPath('users'), customerUid);
          userSnap = await transaction.get(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentWallet = Number(userData.walletBalance || 0);
            if (netDifference > 0 && currentWallet < netDifference) {
              throw new Error(`ลูกค้ามียอดเงินใน Wallet ไม่เพียงพอสำหรับชำระส่วนต่าง (ยอดคงเหลือ ${currentWallet} บาท, ต้องการชำระเพิ่ม ${netDifference} บาท) กรุณาให้ลูกค้าเติมเงินก่อนทำรายการ`);
            }
          }
        }

        // 3. ดึง Counter สำหรับเลข Order ใหม่ (ถ้า Swap SKU)
        let counterRef = null;
        let counterSnap = null;
        const yearStr = new Date().getFullYear().toString();
        if (isSwapSku) {
          counterRef = doc(db, getCollectionPath('counters'), `receipt_sequence_global`);
          counterSnap = await transaction.get(counterRef);
        }

        // --- 2. WRITE OPERATIONS ---
        // 1. จัดการสต็อกสินค้า (Stock Movements)
        const origStock = Number(origData.stockQuantity || 0);
        const origDefect = Number(origData.defectQuantity || 0);

        if (isSameSku) {
          // เคลมรุ่นเดิม: เบิกของใหม่ (-qty)
          let finalTargetStock = finalNewStock;
          let finalTargetDefect = origDefect;

          if (isGoodCondition) {
            // ของเดิมสภาพดี นำกลับมาขายต่อได้ (+qty) ทำให้สต็อกขายสุทธิเท่าเดิม
            finalTargetStock = currentStock;
            if (wasItemArrived) {
              finalTargetDefect = Math.max(0, origDefect - qty);
            }
          } else {
            // ของเดิมชำรุด
            if (!wasItemArrived) {
              finalTargetDefect = origDefect + qty;
            }
          }

          transaction.update(pRef, {
            stockQuantity: finalTargetStock,
            defectQuantity: finalTargetDefect,
            'stats.sold': increment(qty)
          });
          finalNewStock = finalTargetStock;
        } else {
          // สลับรุ่น: ตัดสต็อกตัวใหม่ (targetSku)
          transaction.update(pRef, { 
            stockQuantity: finalNewStock,
            'stats.sold': increment(qty)
          });

          // ปรับสต็อกตัวเดิม (origSku)
          let finalOrigStock = origStock;
          let finalOrigDefect = origDefect;

          if (isGoodCondition) {
            finalOrigStock = origStock + qty;
            if (wasItemArrived) {
              finalOrigDefect = Math.max(0, origDefect - qty);
            }
          } else {
            if (!wasItemArrived) {
              finalOrigDefect = origDefect + qty;
            }
          }

          transaction.update(origRef, {
            stockQuantity: finalOrigStock,
            defectQuantity: finalOrigDefect
          });
        }

        // 2. บันทึกข้อมูลและรหัสเคลมลงในประวัติของบิลเดิม
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

        // 3. บัญชีและการเงิน (คืนของเก่าเข้า Wallet + หักของใหม่จาก Wallet)
        if (hasValidCustomer && userRef && userSnap?.exists()) {
          transaction.update(userRef, {
            walletBalance: increment(-netDifference),
            updatedAt: serverTimestamp()
          });

          // บันทึกธุรกรรม Wallet 2 รายการ
          // 3.1 คืนของเก่า (REFUND)
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

          // 3.2 หักของใหม่ (SPEND)
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

        // 4. สร้างใบเสร็จการขาย Order ใหม่รันเลขต่อเนื่อง (เฉพาะกรณี Swap SKU)
        if (isSwapSku && counterRef) {
          const currentSeq = (counterSnap?.exists() ? counterSnap.data()[yearStr] || 0 : 0) + 1;
          const paddedSeq = String(currentSeq).padStart(4, '0');
          newOrderId = `DH-${yearStr.slice(2)}-${paddedSeq}`;

          // อัปเดต Global Counter
          transaction.set(counterRef, {
            [yearStr]: currentSeq,
            updatedAt: serverTimestamp()
          }, { merge: true });

          // คำนวณวันหมดอายุประกันของตัวใหม่
          let newWarrantyExpiry = null;
          if (payload.newWarrantyDays !== null) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + Number(payload.newWarrantyDays));
            newWarrantyExpiry = expDate.toISOString();
          }

          const newOrderRef = doc(db, getCollectionPath('orders'), newOrderId);
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

        const actionTag = isSwapSku 
          ? (isGoodCondition ? 'EXCHANGE_RESTOCK_GOOD' : 'EXCHANGE_DEFECT') 
          : (isGoodCondition ? 'CLAIM_RESTOCK_GOOD' : 'CLAIM_DEFECT');

        // 5. อัปเดตสถานะใบเคลม (พร้อมผูก newOrderId ถ้ามี)
        const finalClaimUpdate = {
          ...updateData,
          handledBy: adminUid || 'SYSTEM',
          handledByName: adminName || 'Manager',
          completedAt: serverTimestamp(),
          completedAtIso: new Date().toISOString(),
          'payload.itemCondition': itemCondition,
          'tags.action': actionTag,
          ...(newOrderId ? { 'payload.newOrderId': newOrderId } : {})
        };
        transaction.update(taskRef, finalClaimUpdate);
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
    } catch (error) {
      console.error("🔥 Error in completeRequest:", error);
      throw error;
    }
  },

  rejectRequest: async (task, reason, adminUid, adminName) => {
    try {
      await runTransaction(db, async (transaction) => {
        const todoRef = doc(db, CLAIMS_COLLECTION, task.id);
        const todoSnap = await transaction.get(todoRef);
        
        if (!todoSnap.exists()) throw new Error("ไม่พบรายการคำขอ (Todo not found)");
        
        const currentData = todoSnap.data();
        if (currentData.status === 'rejected') throw new Error("รายการนี้ถูกปฏิเสธไปแล้ว");

        // 🌟 ถ้ารายการนี้เคยผ่านขั้นตอนรับของเข้า (processing) ไปแล้ว ต้องลบ defectQuantity คืน
        if (currentData.status === 'processing' && currentData.payload?.sku) {
          const qty = Number(currentData.payload.qty || 1);
          const pRef = doc(db, getCollectionPath('products'), currentData.payload.sku);
          const pSnap = await transaction.get(pRef);
          
          if (pSnap.exists()) {
             // คืนค่า defectQuantity (หักออก เพราะไม่อนุมัติให้เคลม)
             transaction.update(pRef, { 
                 defectQuantity: increment(-qty) 
             });
          }
        }

        transaction.update(todoRef, {
          status: 'rejected',
          handledBy: adminUid,
          rejectReason: reason,
          updatedAt: serverTimestamp()
        });
      });
      
      gasHistoryService.log({
        level: 'ERROR',
        module: 'Claim',
        action: 'Reject',
        target: { id: task.payload.claimId, type: 'Task' },
        details: {
          legacy_details: `ไม่อนุมัติคำขอ: ${reason} (คืนสต๊อกของเสียเรียบร้อยถ้ามี)`,
          reason: reason,
          task_id: task.id
        },
        actorOverride: { uid: adminUid, name: adminName || 'Manager', email: 'N/A' }
      });

      // 🌟 บันทึกประวัติย่อยกรณีมีการดึงของเสียคืน
      if (task.status === 'processing') {
         setTimeout(() => {
           gasHistoryService.log({
             level: 'INFO',
             module: 'Claim',
             action: 'SKU_DEFECT_REVERT',
             target: { id: task.payload.sku, type: 'Product' },
             details: {
               type: 'ยกเลิกของเสีย',
               qtyChange: -(Number(task.payload.qty) || 1),
               reference: task.payload.claimId,
               legacy_details: `ไม่อนุมัติการเคลม ดึงยอดของเสียกลับคืน (${task.payload.claimId})`
             },
             actorOverride: { uid: adminUid, name: adminName || 'Manager' }
           });
         }, 0);
      }

      return true;
    } catch (error) {
      console.error("🔥 Error in rejectRequest:", error);
      throw error;
    }
  }
};
