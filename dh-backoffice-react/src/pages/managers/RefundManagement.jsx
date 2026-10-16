import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, Building2, HelpCircle } from 'lucide-react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { getUsersPath } from 'dh-shared/src/firebase/pathUtils';
import { creditCoreService } from '../../firebase/creditCoreService';
import { executeCustomerRefund } from '../../firebase/customerRefundService';
import { todoService } from '../../firebase/todoService';
import { driveService } from '../../firebase/driveService';
import GuideModal from '../../components/common/GuideModal';

import { useWalletManagement, updateCachedUserBalance } from './wallet/hooks/useWalletManagement';
import WalletDashboardStats from './wallet/WalletDashboardStats';
import PendingWithdrawals from './wallet/PendingWithdrawals';
import CustomerSearchList from './wallet/CustomerSearchList';
import WalletDetailPanel from './wallet/WalletDetailPanel';
import WalletModals from './wallet/WalletModals';

export default function RefundManagement() {
    const navigate = useNavigate();
    
    // Core state and Firebase logic via extracted hook
    const {
        stats, walletHoldersCount, isDashboardLoading,
        pendingRequests,
        searchTerm, setSearchTerm, isSearching, hasSearched, searchResults, defaultUsers,
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
            await todoService.createMockWithdrawal();
            showNotification('สร้างคำร้องจำลองสำเร็จ!', 'success');
        } catch (error) {
            console.error("Mock error:", error);
            showNotification('เกิดข้อผิดพลาดในการจำลองข้อมูล', 'error');
        }
    };

    const handleClearMock = async () => {
        try {
            await todoService.clearMockWithdrawals();
            showNotification('ล้างข้อมูลจำลองเรียบร้อยแล้ว!', 'success');
        } catch (error) {
            console.error("Clear mock error:", error);
            showNotification('เกิดข้อผิดพลาดในการล้างข้อมูล', 'error');
        }
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

    const [currentRefId, setCurrentRefId] = useState('');

    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(adjAmount);
        
        if (!amount || amount <= 0 || isNaN(amount)) return showNotification('กรุณาระบุจำนวนเงินให้ถูกต้อง', 'error');
        if (!adjNote.trim()) return showNotification('กรุณาระบุรายละเอียด / หมายเหตุ', 'error');

        setIsSubmitting(true);
        try {
            if (adjType === 'cash_withdrawal') {
                // 🚀 [DRAWER STANDARDIZATION] รวมศูนย์การจ่ายคืนเงินสดหน้าร้านให้ได้มาตรฐานเดียวกับ Customer Drawer Refund
                // บันทึก audit, system_logs, ซิงก์ Google Sheets บัญชี และเคลียร์ Todos task อัตโนมัติ
                await executeCustomerRefund({
                    customerId: selectedUser.id,
                    amount: amount,
                    refundMethod: 'CASH',
                    note: adjNote,
                    adminInfo: {
                        uid: auth.currentUser?.uid || 'Admin',
                        displayName: auth.currentUser?.displayName || 'Manager'
                    }
                });
                showNotification(`✅ จ่ายคืนเป็นเงินสดให้ลูกค้าสำเร็จ (บันทึก Audit และส่งฝ่ายบัญชีเรียบร้อย)`);
            } else {
                // ✅ [ACCOUNTING CORRECTION] ปรับปรุงแก้ไขยอดเงินกรณีระบุข้อผิดพลาดทางบัญชี
                await creditCoreService.adjustUserWallet(
                    selectedUser.id, amount, 
                    adjType === 'deposit' ? 'adjust_add' : 'adjust_deduct', 
                    `[แก้ไขข้อผิดพลาดทางบัญชี] ${adjNote}`, 
                    auth.currentUser?.uid || 'Admin',
                    currentRefId || crypto.randomUUID()
                );
                showNotification(`✅ แก้ไขยอดเงินกระเป๋าเงินสำเร็จ`);
            }

            setIsModalOpen(false);
            setAdjAmount(''); setAdjNote('');
            
            // ดึงข้อมูลลูกค้าล่าสุดจาก Firestore เพื่ออัปเดต state และ cache ให้ตรง 100%
            try {
                const userRef = doc(db, getUsersPath(), selectedUser.id);
                const uSnap = await getDoc(userRef);
                if (uSnap.exists()) {
                    const freshUser = { id: uSnap.id, ...uSnap.data() };
                    setSelectedUser(freshUser);
                    updateCachedUserBalance(selectedUser.id, freshUser.walletBalance || 0);
                }
            } catch (fetchErr) {
                console.warn("⚠️ Failed to re-fetch fresh user doc:", fetchErr);
            }

            await loadTransactions(selectedUser.id);
        } catch (error) {
            console.error("Adjustment/Refund error:", error);
            showNotification(`❌ ${error.message || 'เกิดข้อผิดพลาดในการทำรายการ'}`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentWalletBalance = selectedUser ? (selectedUser.walletBalance || 0) : 0;
    const currentPointsBalance = selectedUser ? (selectedUser.creditPoints || 0) : 0;
    const displayUsers = hasSearched ? searchResults : defaultUsers;

    return (
        <div className="flex flex-col h-full bg-slate-50 p-2 lg:p-2.5 overflow-hidden font-sans relative">
            
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
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-[0.1rem] shadow-xs border border-slate-200 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/managers')} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest mb-1 border border-indigo-100">
                            <Building2 size={12} /> Financial Operations
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">ศูนย์จัดการกระเป๋าเงินและรับเรื่องคืนเงิน (Wallet & Refund Operations)</h1>
                    </div>
                    <button 
                        onClick={() => setShowGuide(true)}
                        className="ml-2 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all shadow-xs border border-slate-200"
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
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-2 mt-2">
                
                {/* LEFT COLUMN: Customer Search & List */}
                <CustomerSearchList 
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    handleSearch={handleSearch} isSearching={isSearching}
                    hasSearched={hasSearched} displayUsers={displayUsers}
                    selectedUser={selectedUser} handleSelectUser={handleSelectUser}
                />

                {/* RIGHT COLUMN: Wallet Status & Statement */}
                <WalletDetailPanel 
                    selectedUser={selectedUser}
                    currentWalletBalance={currentWalletBalance}
                    currentPointsBalance={currentPointsBalance}
                    activeTab={activeTab} setActiveTab={setActiveTab}
                    transactions={transactions} pointTransactions={pointTransactions}
                    isLoadingTx={isLoadingTx}
                    onOpenAdjustModal={(type) => { setAdjType(type); setCurrentRefId(crypto.randomUUID()); setIsModalOpen(true); }}
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
                title="คู่มือจัดการกระเป๋าเงินและรับเรื่องคืนเงิน (Wallet & Refund Operations)"
                manualText="ระบบนี้มีไว้สำหรับตรวจสอบและอนุมัติยอดเงินเข้า-ออกกระเป๋าเงินของลูกค้า ทั้งยอดที่เกิดจากการเคลม, การเติมเงิน, หรือการคืนเงินและถอนเงิน"
                howTo={[
                    "1. ดูรายการที่รออนุมัติ (Pending) ด้านบน",
                    "2. กดปุ่ม อนุมัติ (Approve) หรือ ปฏิเสธ (Reject) พร้อมใส่เหตุผล",
                    "3. หากต้องการดึงดูประวัติลูกค้าเฉพาะคน ให้พิมพ์ค้นหาชื่อ/เบอร์โทร ทางด้านซ้าย",
                    "4. สามารถเพิ่มหรือลดยอดเงิน/แต้ม ได้โดยตรงที่ปุ่มการจัดการในหน้ารายละเอียดลูกค้า"
                ]}
                tips="ปุ่ม 'คัดลอกเบอร์โทรลูกค้าทั้งหมด' จะช่วยให้ทีมเซลล์นำเบอร์ไปบรอดแคสต์ (Broadcast) แจ้งสิทธิพิเศษผ่าน SMS/Line ได้ทันที"
                expectedResult="ทุกครั้งที่มีการอนุมัติ/ปรับยอด ระบบจะบันทึกประวัติไว้ใน Statement ของลูกค้าอย่างโปร่งใส และตรวจสอบย้อนหลังได้เสมอ"
                extraFooter={
                    <>
                        <button 
                            onClick={handleClearMock}
                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-sm font-bold rounded-xl transition-all shadow-xs border border-rose-200"
                        >
                            🗑️ ล้างคำร้องจำลอง
                        </button>
                        <button 
                            onClick={handleMockData}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 text-sm font-bold rounded-xl transition-all shadow-xs border border-indigo-200"
                        >
                            🛠️ จำลองข้อมูล
                        </button>
                    </>
                }
            />
        </div>
    );
}
