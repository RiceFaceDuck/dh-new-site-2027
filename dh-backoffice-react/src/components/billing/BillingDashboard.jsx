import React, { useState } from 'react';
import { Plus, AlertTriangle, ArrowLeft, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import GuideModal from '../common/GuideModal';
import { billingService } from '../../firebase/billingService';
import { auth } from '../../firebase/config';

import useBillingOrders from './hooks/useBillingOrders';
import OrderFilterBar from './dashboard/OrderFilterBar';
import OrderListTable from './dashboard/OrderListTable';
import OrderDetailModal from './dashboard/OrderDetailModal';
import ReceiptTemplate from './pos/ReceiptTemplate';

export default function BillingDashboard({ onSwitchView, onResumeDraft, isSelectorMode = false, onCancelSelector }) {
    const {
        orders,
        filteredOrders,
        loading,
        isSearching,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        limitAmount,
        setLimitAmount,
        dateRange,
        setDateRange
    } = useBillingOrders();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('detail'); 
    const [isVoiding, setIsVoiding] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Sync selectedOrder with live updates from Firebase
    React.useEffect(() => {
        if (selectedOrder && orders.length > 0) {
            const liveOrder = orders.find(o => o.id === selectedOrder.id);
            if (liveOrder) {
                // Only update if something relevant changed (simple check on updatedAt or basic deep comparison could be better, but direct object ref change might cause infinite loops if we just setState on any array change. So we do a shallow JSON comparison to be safe)
                if (JSON.stringify(liveOrder) !== JSON.stringify(selectedOrder)) {
                    setSelectedOrder(liveOrder);
                }
            }
        }
    }, [orders, selectedOrder]);

    const totalSales = filteredOrders.reduce((sum, order) => {
        const stat = (order.orderStatus || order.status || '').toLowerCase();
        if (stat === 'cancelled' || stat === 'void') return sum;
        return sum + (Number(order.netTotal) || 0);
    }, 0);

    const handleCloseModal = () => {
        setSelectedOrder(null);
        setActiveTab('detail');
    };

    const executeVoidOrder = async (orderToVoid) => {
        const currentStat = (orderToVoid.orderStatus || orderToVoid.status || '').toLowerCase();
        
        if (currentStat === 'cancelled' || currentStat === 'void') return toast.error('บิลนี้ถูกยกเลิกไปแล้ว');
        if (currentStat === 'approved' || currentStat === 'completed') return toast.error('บิลที่อนุมัติ/เสร็จสิ้นแล้ว ไม่สามารถยกเลิกได้');
        
        const isPaid = currentStat === 'paid' || (orderToVoid.paymentStatus || '').toLowerCase() === 'paid';
        const confirmMsg = isPaid 
            ? `⚠️ ยืนยันการ "ยกเลิก" บิล ${orderToVoid.orderId} ใช่หรือไม่?\n\nระบบจะดำเนินการอัตโนมัติ:\n1. คืนสต็อกสินค้าทั้งหมด\n2. คืนยอดเงินสุทธิเข้า Wallet\n3. หักแต้ม Credit Points คืนจากลูกค้า\n4. ปรับลดยอดขายประจำวัน\n\n* การกระทำนี้ไม่สามารถย้อนกลับได้`
            : `⚠️ ยืนยันการ "ยกเลิก" บิล ${orderToVoid.orderId} ใช่หรือไม่?\n(ระบบจะล้างยอดและสถานะให้เป็นยกเลิก)`;
            
        if (!window.confirm(confirmMsg)) return;

        setIsVoiding(true);
        const toastId = toast.loading('กำลังยกเลิกบิล...');
        try {
            await billingService.updateOrderStatus(orderToVoid.id, 'Cancelled', orderToVoid.orderStatus || orderToVoid.status, auth.currentUser?.uid || 'System');
            toast.success(`ยกเลิกบิล ${orderToVoid.orderId} สำเร็จ!`, { id: toastId });
            if (selectedOrder?.id === orderToVoid.id) handleCloseModal(); 
        } catch (error) {
            toast.error(`เกิดข้อผิดพลาดในการยกเลิกบิล: ${error.message}`, { id: toastId });
        } finally {
            setIsVoiding(false);
        }
    };

    const handleDeleteOrder = async (orderToDel) => {
        const confirmText = window.prompt(`🚨 คำเตือนขั้นสูงสุด: การลบบิลถาวรจะไม่สามารถกู้คืนได้ และประวัติจะหายไปทั้งหมด\n\nหากคุณต้องการลบจริงๆ โปรดพิมพ์คำว่า "DELETE" ด้านล่างนี้:`);
        
        if (confirmText !== "DELETE") {
            toast.error("ยกเลิกการลบถาวร (คุณพิมพ์ข้อความไม่ถูกต้อง)");
            return;
        }

        const toastId = toast.loading('กำลังลบบิลถาวร...');
        try {
            await billingService.deleteOrderPermanently(orderToDel.id, auth.currentUser?.uid);
            toast.success(`ลบบิล ${orderToDel.orderId} ถาวรเรียบร้อยแล้ว`, { id: toastId });
            if (selectedOrder?.id === orderToDel.id) handleCloseModal();
        } catch (error) {
            toast.error(`เกิดข้อผิดพลาดในการลบ: ${error.message}`, { id: toastId });
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[var(--dh-bg-surface)] relative overflow-hidden font-sans transition-colors duration-300">
            <div className="flex flex-col h-full w-full bg-[var(--dh-bg-surface)] overflow-hidden transition-all duration-300">
                
                {/* 🏷️ Header Area (Edge to Edge Design Support) */}
                <div className="dh-header-gradient p-4 sm:p-6 pb-0 relative z-10 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.3)] transition-colors duration-300">
                    <OrderFilterBar 
                        filter={filter} 
                        setFilter={setFilter} 
                        searchQuery={searchQuery} 
                        setSearchQuery={setSearchQuery} 
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        totalSales={totalSales}
                        headerTitle={
                            <div className="flex items-center gap-4 relative z-10">
                                {isSelectorMode ? (
                                    <div className="relative p-3 bg-rose-100 text-rose-600 rounded-md shadow-inner flex items-center justify-center shrink-0 overflow-visible">
                                        <div className="absolute inset-0 rounded-md border-2 border-rose-500 animate-ping opacity-50 duration-1000"></div>
                                        <div className="absolute inset-0 bg-rose-500 rounded-md animate-pulse opacity-20"></div>
                                        <AlertTriangle size={24} strokeWidth={2.5} className="relative z-10 animate-[bounce_2s_infinite]" />
                                    </div>
                                ) : (
                                    <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-white border border-white/20 shrink-0 shadow-sm hidden md:flex">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight leading-none whitespace-nowrap">
                                        {isSelectorMode ? 'เลือกบิลที่ต้องการเคลม/คืน' : 'รายการบิล (Orders)'}
                                    </h1>
                                    <p className="text-[12px] text-slate-300 mt-1.5 font-bold uppercase tracking-wider hidden sm:block">
                                        {isSelectorMode ? 'ค้นหาบิลจากรหัส หรือชื่อลูกค้า เพื่อทำรายการ' : 'จัดการและตรวจสอบบิลการขาย'}
                                    </p>
                                </div>
                            </div>
                        }
                        headerAction={
                            isSelectorMode ? (
                                <button 
                                    onClick={onCancelSelector} 
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-black rounded-md flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-[13px] dh-active-press shrink-0 whitespace-nowrap"
                                >
                                    <ArrowLeft size={18} strokeWidth={3} /> ย้อนกลับ (หน้ารายการเคลม)
                                </button>
                            ) : (
                                <div className="flex gap-2 items-center">
                                    <button 
                                        onClick={() => setShowGuide(true)}
                                        className="px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800/70 text-white border border-slate-700/50 font-black rounded-md flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 text-[13px] shrink-0 whitespace-nowrap"
                                    >
                                        <HelpCircle size={18} strokeWidth={3} /> คู่มือ
                                    </button>
                                    {onSwitchView && (
                                        <button 
                                            onClick={onSwitchView} 
                                            className="px-5 py-2.5 bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] text-white font-black rounded-md flex items-center gap-2 transition-all duration-300 hover:shadow-[0_4px_15px_var(--dh-glow-color)] hover:-translate-y-0.5 active:scale-95 text-[13px] shrink-0 whitespace-nowrap"
                                        >
                                            <Plus size={18} strokeWidth={3} /> สร้างบิลใหม่
                                        </button>
                                    )}
                                </div>
                            )
                        }
                    />
                </div>

                {/* 📊 Data Table Container */}
                <OrderListTable 
                    orders={filteredOrders} 
                    loading={loading} 
                    isSearching={isSearching} 
                    limitAmount={limitAmount} 
                    setLimitAmount={setLimitAmount} 
                    setSelectedOrder={setSelectedOrder} 
                />
            </div>

            <OrderDetailModal 
                selectedOrder={selectedOrder} 
                handleCloseModal={handleCloseModal} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                executeVoidOrder={executeVoidOrder} 
                isVoiding={isVoiding} 
                handleDeleteOrder={handleDeleteOrder} 
                setShowPrintPreview={setShowPrintPreview} 
                onResumeDraft={onResumeDraft} 
            />

            {/* Print Preview Modal */}
            {showPrintPreview && selectedOrder && (
                <ReceiptTemplate 
                    orderData={selectedOrder}
                    onClose={() => setShowPrintPreview(false)}
                />
            )}

            <GuideModal 
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                title="คู่มือรายการบิล (Orders Dashboard)"
                manualText="หน้าจอนี้ใช้สำหรับตรวจสอบรายการบิลทั้งหมดที่ถูกสร้างขึ้นในระบบ ไม่ว่าจะมาจากหน้าร้าน (POS) หรือมาจากการสั่งซื้อล่วงหน้า"
                howTo={[
                    "ค้นหาบิลด้วย 'เลขบิล' หรือ 'ชื่อลูกค้า' ในช่องค้นหา",
                    "สามารถคลิกที่แถวของบิลเพื่อดูรายละเอียด หรือ สั่งพิมพ์ใบเสร็จย้อนหลังได้",
                    "กด 'สร้างบิลใหม่' เพื่อเข้าสู่หน้าระบบขายหน้าร้าน (POS)"
                ]}
                tips="บิลที่เป็นสถานะ 'ฉบับร่าง' (Draft) จะมีปุ่มให้กดทำรายการต่อ (Resume) ได้ทันที!"
                expectedResult="หากกดยกเลิกบิล (Void) ระบบจะทำการคืนสต็อกสินค้าอัตโนมัติ และคืนยอดเงินเครดิตให้ลูกค้าทันที"
            />
        </div>
    );
}