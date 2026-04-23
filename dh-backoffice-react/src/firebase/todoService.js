import { 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp, 
  addDoc, 
  query, 
  where, 
  limit, 
  runTransaction, 
  getDocs, 
  orderBy, 
  arrayUnion
} from 'firebase/firestore';
import { db } from './config';
import { historyService } from './historyService';
import { billingService } from './billingService';

const COLLECTION_NAME = 'todos';

export const todoService = {
  subscribePendingTodos: (callback) => {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("status", "==", "pending"), 
      limit(50)
    );
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        const priorityOrder = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
        const pA = priorityOrder[a.priority] || 0;
        const pB = priorityOrder[b.priority] || 0;
        if (pA !== pB) return pB - pA;
        return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      });
      callback(data);
    }, (error) => {
      console.error("🔥 TodoService Error:", error);
      callback([]);
    });
  },

  subscribeManagerApprovals: (callback) => {
    return () => {}; 
  },

  getCompletedTodos: async (maxLimit = 30) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("status", "in", ["completed", "rejected"]),
        orderBy("updatedAt", "desc"),
        limit(maxLimit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("🔥 Get Completed Todos Error:", error);
      return [];
    }
  },

  createManualTodo: async (taskData, user) => {
    try {
      const userName = user.nickname || user.firstName || user.email || "System";
      const newTodo = {
        type: 'MANUAL_TASK',
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 'Medium',
        status: 'pending', 
        payload: {
          dueDate: taskData.dueDate || null,
          syncGcal: taskData.syncGcal || false,
          assignedTo: taskData.assignedTo || 'all'
        },
        createdByUid: user.uid,
        createdByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newTodo);
      await historyService.addLog('Todo', 'Create', docRef.id, `สร้างงานใหม่ [${taskData.title}]`, user.uid);
      return docRef.id;
    } catch (error) {
      console.error("🔥 Create Manual Todo Error:", error);
      throw error;
    }
  },

  resolveTodo: async (todo, resolutionData, adminUser) => {
    const todoRef = doc(db, COLLECTION_NAME, todo.id);
    const userId = adminUser.uid;
    const userName = adminUser.nickname || adminUser.firstName || "Staff";
    
    try {
      let orderDocRef = null;
      if ((todo.type === 'WHOLESALE_APPROVAL' || todo.type === 'PAYMENT_VERIFICATION') && todo.payload?.orderId) {
        const q = query(collection(db, 'orders'), where('orderId', '==', todo.payload.orderId), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          orderDocRef = snap.docs[0].ref;
        }
      }

      await runTransaction(db, async (transaction) => {
        const todoDoc = await transaction.get(todoRef);
        if (!todoDoc.exists()) throw new Error("ไม่พบรายการงานนี้");
        if (todoDoc.data().status === 'completed') throw new Error("งานนี้ถูกดำเนินการไปแล้ว");

        let orderData = null;
        if (orderDocRef) {
          const orderSnap = await transaction.get(orderDocRef);
          if (orderSnap.exists()) orderData = orderSnap.data();
        }

        transaction.update(todoRef, {
          status: 'completed',
          resolution: resolutionData || {},
          handledBy: userId,
          handledByName: userName,
          updatedAt: serverTimestamp()
        });

        switch (todo.type) {
          case 'WHOLESALE_APPROVAL':
            if (resolutionData.approvedPrice && orderDocRef && orderData) {
              const approvedPrice = Number(resolutionData.approvedPrice);
              const approvedShipping = Number(resolutionData.approvedShipping || 0);
              
              // ✨ เพิ่มการอ่านค่า Promo & Freebies จากพนักงานที่จัดการด้วยมือ (Fallback ไปที่ค่าเดิม)
              const promoDiscount = resolutionData.manualPromo !== undefined 
                                    ? Number(resolutionData.manualPromo) 
                                    : Number(orderData.summary?.promoDiscount || orderData.promoDiscount || 0);
              const updatedFreebies = resolutionData.freebies !== undefined 
                                    ? resolutionData.freebies 
                                    : (orderData.freebies || orderData.summary?.freebies || '');
              
              const newNetTotal = Math.max(0, approvedPrice - promoDiscount + approvedShipping);
              const walletApplied = Number(orderData.walletApplied || orderData.summary?.walletUsed || 0);
              const newFinalPayable = Math.max(0, newNetTotal - walletApplied);

              let updatedItems = orderData.items;
              if (resolutionData.itemWholesalePrices) {
                 updatedItems = orderData.items.map((item, idx) => {
                     const wsPrice = resolutionData.itemWholesalePrices[idx];
                     if (wsPrice !== undefined) {
                         return { ...item, price: Number(wsPrice), discount: 0 }; 
                     }
                     return item;
                 });
              }

              transaction.update(orderDocRef, {
                items: updatedItems,               
                status: 'waiting_payment',         
                orderStatus: 'waiting_payment',    
                shippingFee: approvedShipping,
                promoDiscount: promoDiscount,
                freebies: updatedFreebies, // 🎁 อัปเดตข้อมูลของแถมลงบิล
                netTotal: newNetTotal,
                finalTotal: newNetTotal,
                finalPayable: newFinalPayable,
                'summary.subTotal': approvedPrice,
                'summary.promoDiscount': promoDiscount,
                'summary.shippingFee': approvedShipping,
                'summary.finalTotal': newNetTotal,
                'summary.freebies': updatedFreebies,
                'wholesaleRequest.approvedAt': serverTimestamp(),
                'wholesaleRequest.approvedPrice': approvedPrice,
                'wholesaleRequest.approvedShipping': approvedShipping,
                updatedAt: serverTimestamp()
              });
            }
            break;

          case 'PAYMENT_VERIFICATION':
            break;

          case 'STAFF_APPROVAL':
            const userRef = doc(db, 'users', todo.payload.uid);
            transaction.update(userRef, {
              isApproved: true,
              role: todo.payload.role || 'พนักงานทั่วไป',
              updatedAt: serverTimestamp()
            });
            break;
            
          case 'KNOWLEDGE_APPROVAL':
            if (todo.payload && todo.payload.sku && todo.payload.proposedValue) {
              const knowledgeProductRef = doc(db, 'products', todo.payload.sku);
              const fieldToUpdate = todo.payload.knowledgeType === 'model' ? 'compatibleModels' : 'compatiblePartNumbers';
              transaction.update(knowledgeProductRef, {
                [fieldToUpdate]: arrayUnion(todo.payload.proposedValue),
                updatedAt: serverTimestamp()
              });
            }
            break;
        }
      });

      if (todo.type === 'PAYMENT_VERIFICATION' && orderDocRef) {
          await billingService.updateOrderStatus(orderDocRef.id, 'paid', 'waiting_verification', adminUser.uid);
      }

      await historyService.addLog('Todo', 'Resolve', todo.id, `จัดการงาน [${todo.type}] สำเร็จโดย ${userName}`, userId);
      return { success: true };
      
    } catch (error) {
      console.error("🔥 Resolve Todo Error:", error);
      throw error;
    }
  },

  rejectTodo: async (todoId, reason, adminUser) => {
    try {
      const todoRef = doc(db, COLLECTION_NAME, todoId);
      const uid = typeof adminUser === 'string' ? adminUser : (adminUser?.uid || 'system');
      const name = typeof adminUser === 'string' ? "Staff" : (adminUser?.nickname || adminUser?.firstName || 'System');
      
      await updateDoc(todoRef, {
        status: 'rejected',
        rejectionReason: reason,
        handledBy: uid,
        handledByName: name,
        updatedAt: serverTimestamp()
      });

      await historyService.addLog('Todo', 'Reject', todoId, `ปฏิเสธงาน เหตุผล: ${reason}`, uid);
      return { success: true };
    } catch (error) {
      console.error("🔥 Reject Todo Error:", error);
      throw error;
    }
  },
  
  recallTodo: async (todo, adminUser) => {
    try {
      const todoId = typeof todo === 'string' ? todo : todo.id;
      const todoTitle = typeof todo === 'string' ? 'งานเก่า' : todo.title;
      const uid = typeof adminUser === 'string' ? adminUser : (adminUser?.uid || 'system');

      const todoRef = doc(db, COLLECTION_NAME, todoId);
      await updateDoc(todoRef, {
        status: 'pending',
        handledBy: null,
        handledByName: null,
        rejectionReason: null,
        resolutionData: null,
        updatedAt: serverTimestamp()
      });

      await historyService.addLog('Todo', 'Recall', todoId, `ดึงงาน ${todoTitle} กลับมาสถานะรอดำเนินการอีกครั้ง`, uid);
      return { success: true };
    } catch (error) {
      console.error("🔥 Recall Todo Error:", error);
      throw error;
    }
  }
};