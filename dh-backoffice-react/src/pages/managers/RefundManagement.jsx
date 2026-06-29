import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, Building2, HelpCircle, Wallet } from 'lucide-react';
import { auth, db } from '../../firebase/config';
import { todoService } from '../../firebase/todoService';
import { collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { driveService } from '../../firebase/driveService';
import GuideModal from '../../components/common/GuideModal';

import { useWalletManagement } from './wallet/hooks/useWalletManagement';
import WalletDashboardStats from './wallet/WalletDashboardStats';
import PendingWithdrawals from './wallet/PendingWithdrawals';
import CustomerSearchList from './wallet/CustomerSearchList';
import WalletDetailPanel from './wallet/WalletDetailPanel';
import WalletModals from './wallet/WalletModals';
import { creditCoreService } from '../../firebase/creditCoreService';

export default function RefundManagement() {
    const navigate = useNavigate();
    
    // We reuse useWalletManagement since it handles all wallet logic, 
    // but the UI focus is on Refunds.
    const {
        stats, walletHoldersCount, isDashboardLoading,
        pendingRequests, isLoadingRequests,
        searchTerm, setSearchTerm, isSearching, hasSearched, setHasSearched, searchResults, defaultUsers,
        selectedUser, setSelectedUser, activeTab, setActiveTab,
        transactions, pointTransactions, isLoadingTx, handleSearch, loadTransactions
    } = useWalletManagement(navigate);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adjType, setAdjType] = useState('deposit'); 
    const [adjAmount, setAdjAmount] = useState('');
    const [adjNote, setAdjNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState('APPROVE');
    const [actionNote, setActionNote] = useState('');
    const [slipFile, setSlipFile] = useState(null);
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    const [notification, setNotification] = useState(null);
    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleMockData = async () => {
        try {
            const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'todos'), {
                taskType: 'WALLET_WITHDRAWAL',
                status: 'PENDING',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                userId: 'mock-user-123',
                customer: { uid: 'mock-user-123' },
                customerCode: 'CUS-MOCK',
                phoneNumber: '0812345678',
                displayName: 'ลูกค้าจำลอง (Test)',
                withdrawalDetails: {
                    amount: 500,
                    bankName: 'LINE',
                    accountName: 'ติดต่อผ่าน LINE OA',
                    accountNumber: 'LINE_CONTACT'
                }
            });
            showNotification('สร้างคำร้องจำลองสำเร็จ!', 'success');
        } catch (error) {
            console.error("Mock error:", error);
            showNotification('เกิดข้อผิดพลาดในการจำลองข้อมูล', 'error');
        }
    };

    const handleClearMock = async () => {
        try {
            const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'todos'), where('customerCode', '==', 'CUS-MOCK'));
            const snap = await getDocs(q);
            const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'todos', d.id)));
            await Promise.all(deletePromises);
            showNotification('ล้างข้อมูลจำลองเรียบร้อยแล้ว!', 'success');
        } catch (error) {
            console.error("Clear mock error:", error);
            showNotification('เกิดข้อผิดพลาดในการล้างข้อมูล', 'error');
        }
    };

    // Filter pending requests to show only LINE refund requests (or all, depending on migration)
    // We assume any withdrawal to 'LINE' is a refund via LINE request
    const refundRequests = pendingRequests.filter(req => 
        req.withdrawalDetails?.bankName === 'LINE' || 
        req.withdrawalDetails?.accountNumber === 'LINE_CONTACT'
    );

    const handleProcessAction = async (e) => {
        e.preventDefault();
        if (!selectedTask) return;
        
        if (actionType === 'REJECT' && !actionNote.trim()) {
            showNotification("กรุณาระบุเหตุผลที่ไม่อนุมัติ", "error");
            return;
        }

        setIsActionSubmitting(true);
        try {
            let slipUrl = null;
            if (actionType === 'APPROVE' && slipFile) {
                slipUrl = await driveService.uploadSlip(slipFile);
                if (!slipUrl) {
                    throw new Error("ไม่สามารถอัปโหลดสลิปได้ โปรดลองอีกครั้ง");
                }
            }

            const adminInfo = {
                uid: auth.currentUser?.uid || 'Admin',
                displayName: auth.currentUser?.displayName || 'Manager'
            };
            const extraData = { note: actionNote, slipUrl };
            await todoService.processWalletWithdrawal(selectedTask.id, actionType, adminInfo, extraData);
            
            showNotification(actionType === 'APPROVE' ? "✅ อนุมัติการคืนเงินเรียบร้อยแล้ว" : "✅ ปฏิเสธและคืนยอดกลับกระเป๋าแล้ว");
            setIsActionModalOpen(false);
            setActionNote('');
            setSlipFile(null);
        } catch (error) {
            console.error("Action process error:", error);
            showNotification(error.message || "เกิดข้อผิดพลาดในการประมวลผล", "error");
        } finally {
            setIsActionSubmitting(false);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        loadTransactions(user.id);
        setActiveTab('wallet');
    };

    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(adjAmount);
        
        if (!amount || amount <= 0 || isNaN(amount)) return showNotification('กรุณาระบุจำนวนเงินให้ถูกต้อง', 'error');
        if (!adjNote.trim()) return showNotification('กรุณาระบุหมายเหตุ', 'error');

        setIsSubmitting(true);
        try {
            await creditCoreService.adjustUserCredit(
                selectedUser.id, amount, 
                adjType === 'deposit' ? 'deposit' : 'deduct', 
                `[Refund] ${adjNote}`, 
                auth.currentUser?.uid || 'Admin'
            );

            showNotification(`✅ ทำรายการสำเร็จ`);
            setIsModalOpen(false);
            setAdjAmount(''); setAdjNote('');
            
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

    const currentWalletBalance = selectedUser ? (selectedUser.walletBalance || 0) : 0;
    const currentPointsBalance = selectedUser ? (selectedUser.creditPoints || 0) : 0;
    const displayUsers = hasSearched ? searchResults : defaultUsers;

    return (
        <div className="flex flex-col h-full bg-slate-50 p-3 lg:p-4 overflow-hidden font-sans relative">
            
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 font-bold animate-in slide-in-from-right fade-in duration-300 ${
                    notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/managers')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest mb-1.5 border border-emerald-100">
                            <Building2 size={12} /> Refund Operations
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">ศูนย์จัดการรับเรื่องคืนเงิน (Refund Management)</h1>
                    </div>
                    
                    {/* Total Liability Stat */}
                    <div className="hidden md:flex ml-8 items-center gap-3 bg-rose-50/50 px-4 py-2 rounded-xl border border-rose-100">
                        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">ยอดเงินฝากค้างในระบบทั้งหมด</p>
                            <p className="text-2xl font-black text-rose-600 font-mono leading-none mt-1 tracking-tight">
                                -฿{stats?.totalBalance ? stats.totalBalance.toLocaleString() : '0.00'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 ml-auto">
                        <button 
                            onClick={() => setShowGuide(true)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all shadow-sm border border-slate-200"
                        >
                            <HelpCircle size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Pending Requests Section */}
            <PendingWithdrawals 
                pendingRequests={refundRequests}
                onActionClick={(task, type) => {
                    setSelectedTask(task);
                    setActionType(type);
                    setIsActionModalOpen(true);
                }}
            />

            {/* Main Layout: 2 Columns */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-3 lg:gap-4 mt-3 lg:mt-4">
                
                {/* LEFT COLUMN: Customer Search & List */}
                <CustomerSearchList 
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    handleSearch={handleSearch} isSearching={isSearching}
                    hasSearched={hasSearched} displayUsers={displayUsers}
                    selectedUser={selectedUser} handleSelectUser={handleSelectUser}
                    copyAllPhones={copyAllPhones}
                />

                {/* RIGHT COLUMN: Wallet Status & Statement */}
                <WalletDetailPanel 
                    selectedUser={selectedUser}
                    currentWalletBalance={currentWalletBalance}
                    currentPointsBalance={currentPointsBalance}
                    activeTab={activeTab} setActiveTab={setActiveTab}
                    transactions={transactions} pointTransactions={pointTransactions}
                    isLoadingTx={isLoadingTx}
                    onOpenAdjustModal={(type) => { setAdjType(type); setIsModalOpen(true); }}
                />
            </div>

            {/* Modals */}
            <WalletModals 
                isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}
                adjType={adjType} setAdjType={setAdjType}
                adjAmount={adjAmount} setAdjAmount={setAdjAmount}
                adjNote={adjNote} setAdjNote={setAdjNote}
                isSubmitting={isSubmitting} handleAdjustmentSubmit={handleAdjustmentSubmit}
                selectedUser={selectedUser} currentWalletBalance={currentWalletBalance}
                
                isActionModalOpen={isActionModalOpen} setIsActionModalOpen={setIsActionModalOpen}
                selectedTask={selectedTask} actionType={actionType}
                actionNote={actionNote} setActionNote={setActionNote}
                isActionSubmitting={isActionSubmitting} handleProcessAction={handleProcessAction}
                slipFile={slipFile} setSlipFile={setSlipFile}
            />

            <GuideModal 
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title="คู่มือจัดการรับเรื่องคืนเงิน (Refund Management)"
                config={{
                    description: "ระบบนี้มีไว้สำหรับตรวจสอบและจัดการคำร้องขอคืนเงินที่มาจากลูกค้าผ่านช่องทาง LINE โดยตรง",
                    howTo: [
                        "เมื่อลูกค้ากดขอคืนเงินจากระบบและแจ้งผ่าน LINE คำร้องจะปรากฏที่นี่",
                        "ตรวจสอบแชท LINE ว่าลูกค้าส่งเลขบัญชีเพื่อรับเงินโอนหรือยัง",
                        "หากโอนแล้ว ให้กดปุ่ม <b>'อนุมัติ'</b> (Approve) เพื่อตัดยอดเงินรอโอนออกจากระบบ",
                        "หากปฏิเสธการโอนเงิน (เช่น ลูกค้าเปลี่ยนใจ) ให้กด <b>'ปฏิเสธ'</b> เพื่อคืนยอดเงินกลับเข้า Wallet ลูกค้าตามเดิม"
                    ],
                    tips: [
                        "ใช้ช่องค้นหาด้านซ้ายเพื่อค้นหาชื่อ/เบอร์โทรลูกค้า แล้วปรับลดยอดเงินโดยตรงได้ทันที"
                    ],
                    expectedResults: "รายการทุกอย่างจะถูกบันทึกลง Statement ลูกค้าอย่างชัดเจน และสามารถตรวจสอบย้อนหลังผ่านเมนูประวัติได้เสมอ"
                }}
                extraFooter={
                    <>
                        <button 
                            onClick={handleClearMock}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-sm font-bold rounded-xl transition-all shadow-sm border border-rose-200"
                        >
                            🗑️ ล้างคำร้องจำลอง
                        </button>
                        <button 
                            onClick={handleMockData}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 text-sm font-bold rounded-xl transition-all shadow-sm border border-indigo-200"
                        >
                            🛠️ จำลองข้อมูล
                        </button>
                    </>
                }
            />
        </div>
    );
}
