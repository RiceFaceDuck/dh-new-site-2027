import { db, auth } from './config';
import { collection, doc, updateDoc, deleteDoc, serverTimestamp, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { historyService } from './historyService';
import { generateAccountId } from './customer/accountIdService';
import { gasHistoryService } from './gasHistoryService';

const getCollectionPath = (colName) => {
    if (typeof __app_id !== 'undefined' && window.location.hostname.includes('canvas')) {
        return `artifacts/${__app_id}/public/data/${colName}`;
    }
    return colName; 
};

const getUserDocRef = (uid) => doc(db, getCollectionPath('users'), uid);

export const createManualCustomer = async (data) => {
    try {
        const usersRef = collection(db, getCollectionPath('users'));
        
        // ถ้าระบุรหัสมาเอง (customerCode/accountId) ให้ใช้ค่านั้น ถ้าไม่ระบุ ให้สร้างใหม่มาตรฐาน
        const accountId = data.accountId || data.customerCode || generateAccountId();

        // 1. สร้าง Document ใหม่เพื่อให้ Firestore สุ่ม ID ให้ก่อน
        const docRef = doc(usersRef);
        await setDoc(docRef, {
            ...data,
            uid: docRef.id,
            accountId: accountId,
            customerCode: accountId, // เก็บไว้เพื่อ backward compatibility
            isManualCustomer: true,
            role: data.rank || 'Customer',
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            source: 'manual_entry'
        });
        
        // 3. บันทึก History Log ตามกฎของระบบ Backoffice
        const customerName = data.accountName || data.displayName || 'Unknown';
        await historyService.addLog('Customer', 'Create', docRef.id, `เพิ่มรายชื่อลูกค้าใหม่: ${customerName} (Account ID: ${accountId})`, auth.currentUser?.uid);

        console.log(`✅ [CustomerAdminService] Created manual customer with ID: ${docRef.id} and Account ID: ${accountId}`);
        return docRef.id;
    } catch (error) {
        console.error("❌ [CustomerAdminService] Create Manual Customer Error:", error);
        throw error;
    }
};

export const updateCustomerProfile = async (uid, data) => {
    try {
        const userRef = getUserDocRef(uid);
        
        // 1. ดึงข้อมูลเก่า (Snapshot) มาเปรียบเทียบ
        const userSnap = await getDoc(userRef);
        let oldData = {};
        if (userSnap.exists()) {
            oldData = userSnap.data();
        }

        // 2. เปรียบเทียบความเปลี่ยนแปลง (Diffing Engine)
        const fieldLabels = {
            accountName: 'ชื่อร้าน/บริษัท',
            contactName: 'ชื่อผู้ติดต่อ',
            phone: 'เบอร์โทรศัพท์',
            email: 'อีเมล',
            address: 'ที่อยู่',
            logisticProvider: 'ขนส่งที่ใช้งาน',
            logisticNote: 'หมายเหตุขนส่ง',
            rank: 'ระดับบัญชี',
            accountRank: 'ป้ายกำกับ',
            role: 'สิทธิ์การใช้งาน',
            isActive: 'สถานะเปิดใช้งาน',
            status: 'สถานะบัญชี'
        };

        const changes = {};
        let changeSummary = [];
        
        Object.keys(data).forEach(key => {
            if (['updatedAt', 'createdAt', 'metadata'].includes(key)) return;
            
            // เปรียบเทียบเฉพาะค่าที่ถูกแก้ไขและส่งมาใหม่จริงๆ
            if (data[key] !== undefined && oldData[key] !== data[key]) {
                const label = fieldLabels[key] || key;
                changes[key] = {
                    old: oldData[key] || '-',
                    new: data[key] || '-',
                    label: label
                };
                changeSummary.push(label);
            }
        });

        // 3. อัปเดตข้อมูลลง Firestore
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        
        const customerName = data.accountName || data.displayName || oldData.accountName || oldData.displayName || uid;
        
        // 4. บันทึก History แบบละเอียด (ถ้ามีการเปลี่ยนแปลง)
        if (Object.keys(changes).length > 0) {
            const summaryText = changeSummary.length > 0 ? ` (แก้ไข: ${changeSummary.join(', ')})` : '';
            gasHistoryService.log({
                level: 'INFO',
                module: 'Customer',
                action: 'Update',
                target: { id: uid, name: customerName },
                details: {
                    legacy_details: `แก้ไขข้อมูลลูกค้า: ${customerName}${summaryText}`,
                    changes: changes
                }
            });
        } else {
            // Fallback กรณีไม่มีการเปลี่ยนฟิลด์หลัก
            await historyService.addLog('Customer', 'Update', uid, `แก้ไขข้อมูลลูกค้า: ${customerName}`, auth.currentUser?.uid);
        }

        // 🔒 Strict Data Relations: Cascade Disable Partner if suspended
        if (data.isActive === false || data.status === 'suspended' || data.status === 'deleted') {
            try {
                const { query, where, getDocs, writeBatch } = await import('firebase/firestore');
                const partnersRef = collection(db, 'partners');
                const q = query(partnersRef, where('ownerId', '==', uid));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const batch = writeBatch(db);
                    querySnapshot.forEach((docSnap) => {
                        batch.update(docSnap.ref, { isActive: false });
                    });
                    await batch.commit();
                    await historyService.addLog('Partner', 'Update', uid, `ปิดการใช้งานร้านช่างอัตโนมัติ เนื่องจากบัญชีถูกระงับ/ปิดใช้งาน`, auth.currentUser?.uid);
                }

                // 🧹 Cleanup Orphaned Todos (Optimized to prevent massive reads)
                const todosRef = collection(db, 'todos');
                
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
                                cancelReason: 'Customer account was suspended',
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
                    await historyService.addLog('Task', 'Cancel', uid, `ยกเลิก ${cancelledCount} รายการงานอัตโนมัติ เนื่องจากบัญชีลูกค้าถูกระงับ/ปิดใช้งาน`, auth.currentUser?.uid);
                }

            } catch (partnerErr) {
                console.error("🔥 Cascade Disable Error:", partnerErr);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("❌ [CustomerAdminService] Update Customer Profile Error:", error);
        throw error;
    }
};

export const deleteCustomer = async (targetUid, customerName) => {
    try {
        const userRef = getUserDocRef(targetUid);
        
        // 🔒 Strict Data Relations: Check wallet balance before deleting
        const { getDoc } = await import('firebase/firestore');
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            const credits = Number(data.creditPoints || data.stats?.rewardPoints || data.walletBalance || 0);
            if (credits > 0) {
                throw new Error("ไม่อนุญาตให้ลบรายชื่อที่มีเครดิต/เงินค้างอยู่ในระบบ (Orphan Data Prevention)");
            }
        }

        // 🗑️ Soft Delete
        await updateDoc(userRef, {
            status: 'deleted',
            isActive: false,
            updatedAt: serverTimestamp(),
            deletedAt: serverTimestamp(),
            deletedBy: auth.currentUser?.uid
        });
        
        await historyService.addLog('Customer', 'Delete', targetUid, `ลบรายชื่อลูกค้า: ${customerName} (Soft Delete)`, auth.currentUser?.uid);

        // 🔒 Strict Data Relations: Cascade Disable Partner if deleted
        try {
            const { query, where, getDocs, writeBatch } = await import('firebase/firestore');
            const partnersRef = collection(db, 'partners');
            const q = query(partnersRef, where('ownerId', '==', targetUid));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const batch = writeBatch(db);
                querySnapshot.forEach((docSnap) => {
                    batch.update(docSnap.ref, { isActive: false });
                });
                await batch.commit();
                await historyService.addLog('Partner', 'Update', targetUid, `ปิดการใช้งานร้านช่างอัตโนมัติ เนื่องจากบัญชีเจ้าของร้านถูกลบ`, auth.currentUser?.uid);
            }

            // 🧹 Cleanup Orphaned Todos (Optimized to prevent massive reads)
            const todosRef = collection(db, 'todos');
            
            // Query 1: customerUid at root
            const q1 = query(todosRef, where('customerUid', '==', targetUid), where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager', 'waiting_item', 'processing']));
            // Query 2: customerUid inside payload
            const q2 = query(todosRef, where('payload.customerUid', '==', targetUid), where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager', 'waiting_item', 'processing']));
            
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
                            cancelReason: 'Customer account was deleted',
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
                await historyService.addLog('Task', 'Cancel', targetUid, `ยกเลิก ${cancelledCount} รายการงานอัตโนมัติ เนื่องจากบัญชีลูกค้าถูกลบ`, auth.currentUser?.uid);
            }

        } catch (partnerErr) {
            console.error("🔥 Cascade Disable Error:", partnerErr);
        }

        console.log(`✅ [CustomerAdminService] Deleted customer ${customerName} (${targetUid})`);
        return { success: true };
    } catch (error) {
        console.error("❌ [CustomerAdminService] Delete Customer Error:", error);
        throw error;
    }
};

export const syncCustomerAccount = async (manualUid, targetAccountId) => {
    try {
        const { query, where, getDocs, writeBatch } = await import('firebase/firestore');
        const usersRef = collection(db, getCollectionPath('users'));
        
        // 1. หาบัญชี Web ปลายทาง (Target)
        const q = query(usersRef, where('accountId', '==', targetAccountId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error(`ไม่พบบัญชีลูกค้าระบบที่มี ID: ${targetAccountId}`);
        }
        
        const targetDoc = querySnapshot.docs[0];
        const targetData = targetDoc.data();
        const targetUid = targetDoc.id;

        if (!targetData.email) {
            throw new Error(`บัญชีปลายทางยังไม่ได้ยืนยัน Email ไม่สามารถควบรวมได้`);
        }

        if (manualUid === targetUid) {
            throw new Error(`ไม่สามารถซิงค์ข้อมูลเข้าตัวเองได้`);
        }

        // 2. ดึงข้อมูลบัญชี Manual ต้นทาง
        const manualRef = getUserDocRef(manualUid);
        const manualSnap = await getDoc(manualRef);
        
        if (!manualSnap.exists()) {
            throw new Error(`ไม่พบข้อมูลบัญชีต้นทาง`);
        }
        
        const manualData = manualSnap.data();

        // 3. เริ่มโอนย้ายข้อมูล (Batch)
        // สร้าง batch เพื่ออัปเดตข้อมูลทุกอย่างพร้อมกัน
        const batch = writeBatch(db);

        // --- A. อัปเดตข้อมูลลูกค้า (รวม Wallet/Points) ---
        const combinedWallet = Number(targetData.walletBalance || 0) + Number(manualData.walletBalance || 0);
        const combinedPoints = Number(targetData.creditPoints || targetData.stats?.rewardPoints || 0) + Number(manualData.creditPoints || manualData.stats?.rewardPoints || 0);
        
        const updatePayload = {
            walletBalance: combinedWallet,
            creditPoints: combinedPoints,
            updatedAt: serverTimestamp()
        };

        // โอนย้ายข้อมูลติดต่อ (ถ้าปลายทางยังไม่มี)
        if (!targetData.phone && manualData.phone) updatePayload.phone = manualData.phone;
        if (!targetData.address && manualData.address) updatePayload.address = manualData.address;
        if ((!targetData.accountName || targetData.accountName === targetData.displayName) && manualData.accountName) updatePayload.accountName = manualData.accountName;
        
        // กรณีมี Rank ให้เลือก Rank ที่สูงกว่า (สมมติว่าอัปเดตถ้าต้นทางมี)
        if (manualData.rank && !targetData.rank) updatePayload.rank = manualData.rank;

        batch.update(targetDoc.ref, updatePayload);

        // --- B. ย้ายรายการ Orders ---
        const ordersRef = collection(db, 'orders');
        const ordersQ = query(ordersRef, where('customer.uid', '==', manualUid));
        const ordersSnap = await getDocs(ordersQ);
        ordersSnap.forEach((docSnap) => {
            const currentCustomer = docSnap.data().customer || {};
            batch.update(docSnap.ref, { 
                customer: { ...currentCustomer, uid: targetUid },
                updatedAt: serverTimestamp()
            });
        });

        // --- C. ย้ายรายการ Todos ---
        const todosRef = collection(db, 'todos');
        const todosQ1 = query(todosRef, where('customerUid', '==', manualUid));
        const todosSnap1 = await getDocs(todosQ1);
        todosSnap1.forEach((docSnap) => {
            batch.update(docSnap.ref, { customerUid: targetUid });
        });

        const todosQ2 = query(todosRef, where('payload.customerUid', '==', manualUid));
        const todosSnap2 = await getDocs(todosQ2);
        todosSnap2.forEach((docSnap) => {
            const currentPayload = docSnap.data().payload || {};
            batch.update(docSnap.ref, { payload: { ...currentPayload, customerUid: targetUid } });
        });

        // --- D. ย้ายรายการ Claims ---
        const claimsRef = collection(db, 'claims');
        const claimsQ = query(claimsRef, where('customerUid', '==', manualUid));
        const claimsSnap = await getDocs(claimsQ);
        claimsSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { customerUid: targetUid });
        });

        // --- E. ย้ายรายการ Partners ---
        const partnersRef = collection(db, 'partners');
        const partnersQ = query(partnersRef, where('ownerId', '==', manualUid));
        const partnersSnap = await getDocs(partnersQ);
        partnersSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { ownerId: targetUid });
        });
        
        // --- F. ย้ายรายการ Credit Transactions ---
        const creditsRef = collection(db, 'credit_transactions');
        const creditsQ = query(creditsRef, where('targetUid', '==', manualUid));
        const creditsSnap = await getDocs(creditsQ);
        creditsSnap.forEach((docSnap) => {
            batch.update(docSnap.ref, { targetUid: targetUid });
        });

        // --- G. ลบหรือปิดใช้งานบัญชีเดิม (Soft Delete) ---
        batch.update(manualRef, {
            status: 'merged',
            isActive: false,
            mergedInto: targetUid,
            updatedAt: serverTimestamp(),
            mergedAt: serverTimestamp(),
            mergedBy: auth.currentUser?.uid
        });

        await batch.commit();

        // 4. บันทึก Audit Log อย่างละเอียด
        const sourceName = manualData.accountName || manualData.displayName || manualUid;
        const targetName = targetData.accountName || targetData.displayName || targetUid;
        
        gasHistoryService.log({
            level: 'WARNING',
            module: 'Customer',
            action: 'Merge',
            target: { id: manualUid, name: sourceName },
            details: {
                legacy_details: `โอนย้ายข้อมูลทั้งหมดจากบัญชี: ${sourceName} ไปยังบัญชีเว็บ: ${targetName} (${targetAccountId}) สำเร็จ`,
                merge_stats: {
                    walletTransferred: manualData.walletBalance || 0,
                    pointsTransferred: manualData.creditPoints || 0,
                    ordersMoved: ordersSnap.size,
                    claimsMoved: claimsSnap.size,
                    todosMoved: todosSnap1.size + todosSnap2.size,
                    partnersMoved: partnersSnap.size
                }
            }
        });

        return { 
            success: true, 
            targetUid, 
            message: `โอนย้ายสำเร็จ (บิล ${ordersSnap.size} รายการ, เงิน ${formatCurrency(manualData.walletBalance || 0)} บาท)` 
        };
    } catch (error) {
        console.error("❌ [CustomerAdminService] Sync Customer Account Error:", error);
        throw error;
    }
};

const formatCurrency = (num) => Number(num || 0).toLocaleString('th-TH');
