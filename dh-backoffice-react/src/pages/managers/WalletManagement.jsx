import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, Building2, HelpCircle } from 'lucide-react';
import { auth } from '../../firebase/config';
import { creditCoreService } from '../../firebase/creditCoreService';
import { todoService } from '../../firebase/todoService';
import GuideModal from '../../components/common/GuideModal';

import { useWalletManagement } from './wallet/hooks/useWalletManagement';
import WalletDashboardStats from './wallet/WalletDashboardStats';
import PendingWithdrawals from './wallet/PendingWithdrawals';
import CustomerSearchList from './wallet/CustomerSearchList';
import WalletDetailPanel from './wallet/WalletDetailPanel';
import WalletModals from './wallet/WalletModals';

export default function WalletManagement() {
    const navigate = useNavigate();
    
    // Use extracted hook for all core state and Firebase logic
    const {
        stats, walletHoldersCount, isDashboardLoading,
        pendingRequests, isLoadingRequests,
        searchTerm, setSearchTerm, isSearching, hasSearched, setHasSearched, searchResults, defaultUsers,
        selectedUser, setSelectedUser, activeTab, setActiveTab,
        transactions, pointTransactions, isLoadingTx, handleSearch, loadTransactions
    } = useWalletManagement(navigate);

    // Modal States (Kept here to pass down to Modals and Detail Panel easily)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adjType, setAdjType] = useState('deposit'); 
    const [adjAmount, setAdjAmount] = useState('');
    const [adjNote, setAdjNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState('APPROVE');
    const [actionNote, setActionNote] = useState('');
    const [isActionSubmitting, setIsActionSubmitting] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    const [notification, setNotification] = useState(null);
    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4000);
    };

    // Action Handlers
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
            const extraData = { note: actionNote };
            await todoService.processWalletWithdrawal(selectedTask.id, actionType, adminInfo, extraData);
            
            showNotification(actionType === 'APPROVE' ? "✅ อนุมัติการถอนเงินเรียบร้อยแล้ว" : "✅ ปฏิเสธการถอนเงินและคืนยอดเรียบร้อย");
            setIsActionModalOpen(false);
            setActionNote('');
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
                `[Wallet] ${adjNote}`, 
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
            
            {/* Notification Toast */}
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
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest mb-1.5 border border-indigo-100">
                            <Building2 size={12} /> Financial Operations
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">ศูนย์จัดการกระเป๋าเงินลูกค้า (Wallet Management)</h1>
                    </div>
                    <button 
                        onClick={() => setShowGuide(true)}
                        className="ml-2 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all shadow-sm border border-slate-200"
                    >
                        <HelpCircle size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Top Dashboard Stats */}
            <WalletDashboardStats 
                isDashboardLoading={isDashboardLoading}
                walletHoldersCount={walletHoldersCount}
                stats={stats}
            />

            {/* Pending Requests Section */}
            <PendingWithdrawals 
                pendingRequests={pendingRequests}
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
            />

            <GuideModal 
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title="คู่มือจัดการกระเป๋าเงิน (Wallet Management)"
                manualText="ระบบนี้มีไว้สำหรับตรวจสอบและอนุมัติยอดเงินเข้า-ออกกระเป๋าเงินของลูกค้า ทั้งยอดที่เกิดจากการเคลม, การเติมเงิน, หรือการถอนเงิน"
                howTo={[
                    "1. ดูรายการที่รออนุมัติ (Pending) ด้านบน",
                    "2. กดปุ่ม อนุมัติ (Approve) หรือ ปฏิเสธ (Reject) พร้อมใส่เหตุผล",
                    "3. หากต้องการดึงดูประวัติลูกค้าเฉพาะคน ให้พิมพ์ค้นหาชื่อ/เบอร์โทร ทางด้านซ้าย",
                    "4. สามารถเพิ่มหรือลดยอดเงิน/แต้ม ได้โดยตรงที่ปุ่มการจัดการในหน้ารายละเอียดลูกค้า"
                ]}
                tips="ปุ่ม 'คัดลอกเบอร์โทรลูกค้าทั้งหมด' จะช่วยให้ทีมเซลล์นำเบอร์ไปบรอดแคสต์ (Broadcast) แจ้งสิทธิพิเศษผ่าน SMS/Line ได้ทันที"
                expectedResult="ทุกครั้งที่มีการอนุมัติ/ปรับยอด ระบบจะบันทึกประวัติไว้ใน Statement ของลูกค้าอย่างโปร่งใส และตรวจสอบย้อนหลังได้เสมอ"
            />
        </div>
    );
}