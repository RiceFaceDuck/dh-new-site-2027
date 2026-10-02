import { useState, useEffect, useCallback } from 'react';
import { collection, collectionGroup, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath, COLLECTION_GROUPS } from 'dh-shared';
import { fetchCustomerDirectoryChunk } from '../../Customers/services/customerCacheService';

// 🛡️ In-memory cache to eliminate duplicate Firestore reads across page navigation
let cachedCustomerMap = null;
let lastDirectoryFetchTime = 0;
const DIRECTORY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let cachedLedgerTransactions = null;
let cachedLedgerStats = null;
let lastLedgerFetchTime = 0;
const LEDGER_CACHE_TTL = 60 * 1000; // 1 minute fresh cache

const defaultStats = {
    walletInflow: 0,
    walletOutflow: 0,
    netWallet: 0,
    creditInflow: 0,
    creditOutflow: 0,
    netCredit: 0,
    totalTransactions: 0,
    anomalyCount: 0
};

const getCustomerNameMap = async () => {
    const now = Date.now();
    if (cachedCustomerMap && (now - lastDirectoryFetchTime < DIRECTORY_CACHE_TTL)) {
        return cachedCustomerMap;
    }
    try {
        const customers = await fetchCustomerDirectoryChunk();
        if (Array.isArray(customers) && customers.length > 0) {
            const map = {};
            customers.forEach(c => {
                const uid = c.uid || c.id;
                if (uid) {
                    map[uid] = c.displayName || c.name || c.accountName || c.storeName || 'Unknown';
                }
            });
            cachedCustomerMap = map;
            lastDirectoryFetchTime = now;
            return map;
        }
    } catch (e) {
        console.warn("Could not load customer directory chunk for audit ledger:", e.message);
    }
    return cachedCustomerMap || {};
};

export const useAuditLedger = () => {
    const [transactions, setTransactions] = useState(cachedLedgerTransactions || []);
    const [stats, setStats] = useState(cachedLedgerStats || defaultStats);
    const [isLoading, setIsLoading] = useState(!cachedLedgerTransactions);
    const [error, setError] = useState(null);

    const fetchAuditLedger = useCallback(async (forceRefresh = false) => {
        const now = Date.now();
        if (!forceRefresh && cachedLedgerTransactions && (now - lastLedgerFetchTime < LEDGER_CACHE_TTL)) {
            setTransactions(cachedLedgerTransactions);
            if (cachedLedgerStats) setStats(cachedLedgerStats);
            setIsLoading(false);
            return;
        }

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
                const amount = Math.abs(Number(data.amount || 0));
                const balanceBefore = data.balanceBefore !== undefined && data.balanceBefore !== null ? Number(data.balanceBefore) : null;
                const balanceAfter = data.balanceAfter !== undefined && data.balanceAfter !== null ? Number(data.balanceAfter) : null;

                // 🛡️ Record-level Checksum verification
                let checksumMismatch = false;
                if (balanceBefore !== null && balanceAfter !== null) {
                    const expected = isEarn ? (balanceBefore + amount) : (balanceBefore - amount);
                    if (Math.abs(expected - balanceAfter) > 0.05) {
                        checksumMismatch = true;
                    }
                }

                combinedTx.push({
                    id: docSnap.id,
                    source: 'credit',
                    type: isEarn ? 'earn' : 'spend', // normalize
                    rawType: data.type,
                    amount,
                    balanceBefore,
                    balanceAfter,
                    checksumMismatch,
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
                    const amount = Math.abs(Number(data.amount || 0));
                    const balanceBefore = data.balanceBefore !== undefined && data.balanceBefore !== null ? Number(data.balanceBefore) : null;
                    const balanceAfter = data.balanceAfter !== undefined && data.balanceAfter !== null ? Number(data.balanceAfter) : null;

                    // 🛡️ Record-level Checksum verification
                    let checksumMismatch = false;
                    if (balanceBefore !== null && balanceAfter !== null) {
                        const expected = isEarn ? (balanceBefore + amount) : (balanceBefore - amount);
                        if (Math.abs(expected - balanceAfter) > 0.05) {
                            checksumMismatch = true;
                        }
                    }

                    combinedTx.push({
                        id: docSnap.id,
                        source: 'wallet',
                        type: isEarn ? 'earn' : 'spend',
                        rawType: data.type,
                        amount,
                        balanceBefore,
                        balanceAfter,
                        checksumMismatch,
                        referenceId: data.transactionId,
                        note: data.note,
                        actor: data.operatorUid || 'System',
                        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date()),
                        customerUid: customerUid,
                        customerName: 'Loading...' // Resolved below via 0-Quota Directory Cache
                    });
                });
            } catch (idxError) {
                console.error("Index missing for collectionGroup wallet_transactions", idxError);
                setError("ระบบกำลังรอการสร้าง Index หรือมีข้อผิดพลาดในการดึงประวัติ Wallet: " + idxError.message);
            }

            // Sort combined by descending timestamp
            combinedTx.sort((a, b) => b.timestamp - a.timestamp);
            
            // 🛡️ Zero-Quota Customer Name Resolution: Use customer directory chunk cache instead of N+1 getDoc queries
            const nameMap = await getCustomerNameMap();
            combinedTx = combinedTx.map(tx => {
                if (tx.customerName === 'Loading...' || !tx.customerName || tx.customerName === 'Unknown') {
                    const resolved = nameMap[tx.customerUid];
                    if (resolved) {
                        return { ...tx, customerName: resolved };
                    }
                    if (tx.customerName === 'Loading...') {
                        return { ...tx, customerName: `User (${(tx.customerUid || '').substring(0, 8)})` };
                    }
                }
                return tx;
            });

            // 🛡️ Compute Checksum Totals & Health Metrics
            let walletInflow = 0;
            let walletOutflow = 0;
            let creditInflow = 0;
            let creditOutflow = 0;
            let anomalyCount = 0;

            combinedTx.forEach(tx => {
                if (tx.source === 'wallet') {
                    if (tx.type === 'earn') walletInflow += tx.amount;
                    else walletOutflow += tx.amount;
                } else {
                    if (tx.type === 'earn') creditInflow += tx.amount;
                    else creditOutflow += tx.amount;
                }

                if (tx.checksumMismatch || (tx.balanceAfter !== null && tx.balanceAfter < 0)) {
                    anomalyCount++;
                }
            });

            const computedStats = {
                walletInflow,
                walletOutflow,
                netWallet: walletInflow - walletOutflow,
                creditInflow,
                creditOutflow,
                netCredit: creditInflow - creditOutflow,
                totalTransactions: combinedTx.length,
                anomalyCount
            };

            cachedLedgerTransactions = combinedTx;
            cachedLedgerStats = computedStats;
            lastLedgerFetchTime = Date.now();
            setTransactions(combinedTx);
            setStats(computedStats);
        } catch (err) {
            console.error("Error fetching ledger", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAuditLedger();
    }, [fetchAuditLedger]);

    return { 
        transactions, 
        stats,
        isLoading, 
        error, 
        refreshLedger: () => fetchAuditLedger(true) 
    };
};
