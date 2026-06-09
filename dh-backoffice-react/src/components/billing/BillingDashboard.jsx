import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { billingService } from '../../firebase/billingService';
import { auth } from '../../firebase/config';

import useBillingOrders from './hooks/useBillingOrders';
import OrderFilterBar from './dashboard/OrderFilterBar';
import OrderListTable from './dashboard/OrderListTable';
import OrderDetailModal from './dashboard/OrderDetailModal';

export default function BillingDashboard({ onSwitchView, onResumeDraft }) {
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
        
        if (currentStat === 'cancelled' || currentStat === 'void') return alert('บิลนี้ถูกยกเลิกไปแล้ว');
        if (currentStat === 'approved' || currentStat === 'completed') return alert('บิลที่อนุมัติ/เสร็จสิ้นแล้ว ไม่สามารถยกเลิกได้');
        
        const isPaid = currentStat === 'paid' || (orderToVoid.paymentStatus || '').toLowerCase() === 'paid';
        const confirmMsg = isPaid 
            ? `⚠️ ยืนยันการ "ยกเลิก" บิล ${orderToVoid.orderId} ใช่หรือไม่?\n\nระบบจะดำเนินการอัตโนมัติ:\n1. คืนสต็อกสินค้าทั้งหมด\n2. คืนยอดเงินสุทธิเข้า Wallet\n3. หักแต้ม Credit Points คืนจากลูกค้า\n4. ปรับลดยอดขายประจำวัน\n\n* การกระทำนี้ไม่สามารถย้อนกลับได้`
            : `⚠️ ยืนยันการ "ยกเลิก" บิล ${orderToVoid.orderId} ใช่หรือไม่?\n(ระบบจะล้างยอดและสถานะให้เป็นยกเลิก)`;
            
        if (!window.confirm(confirmMsg)) return;

        setIsVoiding(true);
        try {
            await billingService.updateOrderStatus(orderToVoid.id, 'Cancelled', orderToVoid.orderStatus || orderToVoid.status, auth.currentUser?.uid || 'System');
            alert(`✅ ยกเลิกบิล ${orderToVoid.orderId} สำเร็จ!`);
            if (selectedOrder?.id === orderToVoid.id) handleCloseModal(); 
        } catch (error) {
            alert(`❌ เกิดข้อผิดพลาดในการยกเลิกบิล: ${error.message}`);
        } finally {
            setIsVoiding(false);
        }
    };

    const handleDeleteOrder = async (orderToDel) => {
        const confirmText = window.prompt(`🚨 คำเตือนขั้นสูงสุด: การลบบิลถาวรจะไม่สามารถกู้คืนได้ และประวัติจะหายไปทั้งหมด\n\nหากคุณต้องการลบจริงๆ โปรดพิมพ์คำว่า "DELETE" ด้านล่างนี้:`);
        
        if (confirmText !== "DELETE") {
            alert("❌ ยกเลิกการลบถาวร (คุณพิมพ์ข้อความไม่ถูกต้อง)");
            return;
        }

        try {
            await billingService.deleteOrderPermanently(orderToDel.id, auth.currentUser?.uid);
            alert(`✅ ลบบิล ${orderToDel.orderId} ออกจากระบบถาวรเรียบร้อยแล้ว`);
            if (selectedOrder?.id === orderToDel.id) handleCloseModal();
        } catch (error) {
            alert(`❌ เกิดข้อผิดพลาดในการลบ: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[var(--dh-bg-surface)] relative overflow-hidden font-sans transition-colors duration-300">
            <div className="flex flex-col h-full w-full bg-[var(--dh-bg-surface)] overflow-hidden transition-all duration-300">
                
                {/* 🏷️ Header Area (Edge to Edge Design Support) */}
                <div className="p-4 sm:p-6 pb-0 relative z-10 bg-[var(--dh-glass-bg)] dh-glass">
                    <OrderFilterBar 
                        filter={filter} 
                        setFilter={setFilter} 
                        searchQuery={searchQuery} 
                        setSearchQuery={setSearchQuery} 
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        totalSales={totalSales}
                        headerTitle={
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[var(--dh-accent-light)] text-[var(--dh-accent)] rounded-md shadow-inner dh-inner-shadow dh-hover-lift hidden md:block">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>
                                </div>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-black text-[var(--dh-text-main)] tracking-tight leading-none dh-text-glow whitespace-nowrap">รายการบิล (Orders)</h1>
                                    <p className="text-[12px] text-[var(--dh-text-muted)] mt-1.5 font-bold uppercase tracking-wider hidden sm:block">จัดการและตรวจสอบบิลการขาย</p>
                                </div>
                            </div>
                        }
                        headerAction={
                            <button 
                                onClick={onSwitchView} 
                                className="px-5 py-2.5 bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] text-white font-black rounded-md flex items-center gap-2 transition-all duration-300 hover:shadow-[0_4px_15px_var(--dh-glow-color)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-[13px] dh-active-press shrink-0 whitespace-nowrap"
                            >
                                <Plus size={18} strokeWidth={3} /> สร้างบิลใหม่
                            </button>
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
        </div>
    );
}