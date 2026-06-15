import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../../firebase/config';
import { userService } from '../../../../firebase/userService';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

export function useWalletManagement(navigate) {
    // Dashboard Stats
    const [globalLedger, setGlobalLedger] = useState(null);
    const [walletHoldersCount, setWalletHoldersCount] = useState(0);
    const [globalHistory, setGlobalHistory] = useState([]);
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

    // Initial Dashboard Load
    useEffect(() => {
        const initDashboard = async () => {
            if (!auth.currentUser) { navigate('/'); return; }
            try {
                const profile = await userService.getUserProfile(auth.currentUser.uid);
                if (!profile || !['Manager', 'Owner', 'manager', 'owner', 'admin', 'Admin', 'ผู้จัดการ', 'เจ้าของ', 'แอดมิน'].includes(profile.role)) {
                    navigate('/'); return;
                }

                const settingsSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config'));
                if (settingsSnap.exists()) setGlobalLedger(settingsSnap.data().ledger);

                const usersRef = collection(db, 'artifacts', appId, 'users');
                const qHasBalance = query(usersRef, where('walletBalance', '>', 0));
                let totalBal = 0; let count = 0;
                try {
                    const snap = await getDocs(qHasBalance);
                    snap.forEach(d => { totalBal += Number(d.data().walletBalance || 0); count++; });
                    setStats(prev => ({ ...prev, totalBalance: totalBal }));
                    setWalletHoldersCount(count);
                } catch(e) { console.log("Missing index for walletBalance"); }

                const qActiveUsers = query(usersRef, where('walletBalance', '>', 0), limit(20));
                try {
                    const activeSnap = await getDocs(qActiveUsers);
                    const aUsers = activeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    aUsers.sort((a,b) => (b.walletBalance || 0) - (a.walletBalance || 0));
                    setDefaultUsers(aUsers);
                } catch(e) { console.log("Missing index for active users"); }

                const qHist = query(collection(db, 'artifacts', appId, 'public', 'data', 'credit_transactions'), orderBy('timestamp', 'desc'), limit(30));
                try {
                    const histSnap = await getDocs(qHist);
                    setGlobalHistory(histSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                } catch(e) { console.log("Missing index for history"); }

            } catch (error) {
                console.error("Dashboard Init Error:", error);
            } finally {
                setIsDashboardLoading(false);
            }
        };
        initDashboard();
    }, [navigate]);

    // Sub to Pending Withdrawals
    useEffect(() => {
        const q = query(
            collection(db, 'artifacts', appId, 'public', 'data', 'todos'),
            where('taskType', '==', 'WALLET_WITHDRAWAL'),
            where('status', 'in', ['PENDING', 'pending', 'todo'])
        );

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
            const qWallet = query(collection(db, 'artifacts', appId, 'users', uid, 'wallet_transactions'), orderBy('timestamp', 'desc'), limit(50));
            const snapWallet = await getDocs(qWallet);
            setTransactions(snapWallet.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const qPoints = query(collection(db, 'artifacts', appId, 'users', uid, 'credit_history'), orderBy('createdAt', 'desc'), limit(50));
            const snapPoints = await getDocs(qPoints);
            setPointTransactions(snapPoints.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setIsLoadingTx(false);
        }
    };

    const handleSearch = async (e) => {
        if(e) e.preventDefault();
        if (!searchTerm.trim()) {
            setHasSearched(false); setSearchResults([]); return;
        }
        
        setIsSearching(true); setHasSearched(true);
        setSearchResults([]); setSelectedUser(null);
        
        try {
            const term = searchTerm.trim().toLowerCase();
            const results = [];
            const usersRef = collection(db, 'artifacts', appId, 'users');

            const snap = await getDocs(query(usersRef, limit(100))); 
            snap.forEach(d => {
                const data = d.data();
                if (
                    (data.customerCode && data.customerCode.toLowerCase().includes(term)) ||
                    (data.phoneNumber && data.phoneNumber.includes(term)) ||
                    (data.phone && data.phone.includes(term)) ||
                    (data.accountName && data.accountName.toLowerCase().includes(term)) ||
                    (data.displayName && data.displayName.toLowerCase().includes(term))
                ) {
                    results.push({ id: d.id, ...data });
                }
            });
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching users:", error);
            throw new Error("ค้นหาล้มเหลว");
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
