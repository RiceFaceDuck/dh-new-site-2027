import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Search, Wallet, ArrowDownToLine, ArrowUpFromLine, 
    History, AlertTriangle, User, Clock, FileText, X, Loader2, Save,
    Landmark, Users, ShieldCheck, Phone, Copy, CheckCircle2, Building2, Activity,
    Banknote, Coins, Star, Megaphone, CheckCircle, XCircle
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy, getCountFromServer, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { creditCoreService } from '../../firebase/creditCoreService';
import { userService } from '../../firebase/userService';
import { todoService } from '../../firebase/todoService';

const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

export default function WalletManagement() {
    const navigate = useNavigate();
    
    // ==========================================
    // 1. States & Variables
    // ==========================================
    // Dashboard Stats
    const [globalLedger, setGlobalLedger] = useState(null);
    const [walletHoldersCount, setWalletHoldersCount] = useState(0);
    const [globalHistory, setGlobalHistory] = useState([]);
    const [stats, setStats] = useState({ totalBalance: 0, pendingAmount: 0 });
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);

    // Pending Withdrawals (To-do)
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);

    // Search & Users
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [defaultUsers, setDefaultUsers] = useState([]); 
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [copiedPhone, setCopiedPhone] = useState(null);
    
    // Transactions
    const [activeTab, setActiveTab] = useState('wallet'); 
    const [transactions, setTransactions] = useState([]);
    const [pointTransactions, setPointTransactions] = useState([]);
    const [isLoadingTx, setIsLoadingTx] = useState(false);

    // Manual Adjust Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adjType, setAdjType] = useState('deposit'); 
    const [adjAmount, setAdjAmount] = useState('');
    const [adjNote, setAdjNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Action Modal (Approve/Reject)
    const [selectedTask, setSelectedTask] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState('APPROVE');
    const [actionNote, setActionNote] = useState('');
    const [actionSlipUrl, setActionSlipUrl] = useState('');
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);

    const [notification, setNotification] = useState(null);
    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // ==========================================
    // 2. Fetch Data & Subscriptions
    // ==========================================
    useEffect(() => {
        const initDashboard = async () => {
            if (!auth.currentUser) { navigate('/'); return; }
            try {
                // Check Role
                const profile = await userService.getUserProfile(auth.currentUser.uid);
                if (!profile || !['Manager', 'Owner', 'manager', 'owner', 'admin', 'Admin', 'ผู้จัดการ', 'เจ้าของ', 'แอดมิน'].includes(profile.role)) {
                    navigate('/'); return;
                }

                // Get Settings
                const settingsSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config'));
                if (settingsSnap.exists()) setGlobalLedger(settingsSnap.data().ledger);

                // Fetch Users with Balance for Stats
                const usersRef = collection(db, 'artifacts', appId, 'users');
                const qHasBalance = query(usersRef, where('walletBalance', '>', 0));
                let totalBal = 0; let count = 0;
                try {
                    const snap = await getDocs(qHasBalance);
                    snap.forEach(d => { totalBal += Number(d.data().walletBalance || 0); count++; });
                    setStats(prev => ({ ...prev, totalBalance: totalBal }));
                    setWalletHoldersCount(count);
                } catch(e) { console.log("Missing index for walletBalance"); }

                // Fetch Default Users (Top creditors)
                const qActiveUsers = query(usersRef, where('walletBalance', '>', 0), limit(20));
                try {
                    const activeSnap = await getDocs(qActiveUsers);
                    const aUsers = activeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    aUsers.sort((a,b) => (b.walletBalance || 0) - (a.walletBalance || 0));
                    setDefaultUsers(aUsers);
                } catch(e) { console.log("Missing index for active users"); }

                // Fetch Global History
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

    // 🚀 Subscribe to Pending Withdrawals (To-do List)
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
            
            // Update pending amount stat
            const pendingTotal = requests.reduce((sum, req) => sum + Number(req.withdrawalDetails?.amount || 0), 0);
            setStats(prev => ({ ...prev, pendingAmount: pendingTotal }));
            
            setIsLoadingRequests(false);
        }, (error) => {
            console.error("Error subscribing to withdrawal requests:", error);
            setIsLoadingRequests(false);
        });

        return () => unsubscribe();
    }, []);

    // ==========================================
    // 3. Action Handlers
    // ==========================================
    
    // 🚀 อนุมัติ / ปฏิเสธ คำขอถอนเงิน
    const handleProcessAction = async (e) => {
        e.preventDefault();
        if (!selectedTask) return;
        
        if (actionType === 'REJECT' && !actionNote.trim()) {
            showNotification("กรุณาระบุเหตุผลที่ไม่อนุมัติ", "error");
            return;
        }

        setIsActionSubmitting(true);
        try {
            const adminInfo = {
                uid: auth.currentUser?.uid || 'Admin',
                displayName: auth.currentUser?.displayName || 'Manager'
            };

            const extraData = {
                note: actionNote,
                slipUrl: actionSlipUrl
            };

            // เรียกใช้ Service ศูนย์กลางที่สร้างไว้ในขั้นตอนที่ 4
            await todoService.processWalletWithdrawal(selectedTask.id, actionType, adminInfo, extraData);
            
            showNotification(actionType === 'APPROVE' ? "✅ อนุมัติการถอนเงินเรียบร้อยแล้ว" : "✅ ปฏิเสธการถอนเงินและคืนยอดเรียบร้อย");
            setIsActionModalOpen(false);
            setActionNote('');
            setActionSlipUrl('');
            
        } catch (error) {
            console.error("Action process error:", error);
            showNotification(error.message || "เกิดข้อผิดพลาดในการประมวลผล", "error");
        } finally {
            setIsActionSubmitting(false);
        }
    };

    // ค้นหาลูกค้า
    const handleSearch = async (e) => {
        e.preventDefault();
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
            showNotification("ค้นหาล้มเหลว", "error");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        loadTransactions(user.id);
        setActiveTab('wallet');
    };

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

    // ปรับปรุงยอดเงินแบบ Manual (Direct Transaction)
    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(adjAmount);
        
        if (!amount || amount <= 0 || isNaN(amount)) return showNotification('กรุณาระบุจำนวนเงินให้ถูกต้อง', 'error');
        if (!adjNote.trim()) return showNotification('กรุณาระบุหมายเหตุ', 'error');

        setIsSubmitting(true);
        try {
            await creditCoreService.adjustUserCredit(
                selectedUser.id, 
                amount, 
                adjType === 'deposit' ? 'deposit' : 'deduct', 
                `[Wallet] ${adjNote}`, 
                auth.currentUser?.uid || 'Admin'
            );

            showNotification(`✅ ทำรายการสำเร็จ`);
            setIsModalOpen(false);
            setAdjAmount(''); setAdjNote('');
            
            // อัปเดต State Local
            const newBal = adjType === 'deposit' ? (selectedUser.walletBalance || 0) + amount : (selectedUser.walletBalance || 0) - amount;
            setSelectedUser(prev => ({ ...prev, walletBalance: newBal }));
            await loadTransactions(selectedUser.id);
            
        } catch (error) {
            console.error("Manual adjust error:", error);
            showNotification(`❌ ${error.message}`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyAllPhones = () => {
        const phones = defaultUsers.map(u => u.phone || u.phoneNumber).filter(p => p && p.trim() !== '').join(', ');
        if (phones) {
            navigator.clipboard.writeText(phones);
            alert(`คัดลอกเบอร์โทรลูกค้าเรียบร้อยแล้ว!`);
        } else {
            alert('ไม่พบเบอร์โทรศัพท์ในรายชื่อนี้');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedPhone(text);
        setTimeout(() => setCopiedPhone(null), 2000);
    };

    const currentWalletBalance = selectedUser ? (selectedUser.walletBalance || 0) : 0;
    const currentPointsBalance = selectedUser ? (selectedUser.creditPoints || 0) : 0;
    const displayUsers = hasSearched ? searchResults : defaultUsers;

    return (
        <div className="flex flex-col h-full bg-slate-50 p-3 lg:p-4 overflow-hidden font-sans relative">
            
            {/* 🏷️ Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 font-bold animate-in slide-in-from-right fade-in duration-300 ${
                    notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {notification.msg}
                </div>
            )}

            {/* 🏷️ Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/managers')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest mb-1.5 border border-indigo-100">
                            <Building2 size={12} /> Financial Operations
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">ศูนย์จัดการกระเป๋าเงินลูกค้า (Wallet Management)</h1>
                    </div>
                </div>
            </div>

            {/* 📊 Top Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 mt-3 lg:mt-4 shrink-0">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0"><Users size={24} strokeWidth={2}/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">บัญชีที่มียอดค้าง</p>
                        {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-300"/> : (
                            <h3 className="text-xl font-black text-slate-800">{walletHoldersCount.toLocaleString()} <span className="text-xs font-bold text-slate-500">บัญชี</span></h3>
                        )}
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Wallet size={24} strokeWidth={2}/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ยอดเงินคงค้างระบบทั้งหมด</p>
                        {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-300"/> : (
                            <h3 className="text-xl font-black text-slate-800 font-mono">฿{Number(stats.totalBalance || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
                        )}
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="p-3 bg-slate-700 text-amber-400 rounded-xl shrink-0"><Clock size={24} strokeWidth={2}/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ยอดเงินรออนุมัติถอน</p>
                        {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-500"/> : (
                            <h3 className="text-xl font-black text-amber-400 font-mono">฿{Number(stats.pendingAmount || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
                        )}
                    </div>
                </div>
            </div>

            {/* 🛑 Pending Requests Section (งานด่วน) */}
            {pendingRequests.length > 0 && (
                <div className="mt-3 lg:mt-4 bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden shrink-0 animate-in fade-in slide-in-from-top-4">
                    <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 flex justify-between items-center">
                        <h3 className="font-black text-sm text-amber-800 flex items-center gap-2">
                            <Activity size={16} className="text-amber-500 animate-pulse"/> คำขอถอนเงินรออนุมัติ ({pendingRequests.length})
                        </h3>
                    </div>
                    <div className="p-3 overflow-x-auto">
                        <div className="flex gap-3 pb-2">
                            {pendingRequests.map(task => (
                                <div key={task.id} className="min-w-[300px] w-[350px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><User size={16}/></div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800 truncate w-32">{task.customer?.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-mono">UID: {task.customer?.uid?.substring(0,6)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">ยอดถอน</p>
                                            <p className="text-lg font-black text-amber-600 font-mono leading-none">฿{Number(task.withdrawalDetails?.amount||0).toLocaleString('th-TH')}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-lg mb-3 border border-slate-100">
                                        <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5"><Building2 size={12} className="text-slate-400"/> {task.withdrawalDetails?.bankName}</p>
                                        <p className="text-xs font-mono font-black text-slate-800 mt-0.5">{task.withdrawalDetails?.accountNumber}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{task.withdrawalDetails?.accountName}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setSelectedTask(task); setActionType('REJECT'); setIsActionModalOpen(true); }} className="flex-1 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors">ปฏิเสธ</button>
                                        <button onClick={() => { setSelectedTask(task); setActionType('APPROVE'); setIsActionModalOpen(true); }} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-all">โอนแล้ว</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 🎨 Main Layout: 2 Columns */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-3 lg:gap-4 mt-3 lg:mt-4">
                
                {/* ⬅️ LEFT COLUMN: ค้นหา & ลิสต์ลูกค้า */}
                <div className="w-full lg:w-[35%] xl:w-[30%] flex flex-col gap-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 shrink-0">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="รหัสลูกค้า, เบอร์โทร, ชื่อ..." 
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (e.target.value === '') setHasSearched(false);
                                    }}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                            </div>
                            <button type="submit" disabled={isSearching} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-colors shadow-sm disabled:opacity-50">
                                {isSearching ? <Loader2 size={18} className="animate-spin"/> : 'ค้นหา'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {hasSearched ? 'ผลการค้นหา' : 'ลูกค้ายอดเงินค้างสูงสุด'}
                            </span>
                            {!hasSearched && (
                                <button onClick={copyAllPhones} className="text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold bg-white px-2 py-1 rounded border border-indigo-200 shadow-sm flex items-center gap-1 transition-colors">
                                    <Megaphone size={12}/> คัดลอกเบอร์โทร
                                </button>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                    <Loader2 size={32} className="animate-spin mb-2 opacity-50 text-indigo-500" />
                                </div>
                            ) : displayUsers.length > 0 ? (
                                <div className="space-y-1">
                                    {displayUsers.map(user => {
                                        const bal = user.walletBalance || 0;
                                        return (
                                        <div 
                                            key={user.id} 
                                            onClick={() => handleSelectUser(user)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                                                ${selectedUser?.id === user.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex-1 min-w-0 pr-3">
                                                <div className={`font-black text-sm truncate flex items-center gap-2 ${selectedUser?.id === user.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                    {user.accountName || user.displayName || user.firstName || 'ไม่ระบุชื่อ'}
                                                    {user.role === 'partner' && <span className="shrink-0 text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded">Partner</span>}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 font-mono mt-1">ID: {user.customerCode || user.id.substring(0,8)}</div>
                                            </div>
                                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                                <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                                    ฿{bal.toLocaleString('th-TH', {minimumFractionDigits: 2})}
                                                </div>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                    <User size={40} className="mb-2" strokeWidth={1.5} />
                                    <span className="font-bold text-xs">ไม่พบข้อมูลลูกค้า</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ➡️ RIGHT COLUMN: ข้อมูล Wallet & Statement */}
                {selectedUser ? (
                    <div className="flex-1 flex flex-col gap-3 lg:gap-4 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                        
                        {/* 💰 Wallet Status Card (Deep Luxury Banking Style) */}
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-lg border border-indigo-900/50 p-5 lg:p-6 shrink-0 relative overflow-hidden text-white">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                            
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10"><User size={20} className="text-indigo-100" /></div>
                                        <div>
                                            <h2 className="text-sm font-black text-white">{selectedUser.accountName || selectedUser.displayName || 'ลูกค้าทั่วไป'}</h2>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-200/70 font-mono mt-0.5">
                                                <span>ID: {selectedUser.customerCode || selectedUser.id}</span>
                                                {(selectedUser.phone || selectedUser.phoneNumber) && (
                                                    <button onClick={() => copyToClipboard(selectedUser.phone || selectedUser.phoneNumber)} className="flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                                        <Phone size={10}/> {selectedUser.phone || selectedUser.phoneNumber} 
                                                        {copiedPhone === (selectedUser.phone || selectedUser.phoneNumber) ? <CheckCircle2 size={10} className="text-emerald-400"/> : <Copy size={10}/>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-6">
                                        <div>
                                            <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 flex items-center gap-1"><Wallet size={12}/> กระเป๋าเงิน (Wallet)</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">฿{currentWalletBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                        <div className="pb-1">
                                            <h3 className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest mb-1 flex items-center gap-1"><Coins size={12}/> แต้ม (Points)</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-amber-400/80 tracking-tight">{currentPointsBalance.toLocaleString('th-TH')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap md:flex-col gap-2 md:w-48 shrink-0">
                                    <button onClick={() => { setAdjType('deposit'); setIsModalOpen(true); }} className="flex-1 md:w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95">
                                        <ArrowDownToLine size={14} strokeWidth={3} /> เติมเงินเข้ากระเป๋า
                                    </button>
                                    <button onClick={() => { setAdjType('cash_withdrawal'); setIsModalOpen(true); }} className="flex-1 md:w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all active:scale-95">
                                        <Banknote size={14} strokeWidth={3} /> จ่ายคืนเป็นเงินสด
                                    </button>
                                    <button onClick={() => { setAdjType('deduct'); setIsModalOpen(true); }} className="flex-1 md:w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 border border-white/10 backdrop-blur-sm transition-all active:scale-95">
                                        <ArrowUpFromLine size={14} strokeWidth={3} /> ยึดเงิน / หักยอด
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 📜 Statement Table */}
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                            <div className="px-5 pt-4 border-b border-slate-200 bg-slate-50/50">
                                <div className="flex items-center gap-6">
                                    <button onClick={() => setActiveTab('wallet')} className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'wallet' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                        <Wallet size={16}/> ประวัติกระเป๋าเงิน
                                    </button>
                                    <button onClick={() => setActiveTab('points')} className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'points' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                        <Coins size={16}/> ประวัติแต้ม
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {isLoadingTx ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Loader2 size={32} className="animate-spin mb-2 opacity-50" />
                                        <span className="font-bold text-xs">กำลังเรียกข้อมูลบัญชี...</span>
                                    </div>
                                ) : activeTab === 'wallet' ? (
                                    /* --- WALLET STATEMENT --- */
                                    transactions.length > 0 ? (
                                        <table className="w-full text-left">
                                            <thead className="bg-white sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 shadow-sm">
                                                <tr>
                                                    <th className="px-5 py-3">รายละเอียด (Description)</th>
                                                    <th className="px-5 py-3 text-right">จำนวนเงิน</th>
                                                    <th className="px-5 py-3 text-right">คงเหลือ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {transactions.map(tx => {
                                                    const isPositive = tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'WITHDRAWAL_REJECTED';
                                                    const isCash = tx.type === 'cash_withdrawal' || tx.type === 'WITHDRAWAL_COMPLETED' || tx.type === 'WITHDRAWAL_REQUEST';
                                                    return (
                                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isCash ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                                        {isPositive ? <ArrowDownToLine size={14} strokeWidth={2.5}/> : isCash ? <Banknote size={14} strokeWidth={2.5}/> : <ArrowUpFromLine size={14} strokeWidth={2.5}/>}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-black text-xs text-slate-800">{tx.note || tx.type}</div>
                                                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                                                            <span className="flex items-center gap-1"><Clock size={10}/> {tx.timestamp ? new Date(tx.timestamp.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span className="font-mono text-slate-500">Ref: {tx.referenceId || tx.transactionId}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right align-top">
                                                                <div className={`font-black text-sm ${isPositive ? 'text-emerald-600' : isCash ? 'text-amber-600' : 'text-rose-600'}`}>
                                                                    {isPositive ? '+' : '-'} {Number(tx.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                                </div>
                                                                {tx.status && <div className={`text-[9px] font-bold uppercase mt-0.5 ${tx.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}`}>{tx.status}</div>}
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right align-top">
                                                                <div className="font-bold text-xs text-slate-500">
                                                                    {Number(tx.balanceAfter || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                            <Wallet size={40} className="mb-2 opacity-30" strokeWidth={1.5} />
                                            <span className="font-bold text-xs">ยังไม่มีความเคลื่อนไหวทางบัญชี</span>
                                        </div>
                                    )
                                ) : (
                                    /* --- POINTS STATEMENT --- */
                                    pointTransactions.length > 0 ? (
                                        <table className="w-full text-left">
                                            <thead className="bg-white sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 shadow-sm">
                                                <tr>
                                                    <th className="px-5 py-3">รายละเอียดการใช้งาน</th>
                                                    <th className="px-5 py-3 text-right">จำนวนแต้ม</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {pointTransactions.map(pt => {
                                                    const isEarn = pt.type === 'deposit' || pt.type === 'earn';
                                                    return (
                                                        <tr key={pt.id} className="hover:bg-amber-50/30 transition-colors group">
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isEarn ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                                        {isEarn ? <Star size={14} strokeWidth={2.5}/> : <History size={14} strokeWidth={2.5}/>}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-black text-xs text-slate-800">{pt.note || pt.action || pt.type}</div>
                                                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                                                            <span className="flex items-center gap-1"><Clock size={10}/> {pt.createdAt ? new Date(pt.createdAt.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span className="font-mono text-slate-500">Ref: {pt.referenceId || pt.transactionId}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right align-middle">
                                                                <div className={`font-black text-sm ${isEarn ? 'text-amber-500' : 'text-slate-600'}`}>
                                                                    {isEarn ? '+' : '-'}{Number(pt.amount || pt.points || 0).toLocaleString('th-TH')}
                                                                </div>
                                                                <div className="font-bold text-[10px] text-slate-400 mt-0.5">เหลือ: {Number(pt.balanceAfter || 0).toLocaleString('th-TH')}</div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                            <Coins size={40} className="mb-2 opacity-30" strokeWidth={1.5} />
                                            <span className="font-bold text-xs">ยังไม่มีประวัติแต้มสะสม</span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // 🌍 Global History (Default View)
                    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2"><Activity size={16} className="text-indigo-500"/> ประวัติระบบส่วนกลาง (Global Ledger)</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-white sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 shadow-sm">
                                    <tr>
                                        <th className="px-5 py-3">รายละเอียด (Description)</th>
                                        <th className="px-5 py-3 text-right">จำนวน (Amount)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {globalHistory.length > 0 ? globalHistory.map(tx => {
                                        const isPositive = tx.type === 'deposit' || tx.type === 'refund';
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                            {isPositive ? <ArrowDownToLine size={14} strokeWidth={2.5}/> : <ArrowUpFromLine size={14} strokeWidth={2.5}/>}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-xs text-slate-800">{tx.note || 'ทำรายการ'}</div>
                                                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                                                <span className="flex items-center gap-1"><Clock size={10}/> {tx.timestamp ? new Date(tx.timestamp.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="font-mono text-slate-500">UID: {tx.uid?.substring(0,8)}...</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right align-middle">
                                                    <div className={`font-black text-sm ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                        {isPositive ? '+' : '-'} {Number(tx.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr><td colSpan="2" className="text-center py-10 text-xs font-bold text-slate-400">ยังไม่มีข้อมูลในระบบ</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ✨ Action Modal: Approve / Reject Withdrawal */}
            {isActionModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`p-6 text-white relative ${actionType === 'APPROVE' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                            <button onClick={() => setIsActionModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                {actionType === 'APPROVE' ? <CheckCircle className="w-8 h-8 text-emerald-200" /> : <XCircle className="w-8 h-8 text-rose-200" />}
                                <div>
                                    <h2 className="text-xl font-bold">{actionType === 'APPROVE' ? 'ยืนยันการโอนเงินคืนลูกค้า' : 'ปฏิเสธคำขอและดึงเงินกลับเข้า Wallet'}</h2>
                                    <p className="text-white/90 font-mono text-sm mt-1">ยอดเงิน: ฿{Number(selectedTask.withdrawalDetails?.amount||0).toLocaleString('th-TH', {minimumFractionDigits:2})}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleProcessAction} className="p-6 space-y-5">
                            {actionType === 'APPROVE' ? (
                                <>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">บัญชีรับเงินของลูกค้า</p>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-800">ธนาคาร: {selectedTask.withdrawalDetails?.bankName}</p>
                                            <p className="text-sm font-mono font-bold text-slate-800 flex items-center gap-2">เลขบัญชี: <span className="text-emerald-600 text-lg">{selectedTask.withdrawalDetails?.accountNumber}</span></p>
                                            <p className="text-sm text-slate-600">ชื่อบัญชี: {selectedTask.withdrawalDetails?.accountName}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">แนบลิงก์สลิปโอนเงิน (ถ้ามี)</label>
                                        <input 
                                            type="url" 
                                            value={actionSlipUrl}
                                            onChange={e => setActionSlipUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">หมายเหตุถึงลูกค้า (ไม่บังคับ)</label>
                                        <input 
                                            type="text" 
                                            value={actionNote}
                                            onChange={e => setActionNote(e.target.value)}
                                            placeholder="โอนเรียบร้อยแล้วค่ะ..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 mb-4 text-sm font-medium">
                                        <AlertTriangle className="w-5 h-5 mb-1 inline-block mr-2" />
                                        เมื่อกดปฏิเสธ ยอดเงินจะถูกดึงกลับไปที่ Wallet ของลูกค้าโดยอัตโนมัติ เพื่อให้ลูกค้าแก้ไขข้อมูลและส่งคำขอมาใหม่
                                    </div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">เหตุผลที่ปฏิเสธ (บังคับ) <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={actionNote}
                                        onChange={e => setActionNote(e.target.value)}
                                        placeholder="เช่น เลขบัญชีไม่ถูกต้อง กรุณาตรวจสอบใหม่"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all"
                                    />
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setIsActionModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">ยกเลิก</button>
                                <button 
                                    type="submit"
                                    disabled={isActionSubmitting}
                                    className={`px-5 py-2.5 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'}`}
                                >
                                    {isActionSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> ประมวลผล...</> : actionType === 'APPROVE' ? 'ยืนยันโอนเงิน' : 'ยืนยันการปฏิเสธ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✨ Modal: Manual Adjust */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                        <div className={`p-6 text-white relative ${adjType === 'deposit' ? 'bg-emerald-600' : adjType === 'cash_withdrawal' ? 'bg-amber-500' : 'bg-slate-800'}`}>
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {adjType === 'deposit' ? <ArrowDownToLine className="w-6 h-6" /> : adjType === 'cash_withdrawal' ? <Banknote className="w-6 h-6" /> : <ArrowUpFromLine className="w-6 h-6" />}
                                {adjType === 'deposit' ? 'เพิ่มเงิน Wallet' : adjType === 'cash_withdrawal' ? 'จ่ายคืนเป็นเงินสด' : 'หักเงิน Wallet'}
                            </h2>
                            <p className="text-white/80 text-sm mt-1 truncate pr-8">บัญชี: {selectedUser.displayName || selectedUser.accountName}</p>
                        </div>

                        <form onSubmit={handleAdjustmentSubmit} className="flex flex-col">
                            <div className="p-6 bg-white flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-700 mb-1.5 block">จำนวนเงิน (บาท) <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">฿</span>
                                        <input 
                                            type="number" step="0.01" min="0.01"
                                            max={(adjType === 'deduct' || adjType === 'cash_withdrawal') ? currentWalletBalance : undefined}
                                            value={adjAmount}
                                            onChange={e => setAdjAmount(e.target.value)}
                                            required
                                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border-2 rounded-xl font-black text-lg outline-none transition-all ${adjType === 'deposit' ? 'border-emerald-200 focus:border-emerald-500 focus:bg-white text-emerald-700' : adjType === 'cash_withdrawal' ? 'border-amber-200 focus:border-amber-500 focus:bg-white text-amber-700' : 'border-slate-200 focus:border-slate-500 focus:bg-white text-slate-800'}`}
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                    {(adjType === 'deduct' || adjType === 'cash_withdrawal') && (
                                        <div className="flex justify-between items-center mt-2 px-1">
                                            <span className="text-xs text-slate-500 font-medium">ยอดเงินที่ทำรายการได้</span>
                                            <span className="text-xs font-bold text-slate-700 font-mono">฿ {currentWalletBalance.toLocaleString('th-TH')}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="text-xs font-black text-slate-700 mb-1.5 block">รายละเอียด / อ้างอิง (Memo) <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <textarea 
                                            required
                                            value={adjNote}
                                            onChange={e => setAdjNote(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all min-h-[80px]"
                                            placeholder={adjType === 'deposit' ? "เช่น คืนเงินจากออเดอร์ยกเลิก..." : adjType === 'cash_withdrawal' ? "เช่น ลูกค้ารับเงินสดที่เคาน์เตอร์โดย นาย..." : "เช่น ดึงเงินคืนระบบ..."}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white text-slate-600 font-black rounded-xl hover:bg-slate-100 transition-colors text-sm border border-slate-200 shadow-sm">ยกเลิก</button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || ((adjType === 'deduct' || adjType === 'cash_withdrawal') && Number(adjAmount) > currentWalletBalance)} 
                                    className={`px-5 py-2.5 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-md text-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${adjType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500' : adjType === 'cash_withdrawal' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} strokeWidth={2.5}/>} 
                                    ยืนยันทำรายการ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}