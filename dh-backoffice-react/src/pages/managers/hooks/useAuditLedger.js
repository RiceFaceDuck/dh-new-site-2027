import { useState, useEffect } from 'react';
import { collection, collectionGroup, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath, COLLECTION_GROUPS } from 'dh-shared';
import { getCustomerDisplayName } from 'dh-shared/src/utils/customerUtils';


export const useAuditLedger = () => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuditLedger = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Fetch Global Credit Transactions
                const creditRef = collection(db, getCollectionPath('credit_transactions'));
                const creditQ = query(creditRef, orderBy('timestamp', 'desc'), limit(100));
                const creditSnap = await getDocs(creditQ);
                
                let combinedTx = [];
                
                creditSnap.forEach(docSnap => {
                    const data = docSnap.data();
                    const rawType = (data.type || '').toLowerCase();
                    // 🟢 Credit INFLOW (earn): add, deposit, earn, topup, reversal
                    const isEarn = rawType === 'add' || rawType === 'deposit' || rawType === 'earn' || rawType === 'topup' || rawType === 'reversal';
                    combinedTx.push({
                        id: docSnap.id,
                        source: 'credit',
                        type: isEarn ? 'earn' : 'spend', // normalize
                        rawType: data.type,
                        amount: Math.abs(Number(data.amount || 0)),
                        balanceAfter: data.balanceAfter !== undefined && data.balanceAfter !== null ? Number(data.balanceAfter) : null,
                        referenceId: data.referenceId || data.transactionId,
                        note: data.note || data.remark,
                        actor: data.operatorUid || data.recordedBy || 'System',
                        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date()),
                        customerUid: data.uid,
                        customerName: data.partnerName || 'Unknown'
                    });
                });

                // 2. Fetch Wallet Transactions across all users
                // Note: requires index on wallet_transactions -> timestamp DESC
                try {
                    const walletQ = query(collectionGroup(db, COLLECTION_GROUPS.WALLET_TRANSACTIONS), orderBy('timestamp', 'desc'), limit(100));
                    const walletSnap = await getDocs(walletQ);

                    walletSnap.forEach(docSnap => {
                        const data = docSnap.data();
                        // Get UID from path: users/{uid}/wallet_transactions/{txId}
                        const pathSegments = docSnap.ref.path.split('/');
                        const customerUid = pathSegments[pathSegments.length - 3];
                        
                        const rawType = (data.type || '').toLowerCase();
                        // 🟢 Wallet INFLOW (earn): refund, deposit, topup, withdrawal_rejected, reversal
                        // 🔴 Wallet OUTFLOW (spend): spend, withdrawal, withdrawal_request, withdrawal_completed, payment
                        const isEarn = rawType === 'refund' || rawType === 'deposit' || rawType === 'topup' || rawType === 'withdrawal_rejected' || rawType === 'reversal';

                        combinedTx.push({
                            id: docSnap.id,
                            source: 'wallet',
                            type: isEarn ? 'earn' : 'spend',
                            rawType: data.type,
                            amount: Math.abs(Number(data.amount || 0)),
                            balanceAfter: data.balanceAfter !== undefined && data.balanceAfter !== null ? Number(data.balanceAfter) : null,
                            referenceId: data.transactionId,
                            note: data.note,
                            actor: data.operatorUid || 'System',
                            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date()),
                            customerUid: customerUid,
                            customerName: 'Loading...' // Will fetch below if needed, or omit to save reads
                        });
                    });
                } catch (idxError) {
                    console.error("Index missing for collectionGroup wallet_transactions", idxError);
                    setError("ระบบกำลังรอการสร้าง Index หรือมีข้อผิดพลาดในการดึงประวัติ Wallet: " + idxError.message);
                }

                // Sort combined
                combinedTx.sort((a, b) => b.timestamp - a.timestamp);
                
                // Resolve unknown customer names for wallet (Limit to unique UIDs to save reads)
                const uniqueUids = [...new Set(combinedTx.filter(tx => tx.customerName === 'Loading...').map(tx => tx.customerUid))];
                if (uniqueUids.length > 0) {
                    const uidNameMap = {};
                    await Promise.all(uniqueUids.map(async (uid) => {
                        if (!uid) return;
                        const userSnap = await getDoc(doc(db, getCollectionPath('users'), uid));
                        if (userSnap.exists()) {
                            const u = userSnap.data();
                            uidNameMap[uid] = getCustomerDisplayName(u, 'Unknown');
                        }
                    }));
                    
                    combinedTx = combinedTx.map(tx => {
                        if (tx.customerName === 'Loading...') {
                            return { ...tx, customerName: uidNameMap[tx.customerUid] || 'Unknown User' };
                        }
                        return tx;
                    });
                }

                setTransactions(combinedTx);
            } catch (err) {
                console.error("Error fetching ledger", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAuditLedger();
    }, []);

    return { transactions, isLoading, error };
};
