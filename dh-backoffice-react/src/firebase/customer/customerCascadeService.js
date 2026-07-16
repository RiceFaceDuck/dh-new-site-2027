import { db } from '../config';
import { collection, query, where, getDocs, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { historyService } from '../historyService';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';



export const cascadeDisableCustomer = async (uid, authUserUid, reason = "บัญชีลูกค้าถูกระงับ/ปิดใช้งาน") => {
    try {
        const partnersRef = collection(db, getCollectionPath('partners'));
        const q = query(partnersRef, where('ownerId', '==', uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const batch = writeBatch(db);
            querySnapshot.forEach((docSnap) => {
                batch.update(docSnap.ref, { isActive: false, updatedAt: serverTimestamp() });
            });
            await batch.commit();
            await historyService.addLog('Partner', 'Update', uid, `ปิดการใช้งานร้านช่างอัตโนมัติ เนื่องจาก${reason}`, authUserUid);
        }
    } catch (partnerErr) {
        console.error("🔥 Cascade Disable Partner Error:", partnerErr);
    }
};

export const cleanupOrphanedTodos = async (uid, authUserUid, reason = "บัญชีลูกค้าถูกระงับ/ปิดใช้งาน") => {
    try {
        const todosRef = collection(db, getCollectionPath('todos'));
        
        // Query 1: customerUid at root
        const q1 = query(todosRef, where('customerUid', '==', uid), where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager', 'waiting_item', 'processing']));
        // Query 2: customerUid inside payload
        const q2 = query(todosRef, where('payload.customerUid', '==', uid), where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager', 'waiting_item', 'processing']));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        let cancelledCount = 0;
        const todoBatch = writeBatch(db);
        const processedTodoIds = new Set();

        const processSnap = (snap) => {
            snap.forEach((docSnap) => {
                if (!processedTodoIds.has(docSnap.id)) {
                    processedTodoIds.add(docSnap.id);
                    todoBatch.update(docSnap.ref, {
                        status: 'cancelled',
                        cancelReason: `Cancelled due to: ${reason}`,
                        updatedAt: serverTimestamp()
                    });
                    cancelledCount++;
                }
            });
        };

        processSnap(snap1);
        processSnap(snap2);

        if (cancelledCount > 0) {
            await todoBatch.commit();
            await historyService.addLog('Task', 'Cancel', uid, `ยกเลิก ${cancelledCount} รายการงานอัตโนมัติ เนื่องจาก${reason}`, authUserUid);
        }
    } catch (err) {
        console.error("🔥 Cleanup Orphaned Todos Error:", err);
    }
};

export const cascadeDeleteCustomer = async (uid, authUserUid) => {
    try {
        const batch = writeBatch(db);
        let hasUpdates = false;

        // 1. Disable in partners collection
        const partnersRef = collection(db, getCollectionPath('partners'));
        const q = query(partnersRef, where('ownerId', '==', uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            querySnapshot.forEach((docSnap) => {
                batch.update(docSnap.ref, { isActive: false, updatedAt: serverTimestamp() });
            });
            hasUpdates = true;
        }

        // 2. Delete from ActivePartners (Frontend Map Pins)
        const activePartnerRef = doc(db, getCollectionPath('ActivePartners'), uid);
        batch.delete(activePartnerRef);
        hasUpdates = true;

        // 3. Pause active ads
        const adCols = ['partner_ads', 'billboard_ads', 'user_sku_ads'];
        
        // Execute queries in parallel to avoid N+1 waterfall
        const adSnapshots = await Promise.all(adCols.map(async (col) => {
            const adsRef = collection(db, getCollectionPath(col));
            const adsQ = query(adsRef, where('ownerId', '==', uid));
            return getDocs(adsQ);
        }));

        adSnapshots.forEach(adsSnap => {
            adsSnap.forEach(adDoc => {
                batch.update(adDoc.ref, {
                    status: 'paused',
                    isActive: false,
                    pauseReason: 'Owner account was deleted/suspended',
                    updatedAt: serverTimestamp()
                });
                hasUpdates = true;
            });
        });

        if (hasUpdates) {
            await batch.commit();
            await historyService.addLog('Partner', 'Update', uid, `ปิดการใช้งานร้านช่าง ลบหมุดบนแผนที่ และระงับโฆษณาอัตโนมัติ เนื่องจากบัญชีเจ้าของร้านถูกลบ`, authUserUid);
        }

        // 4. Cleanup Todos
        await cleanupOrphanedTodos(uid, authUserUid, "บัญชีลูกค้าถูกลบ");

        // 5. Cleanup Orders & Claims (Soft mark as deleted user to prevent unknown data)
        const ordersRef = collection(db, getCollectionPath('orders'));
        const ordersQ = query(ordersRef, where('customer.uid', '==', uid));
        const ordersSnap = await getDocs(ordersQ);
        
        const childBatch = writeBatch(db);
        let hasChildUpdates = false;
        
        ordersSnap.forEach(docSnap => {
            childBatch.update(docSnap.ref, { 
                'customer.isDeleted': true, 
                'customer.deletedAt': serverTimestamp(),
                updatedAt: serverTimestamp() 
            });
            hasChildUpdates = true;
        });

        const claimsRef = collection(db, getCollectionPath('claims'));
        const claimsQ = query(claimsRef, where('customerUid', '==', uid));
        const claimsSnap = await getDocs(claimsQ);
        claimsSnap.forEach(docSnap => {
            childBatch.update(docSnap.ref, { 
                isCustomerDeleted: true,
                updatedAt: serverTimestamp() 
            });
            hasChildUpdates = true;
        });

        if (hasChildUpdates) {
            await childBatch.commit();
        }

    } catch (err) {
        console.error("🔥 Cascade Delete Error:", err);
    }
};
