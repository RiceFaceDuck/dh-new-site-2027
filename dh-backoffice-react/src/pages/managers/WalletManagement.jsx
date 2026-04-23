import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Search, Wallet, ArrowDownToLine, ArrowUpFromLine, 
    History, AlertTriangle, User, Clock, FileText, X, Loader2, Save,
    Landmark, Users, ShieldCheck, Phone, Copy, CheckCircle2, Building2, Activity,
    Banknote, Coins, Star, Megaphone
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { creditService } from '../../firebase/creditService';
import { userService } from '../../firebase/userService';

export default function WalletManagement() {
    const navigate = useNavigate();
    
    // State สำหรับการตั้งค่าส่วนกลาง (Dashboard)
    const [globalLedger, setGlobalLedger] = useState(null);
    const [walletHoldersCount, setWalletHoldersCount] = useState(0);
    const [globalHistory, setGlobalHistory] = useState([]);
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);

    // State สำหรับการค้นหาและลูกค้า
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [defaultUsers, setDefaultUsers] = useState([]); 
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [copiedPhone, setCopiedPhone] = useState(null);
    
    // State สำหรับประวัติ Transaction & Points ของผู้ใช้ที่ถูกเลือก
    const [activeTab, setActiveTab] = useState('wallet'); // 'wallet' หรือ 'points'
    const [transactions, setTransactions] = useState([]);
    const [pointTransactions, setPointTransactions] = useState([]);
    const [isLoadingTx, setIsLoadingTx] = useState(false);

    // State สำหรับ Modal ปรับปรุงยอดเงิน
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adjType, setAdjType] = useState('deposit'); // deposit, deduct, cash_withdrawal
    const [adjAmount, setAdjAmount] = useState('');
    const [adjNote, setAdjNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. เช็คสิทธิ์และโหลดข้อมูล Dashboard ตั้งต้น (Smart Reads)
    useEffect(() => {
        const initDashboard = async () => {
            if (!auth.currentUser) { navigate('/'); return; }
            try {
                const profile = await userService.getUserProfile(auth.currentUser.uid);
                if (!profile || !['Manager', 'Owner', 'ผู้จัดการ', 'เจ้าของ'].includes(profile.role)) {
                    navigate('/'); return;
                }

                // 1.1 ดึง Master Ledger
                const settingsSnap = await getDoc(doc(db, 'settings', 'credit_config'));
                if (settingsSnap.exists()) {
                    setGlobalLedger(settingsSnap.data().ledger);
                }

                // 1.2 นับจำนวนลูกค้าที่มีกระเป๋าเงินค้าง (ใช้ getCountFromServer เพื่อประหยัด Quota)
                const usersRef = collection(db, 'users');
                const qCount = query(usersRef, where('stats.creditBalance', '>', 0));
                try {
                    const countSnap = await getCountFromServer(qCount);
                    setWalletHoldersCount(countSnap.data().count);
                } catch(e) {
                    console.log("No index for count, skipping count optimization");
                }

                // 1.3 ดึงลูกค้าที่มีเงินค้าง (Marketing Tool)
                const qActiveUsers = query(usersRef, where('stats.creditBalance', '>', 0), limit(20));
                try {
                    const activeSnap = await getDocs(qActiveUsers);
                    const aUsers = activeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    // เรียงยอดเงินจากมากไปน้อยใน Memory
                    aUsers.sort((a,b) => (b.stats?.creditBalance || 0) - (a.stats?.creditBalance || 0));
                    setDefaultUsers(aUsers);
                } catch(e) {
                    console.log("No index for active users, skipping");
                }

                // 1.4 ดึงประวัติระบบส่วนกลาง
                const qHist = query(collection(db, 'credit_transactions'), orderBy('timestamp', 'desc'), limit(30));
                const histSnap = await getDocs(qHist);
                setGlobalHistory(histSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (error) {
                console.error("Dashboard Init Error:", error);
            } finally {
                setIsDashboardLoading(false);
            }
        };
        initDashboard();
    }, [navigate]);

    // ฟังก์ชันค้นหาลูกค้า
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setHasSearched(false);
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        setHasSearched(true);
        setSearchResults([]);
        setSelectedUser(null);
        
        try {
            const term = searchTerm.trim();
            const results = [];

            // ค้นหา ID ตรงๆ
            const docRef = doc(db, 'users', term);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) results.push({ id: docSnap.id, ...docSnap.data() });

            // ค้นหาจาก text
            if (results.length === 0) {
                const q = query(collection(db, 'users'), limit(30));
                const snap = await getDocs(q);
                
                snap.forEach(d => {
                    const data = d.data();
                    const s = term.toLowerCase();
                    if (
                        (data.customerCode && data.customerCode.toLowerCase().includes(s)) ||
                        (data.phone && data.phone.includes(s)) ||
                        (data.accountName && data.accountName.toLowerCase().includes(s)) ||
                        (data.displayName && data.displayName.toLowerCase().includes(s))
                    ) {
                        results.push({ id: d.id, ...data });
                    }
                });
            }
            setSearchResults(results);
        } catch (error) {
            console.error("Error searching users:", error);
            alert("เกิดข้อผิดพลาดในการค้นหา");
        } finally {
            setIsSearching(false);
        }
    };

    // เลือกลูกค้าและโหลดประวัติทั้งเงินและแต้ม
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        loadTransactions(user.id);
        setActiveTab('wallet');
    };

    const loadTransactions = async (uid) => {
        setIsLoadingTx(true);
        try {
            // โหลดประวัติกระเป๋าเงิน
            const qWallet = query(collection(db, 'credit_transactions'), where('uid', '==', uid));
            const snapWallet = await getDocs(qWallet);
            const txs = snapWallet.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            txs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            setTransactions(txs.slice(0, 50)); 

            // โหลดประวัติแต้มสะสม
            const qPoints = query(collection(db, 'point_transactions'), where('uid', '==', uid));
            const snapPoints = await getDocs(qPoints);
            const pts = snapPoints.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            pts.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            setPointTransactions(pts.slice(0, 50));

        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setIsLoadingTx(false);
        }
    };

    const openAdjustmentModal = (type) => {
        setAdjType(type);
        setAdjAmount('');
        setAdjNote('');
        setIsModalOpen(true);
    };

    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(adjAmount);
        
        if (!amount || amount <= 0 || isNaN(amount)) return alert('กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)');
        if (!adjNote.trim()) return alert('กรุณาระบุหมายเหตุ เพื่อใช้ในการอ้างอิงบัญชี');

        setIsSubmitting(true);
        try {
            await creditService.adjustUserCredit(selectedUser.id, amount, adjType, adjNote, auth.currentUser.uid);

            const currentWallet = selectedUser.stats?.creditBalance || selectedUser.partnerCredit || 0;
            const newBalance = adjType === 'deposit' ? currentWallet + amount : currentWallet - amount;
            
            setSelectedUser(prev => ({
                ...prev,
                stats: { ...(prev.stats || {}), creditBalance: newBalance },
                partnerCredit: newBalance
            }));

            await loadTransactions(selectedUser.id);
            
            // รีเฟรช Dashboard ทันที
            const settingsSnap = await getDoc(doc(db, 'settings', 'credit_config'));
            if (settingsSnap.exists()) setGlobalLedger(settingsSnap.data().ledger);

            let alertMsg = '✅ ทำรายการสำเร็จ';
            if (adjType === 'deposit') alertMsg = '✅ คืนเงิน/เติมเงิน สำเร็จ';
            if (adjType === 'deduct') alertMsg = '✅ หักเงิน/ยึดเงิน สำเร็จ';
            if (adjType === 'cash_withdrawal') alertMsg = '✅ ถอนเงินสด สำเร็จ (ระบบตัดยอดเงินแล้ว)';
            alert(alertMsg);

            setIsModalOpen(false);
        } catch (error) {
            console.error("Error adjusting credit:", error);
            alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // อาวุธลับการตลาด: คัดลอกเบอร์โทรทั้งหมดของลูกค้าที่มีเงินค้าง
    const copyAllPhones = () => {
        const phones = defaultUsers
            .map(u => u.phone)
            .filter(p => p && p.trim() !== '')
            .join(', ');
        
        if (phones) {
            navigator.clipboard.writeText(phones);
            alert(`คัดลอกเบอร์โทรลูกค้าทั้งหมด ${defaultUsers.filter(u=>u.phone).length} รายการ เรียบร้อยแล้ว!\\nนำไปใช้วางในระบบส่ง SMS หรือแจกทีม Sales ได้เลย`);
        } else {
            alert('ไม่พบเบอร์โทรศัพท์ในรายชื่อนี้');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedPhone(text);
        setTimeout(() => setCopiedPhone(null), 2000);
    };

    const currentWalletBalance = selectedUser ? (selectedUser.stats?.creditBalance || selectedUser.partnerCredit || 0) : 0;
    const currentPointsBalance = selectedUser ? (selectedUser.stats?.rewardPoints || 0) : 0;
    const displayUsers = hasSearched ? searchResults : defaultUsers;

    return (
        <div className="flex flex-col h-full bg-slate-50 p-3 lg:p-4 overflow-hidden font-sans relative">
            
            {/* 🏷️ Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/managers')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black uppercase tracking-widest mb-1.5 border border-blue-100">
                            <Building2 size={12} /> Financial & Marketing Operations
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">ระบบศูนย์กลางกระเป๋าเงิน (Central Wallet Manager)</h1>
                    </div>
                </div>
            </div>

            {/* 📊 Top Dashboard: Liability Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 mt-3 lg:mt-4 shrink-0">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Landmark size={24} strokeWidth={2}/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หนี้สินคงค้างในระบบ (Total Liability)</p>
                        {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-300 mt-1"/> : (
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">฿{(globalLedger?.totalAllocated || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
                        )}
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Users size={24} strokeWidth={2}/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">จำนวนเจ้าหนี้ (Wallet Holders)</p>
                        {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-300 mt-1"/> : (
                            <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{walletHoldersCount.toLocaleString()} <span className="text-xs font-bold text-slate-500">บัญชี</span></h3>
                        )}
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="p-3 bg-slate-700 text-blue-400 rounded-xl shrink-0"><ShieldCheck size={24} strokeWidth={2}/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">สถานะบัญชีกลาง (Ledger Status)</p>
                        {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-500 mt-1"/> : (
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="relative flex h-2.5 w-2.5"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${globalLedger?.status === 'SECURE' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span><span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${globalLedger?.status === 'SECURE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span></span>
                                <h3 className="text-sm font-black text-white tracking-widest">{globalLedger?.status || 'SECURE'}</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                />
                            </div>
                            <button type="submit" disabled={isSearching} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black transition-colors shadow-sm disabled:opacity-50">
                                {isSearching ? <Loader2 size={18} className="animate-spin"/> : 'ค้นหา'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {hasSearched ? 'ผลการค้นหา' : 'ลูกค้ายอดเงินค้างสูงสุด (Top Creditors)'}
                            </span>
                            {!hasSearched && (
                                <button onClick={copyAllPhones} className="text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold bg-white px-2 py-1 rounded border border-blue-200 shadow-sm flex items-center gap-1 transition-colors">
                                    <Megaphone size={12}/> คัดลอกเบอร์โทร
                                </button>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                    <Loader2 size={32} className="animate-spin mb-2 opacity-50" />
                                </div>
                            ) : displayUsers.length > 0 ? (
                                <div className="space-y-1">
                                    {displayUsers.map(user => {
                                        const bal = user.stats?.creditBalance || user.partnerCredit || 0;
                                        const pts = user.stats?.rewardPoints || 0;
                                        return (
                                        <div 
                                            key={user.id} 
                                            onClick={() => handleSelectUser(user)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                                                ${selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex-1 min-w-0 pr-3">
                                                <div className={`font-black text-sm truncate flex items-center gap-2 ${selectedUser?.id === user.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                                    {user.accountName || user.displayName || user.firstName || 'ไม่ระบุชื่อ'}
                                                    {user.rank === 'VIP' && <span className="shrink-0 text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded">VIP</span>}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 font-mono mt-1">ID: {user.customerCode || user.id}</div>
                                            </div>
                                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                                <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                                    ฿{bal.toLocaleString()}
                                                </div>
                                                {pts > 0 && <div className="text-[9px] font-black text-amber-500 flex items-center gap-0.5"><Coins size={10}/> {pts}</div>}
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
                        
                        {/* 💰 Wallet Status Card (Banking Style) */}
                        <div className="bg-slate-800 rounded-2xl shadow-lg border border-slate-700 p-5 lg:p-6 shrink-0 relative overflow-hidden text-white">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                            
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="bg-slate-700 p-2 rounded-xl border border-slate-600"><User size={20} className="text-slate-300" /></div>
                                        <div>
                                            <h2 className="text-sm font-black text-white">{selectedUser.accountName || selectedUser.displayName || 'ลูกค้าทั่วไป'}</h2>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 font-mono mt-0.5">
                                                <span>ID: {selectedUser.customerCode || selectedUser.id}</span>
                                                {selectedUser.phone && (
                                                    <button onClick={() => copyToClipboard(selectedUser.phone)} className="flex items-center gap-1 hover:text-white transition-colors bg-slate-700/50 px-1.5 py-0.5 rounded">
                                                        <Phone size={10}/> {selectedUser.phone} 
                                                        {copiedPhone === selectedUser.phone ? <CheckCircle2 size={10} className="text-emerald-400"/> : <Copy size={10}/>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-6">
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Wallet size={12}/> กระเป๋าเงิน (Wallet)</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">฿{currentWalletBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                        <div className="pb-1">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Coins size={12}/> แต้มสะสม (Points)</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-amber-400 tracking-tight">{currentPointsBalance.toLocaleString('th-TH')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap md:flex-col gap-2 md:w-48 shrink-0">
                                    <button onClick={() => openAdjustmentModal('deposit')} className="flex-1 md:w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95">
                                        <ArrowDownToLine size={14} strokeWidth={3} /> เติมเงิน / คืนยอด
                                    </button>
                                    <button onClick={() => openAdjustmentModal('cash_withdrawal')} className="flex-1 md:w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95">
                                        <Banknote size={14} strokeWidth={3} /> ถอนเป็นเงินสด
                                    </button>
                                    <button onClick={() => openAdjustmentModal('deduct')} className="flex-1 md:w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 border border-slate-600 transition-all active:scale-95">
                                        <ArrowUpFromLine size={14} strokeWidth={3} /> ยึดเงิน / หักยอด
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 📜 Statement Table (Dual-Ledger Style) */}
                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                            <div className="px-5 pt-4 border-b border-slate-200 bg-slate-50/50">
                                <div className="flex items-center gap-6">
                                    <button onClick={() => setActiveTab('wallet')} className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'wallet' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                        <Wallet size={16}/> ประวัติกระเป๋าเงิน (Wallet)
                                    </button>
                                    <button onClick={() => setActiveTab('points')} className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'points' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                        <Coins size={16}/> ประวัติแต้มสะสม (Points)
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
                                                    <th className="px-5 py-3 text-right">จำนวนเงิน (Amount)</th>
                                                    <th className="px-5 py-3 text-right">คงเหลือ (Balance)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {transactions.map(tx => {
                                                    const isPositive = tx.type === 'deposit' || tx.type === 'refund';
                                                    const isCash = tx.type === 'cash_withdrawal';
                                                    return (
                                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isCash ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                                        {isPositive ? <ArrowDownToLine size={14} strokeWidth={2.5}/> : isCash ? <Banknote size={14} strokeWidth={2.5}/> : <ArrowUpFromLine size={14} strokeWidth={2.5}/>}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-black text-xs text-slate-800">{tx.note || (isPositive ? 'คืนเงินเข้าระบบ' : isCash ? 'ถอนเป็นเงินสด' : 'ชำระค่าสินค้า/หักเงิน')}</div>
                                                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                                                            <span className="flex items-center gap-1"><Clock size={10}/> {tx.timestamp ? new Date(tx.timestamp.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span className="font-mono text-slate-500">Ref: {tx.referenceId || tx.transactionId}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right align-top">
                                                                <div className={`font-black text-sm ${isPositive ? 'text-emerald-600' : isCash ? 'text-amber-600' : 'text-slate-800'}`}>
                                                                    {isPositive ? '+' : '-'} {Number(tx.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                                </div>
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
                                                    <th className="px-5 py-3">ที่มา / การใช้งาน (Point Details)</th>
                                                    <th className="px-5 py-3 text-right">จำนวนแต้ม (Points)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {pointTransactions.map(pt => {
                                                    const isEarn = pt.type === 'earn';
                                                    return (
                                                        <tr key={pt.id} className="hover:bg-amber-50/30 transition-colors group">
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isEarn ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                                        {isEarn ? <Star size={14} strokeWidth={2.5}/> : <History size={14} strokeWidth={2.5}/>}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-black text-xs text-slate-800">{pt.note || (isEarn ? 'ได้รับแต้มสะสม' : 'ใช้แต้ม/ถูกดึงคืน')}</div>
                                                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                                                            <span className="flex items-center gap-1"><Clock size={10}/> {pt.timestamp ? new Date(pt.timestamp.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span className="font-mono text-slate-500">Ref: {pt.referenceId || pt.transactionId}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-right align-middle">
                                                                <div className={`font-black text-sm ${isEarn ? 'text-amber-500' : 'text-slate-600'}`}>
                                                                    {isEarn ? '+' : '-'}{Number(pt.points || 0).toLocaleString('th-TH')}
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
                    // 🌍 Global History (Default View when no user selected)
                    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> ความเคลื่อนไหวรวมทั้งระบบ (Basic System History)</h3>
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
                                        const isCash = tx.type === 'cash_withdrawal';
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isCash ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                            {isPositive ? <ArrowDownToLine size={14} strokeWidth={2.5}/> : isCash ? <Banknote size={14} strokeWidth={2.5}/> : <ArrowUpFromLine size={14} strokeWidth={2.5}/>}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-xs text-slate-800">{tx.note || 'ทำรายการกระเป๋าเงิน'}</div>
                                                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                                                <span className="flex items-center gap-1"><Clock size={10}/> {tx.timestamp ? new Date(tx.timestamp.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="font-mono text-slate-500">UID: {tx.uid.substring(0,8)}...</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right align-middle">
                                                    <div className={`font-black text-sm ${isPositive ? 'text-emerald-600' : isCash ? 'text-amber-600' : 'text-slate-800'}`}>
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

            {/* ✨ Modal ปรับปรุงยอดเงิน (Banking Form Style) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200">
                        <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${adjType === 'deposit' ? 'bg-emerald-50' : adjType === 'cash_withdrawal' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                            <h2 className={`text-sm font-black flex items-center gap-2 uppercase tracking-wide ${adjType === 'deposit' ? 'text-emerald-700' : adjType === 'cash_withdrawal' ? 'text-amber-700' : 'text-slate-700'}`}>
                                {adjType === 'deposit' ? <><ArrowDownToLine size={18} strokeWidth={2.5}/> เติมเงิน / คืนยอด (Deposit)</> : adjType === 'cash_withdrawal' ? <><Banknote size={18} strokeWidth={2.5}/> ถอนเป็นเงินสด (Withdrawal)</> : <><ArrowUpFromLine size={18} strokeWidth={2.5}/> หักยอด / ยึดเงิน (Deduct)</>}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-md transition-colors"><X size={18}/></button>
                        </div>
                        
                        <form onSubmit={handleAdjustmentSubmit} className="flex flex-col">
                            <div className="p-5 bg-white flex flex-col gap-4">
                                
                                {/* Info Box */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm"><User size={20} className="text-slate-400"/></div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">บัญชีเป้าหมาย (Account)</div>
                                        <div className="text-sm font-black text-slate-800 mt-0.5">{selectedUser?.accountName || selectedUser?.displayName}</div>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div>
                                    <label className="text-xs font-black text-slate-700 mb-1.5 block">จำนวนเงิน (Amount) <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">฿</span>
                                        <input 
                                            type="number" 
                                            min="1"
                                            step="0.01"
                                            required
                                            value={adjAmount}
                                            onChange={(e) => setAdjAmount(e.target.value)}
                                            className={`w-full pl-9 pr-4 py-3 bg-slate-50 border-2 rounded-xl font-black text-lg outline-none transition-all ${adjType === 'deposit' ? 'border-emerald-200 focus:border-emerald-500 focus:bg-white text-emerald-700' : adjType === 'cash_withdrawal' ? 'border-amber-200 focus:border-amber-500 focus:bg-white text-amber-700' : 'border-slate-200 focus:border-slate-500 focus:bg-white text-slate-800'}`}
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                    {(adjType === 'deduct' || adjType === 'cash_withdrawal') && Number(adjAmount) > currentWalletBalance && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-1.5 flex items-center gap-1"><AlertTriangle size={12}/> ยอดเงินคงเหลือไม่เพียงพอ</p>
                                    )}
                                </div>

                                {/* Note Input */}
                                <div>
                                    <label className="text-xs font-black text-slate-700 mb-1.5 block">รายละเอียด / อ้างอิง (Memo) <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <textarea 
                                            required
                                            value={adjNote}
                                            onChange={(e) => setAdjNote(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[80px]"
                                            placeholder={adjType === 'deposit' ? "ระบุเหตุผลการคืนเงิน เช่น เคลมสินค้า DH-XXX..." : adjType === 'cash_withdrawal' ? "ระบุผู้อนุมัติ/ผู้รับเงิน เช่น ลูกค้ารับเงินสดที่เคาน์เตอร์..." : "ระบุเหตุผลการหักเงิน เช่น ดึงเงินคืนระบบ..."}
                                        ></textarea>
                                    </div>
                                </div>

                            </div>
                            
                            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white text-slate-600 font-black rounded-xl hover:bg-slate-100 transition-colors text-sm border border-slate-200 shadow-sm">
                                    ยกเลิก (Cancel)
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || ((adjType === 'deduct' || adjType === 'cash_withdrawal') && Number(adjAmount) > currentWalletBalance)} 
                                    className={`px-5 py-2.5 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-md text-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${adjType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500' : adjType === 'cash_withdrawal' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} strokeWidth={2.5}/>} 
                                    ยืนยันทำรายการ (Confirm)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}