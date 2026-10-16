import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot, getAggregateFromServer, sum, count, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebase/config';
import { userService } from '../../../../firebase/userService';
import { getCollectionPath, getUsersPath, getUserSubcollectionPath } from 'dh-shared/src/firebase/pathUtils';

// ⚡ Cache & Overwrite Store (Module-level cache with 5-minute TTL)
const CACHE_TTL_MS = 5 * 60 * 1000;
let dashboardMemoryCache = {
    stats: null,
    walletHoldersCount: 0,
    defaultUsers: [],
    timestamp: 0
};

// 🔍 In-Memory Search Cache (3-minute TTL to prevent re-querying Firestore on repeat search)
const SEARCH_CACHE_TTL_MS = 3 * 60 * 1000;
const walletSearchCache = new Map();

export function invalidateWalletCache() {
    dashboardMemoryCache = {
        stats: null,
        walletHoldersCount: 0,
        defaultUsers: [],
        timestamp: 0
    };
    walletSearchCache.clear();
}

export function updateCachedUserBalance(userId, newBalance) {
    if (dashboardMemoryCache.defaultUsers && dashboardMemoryCache.defaultUsers.length > 0) {
        let diff = 0;
        dashboardMemoryCache.defaultUsers = dashboardMemoryCache.defaultUsers.map(u => {
            if (u.id === userId) {
                diff = newBalance - (u.walletBalance || 0);
                return { ...u, walletBalance: newBalance };
            }
            return u;
        });
        if (dashboardMemoryCache.stats && diff !== 0) {
            dashboardMemoryCache.stats = {
                ...dashboardMemoryCache.stats,
                totalBalance: Math.max(0, (dashboardMemoryCache.stats.totalBalance || 0) + diff)
            };
        }
    }
}

export function useWalletManagement(navigate) {
    // Dashboard Stats
    const [walletHoldersCount, setWalletHoldersCount] = useState(0);
    const [stats, setStats] = useState({ totalBalance: 0, pendingAmount: 0 });
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);

    // Pending Withdrawals
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);

    // Search & Users
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [defaultUsers, setDefaultUsers] = useState([]); 
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // Transactions
    const [activeTab, setActiveTab] = useState('wallet'); 
    const [transactions, setTransactions] = useState([]);
    const [pointTransactions, setPointTransactions] = useState([]);
    const [isLoadingTx, setIsLoadingTx] = useState(false);

    // Initial Dashboard Load with Cache & Overwrite
    useEffect(() => {
        const initDashboard = async () => {
            if (!auth.currentUser) { navigate('/'); return; }
            try {
                const profile = await userService.getUserProfile(auth.currentUser.uid);
                if (!profile || !['Manager', 'Owner', 'manager', 'owner', 'admin', 'Admin', 'ผู้จัดการ', 'เจ้าของ', 'แอดมิน'].includes(profile.role)) {
                    navigate('/'); return;
                }

                // ⚡ Check Warm Cache First (Saves ~350 reads on menu switch)
                const isCacheValid = dashboardMemoryCache.stats && (Date.now() - dashboardMemoryCache.timestamp < CACHE_TTL_MS);
                if (isCacheValid) {
                    setStats(prev => ({ ...prev, totalBalance: dashboardMemoryCache.stats.totalBalance }));
                    setWalletHoldersCount(dashboardMemoryCache.walletHoldersCount);
                    setDefaultUsers(dashboardMemoryCache.defaultUsers);
                    setIsDashboardLoading(false);
                    return;
                }

                // ⚡ Cold Query: High-Performance Aggregation (1 Read) + Limited Sample Query (20 Reads)
                const usersRef = collection(db, getUsersPath());
                const qHasBalance = query(usersRef, where('walletBalance', '>', 0));
                try {
                    // 1. Zero-Quota / 1-Read Aggregation: Exact system-wide totals and counts
                    const [aggregateSnap, topDocsSnap] = await Promise.all([
                        getAggregateFromServer(qHasBalance, {
                            totalWallet: sum('walletBalance'),
                            walletHolders: count()
                        }),
                        // 2. Fetch only initial 20 users for table display (saved 80 reads)
                        getDocs(query(qHasBalance, limit(20)))
                    ]);

                    const aggData = aggregateSnap.data();
                    const totalBal = Number(aggData?.totalWallet || 0);
                    const totalHolders = Number(aggData?.walletHolders || 0);

                    const usersList = [];
                    topDocsSnap.forEach(d => {
                        usersList.push({ id: d.id, ...d.data() });
                    });

                    // In-memory sort by balance descending for top users
                    usersList.sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0));

                    setStats(prev => ({ ...prev, totalBalance: totalBal }));
                    setWalletHoldersCount(totalHolders);
                    setDefaultUsers(usersList);

                    // Populate Memory Cache
                    dashboardMemoryCache = {
                        stats: { totalBalance: totalBal },
                        walletHoldersCount: totalHolders,
                        defaultUsers: usersList,
                        timestamp: Date.now()
                    };
                } catch(e) {
                    console.log("Error querying wallet balances:", e);
                }

            } catch (error) {
                console.error("Dashboard Init Error:", error);
            } finally {
                setIsDashboardLoading(false);
            }
        };
        initDashboard();
    }, [navigate]);

    // Sub to Pending Withdrawals (Real-time listener)
    useEffect(() => {
        const q = query(
            collection(db, getCollectionPath('todos')),
            where('taskType', '==', 'WALLET_WITHDRAWAL'),
            where('status', 'in', ['PENDING', 'pending', 'todo'])
        , limit(300));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            requests.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setPendingRequests(requests);
            
            const pendingTotal = requests.reduce((sum, req) => sum + Number(req.withdrawalDetails?.amount || 0), 0);
            setStats(prev => ({ ...prev, pendingAmount: pendingTotal }));
            setIsLoadingRequests(false);
        }, (error) => {
            console.error("Error subscribing to withdrawal requests:", error);
            setIsLoadingRequests(false);
        });

        return () => unsubscribe();
    }, []);

    const loadTransactions = async (uid) => {
        setIsLoadingTx(true);
        try {
            const qWallet = query(collection(db, ...getUserSubcollectionPath(uid, 'wallet_transactions').split('/')), orderBy('timestamp', 'desc'), limit(50));
            const snapWallet = await getDocs(qWallet);
            setTransactions(snapWallet.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const qPoints = query(collection(db, getCollectionPath('credit_transactions')), where('uid', '==', uid), orderBy('timestamp', 'desc'), limit(50));
            const snapPoints = await getDocs(qPoints);
            setPointTransactions(snapPoints.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setIsLoadingTx(false);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        const rawTerm = searchTerm.trim();
        if (!rawTerm) {
            setHasSearched(false); setSearchResults([]); return;
        }
        
        setIsSearching(true); setHasSearched(true);
        setSearchResults([]); setSelectedUser(null);
        
        const cacheKey = rawTerm.toLowerCase();
        const cached = walletSearchCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS)) {
            setSearchResults(cached.data);
            setIsSearching(false);
            return;
        }

        try {
            const usersRef = collection(db, getUsersPath());
            const cleanDigits = rawTerm.replace(/\D/g, '');
            const isPhoneNumber = cleanDigits.length >= 9 && /^0[0-9]{8,9}$/.test(cleanDigits);
            const queries = [];

            // 1. Numeric / Phone Number exact indexed queries (O(1) reads)
            if (/^[0-9]+$/.test(rawTerm) || isPhoneNumber) {
                const targetPhone = isPhoneNumber ? cleanDigits : rawTerm;
                queries.push(query(usersRef, where('phoneNumber', '==', targetPhone), limit(20)));
                queries.push(query(usersRef, where('phone', '==', targetPhone), limit(20)));
                queries.push(query(usersRef, where('tel', '==', targetPhone), limit(20)));
                queries.push(query(usersRef, where('mobile', '==', targetPhone), limit(20)));
            } else {
                // 2. CustomerCode / AccountId / Email exact queries
                const upper = rawTerm.toUpperCase();
                const lower = rawTerm.toLowerCase();
                queries.push(query(usersRef, where('customerCode', '==', upper), limit(20)));
                queries.push(query(usersRef, where('accountId', '==', upper), limit(20)));
                queries.push(query(usersRef, where('email', '==', lower), limit(20)));
                if (rawTerm !== upper) {
                    queries.push(query(usersRef, where('customerCode', '==', rawTerm), limit(20)));
                    queries.push(query(usersRef, where('accountId', '==', rawTerm), limit(20)));
                }

                // 3. Name prefix queries (for names >= 2 characters)
                if (rawTerm.length >= 2) {
                    const prefixEnd = rawTerm + '\uf8ff';
                    queries.push(query(usersRef, where('displayName', '>=', rawTerm), where('displayName', '<=', prefixEnd), limit(20)));
                    queries.push(query(usersRef, where('accountName', '>=', rawTerm), where('accountName', '<=', prefixEnd), limit(20)));
                    queries.push(query(usersRef, where('firstName', '>=', rawTerm), where('firstName', '<=', prefixEnd), limit(20)));
                }
            }

            // 4. Direct UID check if format looks like Firestore UID
            let directUserDoc = null;
            if (rawTerm.length >= 20 && !rawTerm.includes(' ')) {
                try {
                    const uSnap = await getDoc(doc(db, getUsersPath(), rawTerm));
                    if (uSnap.exists()) {
                        directUserDoc = { id: uSnap.id, ...uSnap.data() };
                    }
                } catch (_) {}
            }

            const snaps = await Promise.all(queries.map(q => getDocs(q).catch(() => ({ docs: [] }))));
            const resultMap = new Map();

            if (directUserDoc) {
                resultMap.set(directUserDoc.id, directUserDoc);
            }

            snaps.forEach(snap => {
                snap.docs?.forEach(d => {
                    if (!resultMap.has(d.id)) {
                        resultMap.set(d.id, { id: d.id, ...d.data() });
                    }
                });
            });

            const uniqueResults = Array.from(resultMap.values());
            // Sort by walletBalance descending for manager convenience
            uniqueResults.sort((a, b) => (Number(b.walletBalance || 0)) - (Number(a.walletBalance || 0)));

            walletSearchCache.set(cacheKey, { timestamp: Date.now(), data: uniqueResults });
            setSearchResults(uniqueResults);
        } catch (error) {
            console.error("Error searching users:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return {
        stats,
        walletHoldersCount,
        isDashboardLoading,
        pendingRequests,
        isLoadingRequests,
        searchTerm, setSearchTerm,
        isSearching, hasSearched, setHasSearched, searchResults, defaultUsers,
        selectedUser, setSelectedUser,
        activeTab, setActiveTab,
        transactions, pointTransactions, isLoadingTx,
        handleSearch, loadTransactions
    };
}
