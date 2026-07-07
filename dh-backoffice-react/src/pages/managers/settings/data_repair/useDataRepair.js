import { useState } from 'react';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

export const useDataRepair = () => {
    const [loading, setLoading] = useState(false);
    const [anomalies, setAnomalies] = useState([]);
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const scanForCorruptedOrders = async () => {
        setLoading(true);
        setLogs([]);
        setAnomalies([]);
        addLog("เริ่มสแกนหาบิลที่มีปัญหา (Data Flow Audit)...");

        try {
            // 1. ตรวจหาบิล Cancelled ที่ยังไม่ได้คืนเงินหรือโปรโมชัน (เนื่องจากบัก Read-After-Write)
            const q = query(collection(db, 'orders'), where('status', '==', 'cancelled'));
            const snapshot = await getDocs(q);
            
            let detected = [];
            
            for (const orderDoc of snapshot.docs) {
                const data = orderDoc.data();
                
                // ตรวจสอบเบื้องต้น: บิลยกเลิกที่มีการใช้ Wallet แต่ไม่เคยซ่อม
                const walletUsed = Number(data.summary?.walletUsed || data.walletUsedAmount || data.walletUsed || 0);
                
                if (walletUsed > 0 && data.customerInfo?.uid && !data.repairedAt) {
                    // Check if wallet transaction exists for refund
                    const wTxQuery = query(
                        collection(db, `users/${data.customerInfo.uid}/wallet_transactions`),
                        where('referenceId', '==', data.orderId || orderDoc.id)
                    );
                    const wTxSnap = await getDocs(wTxQuery);
                    
                    // If no refund transaction exists
                    const hasRefund = wTxSnap.docs.some(doc => doc.data().type === 'REFUND_POS' || doc.data().type === 'REFUND');
                    
                    if (!hasRefund) {
                        detected.push({
                            id: orderDoc.id,
                            orderId: data.orderId,
                            issue: 'Missing Wallet Refund (เงินไม่ถูกคืนลูกค้า)',
                            amount: walletUsed,
                            customerUid: data.customerInfo.uid,
                            data: data
                        });
                    }
                }
            }

            setAnomalies(detected);
            addLog(`สแกนเสร็จสิ้น พบรายการผิดปกติทั้งหมด ${detected.length} รายการ`);

        } catch (error) {
            console.error(error);
            addLog(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const scanForCreditAnomalies = async () => {
        setLoading(true);
        setLogs([]);
        setAnomalies([]);
        addLog("เริ่มสแกนตรวจสอบความถูกต้องของแต้ม (Credit Point Integrity Audit)...");

        try {
            const usersRef = collection(db, 'users');
            const usersSnap = await getDocs(usersRef);
            let detected = [];

            for (const userDoc of usersSnap.docs) {
                const uid = userDoc.id;
                const data = userDoc.data();
                const actualPoints = Number(data.creditPoints || 0);
                const actualAccumulated = Number(data.totalAccumulatedPoints || actualPoints);

                // Fetch global credit transactions for this user
                const txRef = collection(db, 'credit_transactions');
                const qTx = query(txRef, where('uid', '==', uid));
                const txSnap = await getDocs(qTx);
                
                let expectedPoints = 0;
                let expectedAccumulated = 0;
                let txCount = 0;

                txSnap.forEach(docSnap => {
                    txCount++;
                    const tx = docSnap.data();
                    const amount = Number(tx.amount || 0);
                    if (tx.type === 'add' || tx.type === 'earn' || tx.type === 'deposit') {
                        expectedPoints += amount;
                        expectedAccumulated += amount;
                    } else if (tx.type === 'deduct' || tx.type === 'spend') {
                        expectedPoints -= amount;
                    }
                });

                if (txCount > 0) {
                    if (expectedPoints !== actualPoints || expectedAccumulated !== actualAccumulated) {
                        detected.push({
                            id: `CREDIT_SYNC_${uid}`,
                            orderId: uid, // Use orderId field for display as UID
                            issue: `แต้มไม่ตรง (จริง: ${actualPoints}, ควรเป็น: ${expectedPoints})`,
                            amount: Math.abs(expectedPoints - actualPoints),
                            customerUid: uid,
                            type: 'CREDIT_SYNC',
                            expectedPoints,
                            expectedAccumulated,
                            data: data
                        });
                    }
                }
            }

            setAnomalies(detected);
            addLog(`สแกนแต้มเสร็จสิ้น พบผู้ใช้ที่มีแต้มไม่ตรงทั้งหมด ${detected.length} บัญชี`);
        } catch (error) {
            console.error(error);
            addLog(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fixOrder = async (anomaly, adminUid) => {
        addLog(`กำลังซ่อมแซมรายการ ${anomaly.orderId}...`);
        
        try {
            if (anomaly.type === 'CREDIT_SYNC') {
                const userRef = doc(db, 'users', anomaly.customerUid);
                await runTransaction(db, async (transaction) => {
                    const userSnap = await transaction.get(userRef);
                    if (!userSnap.exists()) throw new Error("ไม่พบบัญชีผู้ใช้งาน");
                    
                    transaction.update(userRef, {
                        creditPoints: anomaly.expectedPoints,
                        totalAccumulatedPoints: anomaly.expectedAccumulated,
                        updatedAt: serverTimestamp()
                    });
                });
                
                addLog(`✅ ซ่อมแซมแต้มของบัญชี ${anomaly.orderId} สำเร็จ (อัปเดตเป็น ${anomaly.expectedPoints} แต้ม)`);
                setAnomalies(prev => prev.filter(a => a.id !== anomaly.id));
                return;
            }

            // Original Order Fix Logic
            await runTransaction(db, async (transaction) => {
                const orderRef = doc(db, 'orders', anomaly.id);
                const orderSnap = await transaction.get(orderRef);
                
                if (!orderSnap.exists()) throw new Error("ไม่พบบิลในระบบ");
                
                const userRef = doc(db, 'users', anomaly.customerUid);
                const userSnap = await transaction.get(userRef);
                
                if (anomaly.issue.includes('Missing Wallet Refund')) {
                    const txId = `TXW_REFUND_REPAIR_${anomaly.orderId || anomaly.id}`;
                    const walletTxRef = doc(collection(db, `users/${anomaly.customerUid}/wallet_transactions`));
                    
                    transaction.set(walletTxRef, {
                        transactionId: txId,
                        referenceId: anomaly.orderId || anomaly.id,
                        type: 'REFUND_POS',
                        amount: anomaly.amount,
                        status: 'SUCCESS',
                        note: 'คืนเงินอัตโนมัติ (Data Repair System)',
                        operatorUid: adminUid || 'Admin',
                        timestamp: serverTimestamp()
                    });
                    
                    if (userSnap.exists()) {
                        transaction.update(userRef, {
                            walletBalance: (userSnap.data().walletBalance || 0) + anomaly.amount,
                            updatedAt: serverTimestamp()
                        });
                    }
                    
                    transaction.update(orderRef, {
                        repairedAt: serverTimestamp(),
                        repairNote: 'Fixed Missing Wallet Refund via Data Repair System'
                    });
                }
            });
            
            addLog(`✅ ซ่อมแซมบิล ${anomaly.orderId} สำเร็จ (คืนเงิน ฿${anomaly.amount})`);
            setAnomalies(prev => prev.filter(a => a.id !== anomaly.id));
        } catch (error) {
            addLog(`❌ ซ่อมแซม ${anomaly.orderId} ล้มเหลว: ${error.message}`);
        }
    };

    return {
        loading,
        anomalies,
        logs,
        scanForCorruptedOrders,
        scanForCreditAnomalies,
        fixOrder
    };
};
