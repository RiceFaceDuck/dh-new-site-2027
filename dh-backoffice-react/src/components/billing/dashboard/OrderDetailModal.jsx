import React from 'react';
import { Receipt, Copy, Ban, Clock, MapPin, Phone, User, CalendarDays } from 'lucide-react';
import OrderSummary from './OrderSummary';
import OrderActions from './OrderActions';

export default function OrderDetailModal(props) {
    const { 
        selectedOrder, 
        activeTab, 
        setShowPrintPreview, 
        onResumeDraft, 
        executeVoidOrder, 
        handleDeleteOrder, 
        isVoiding, 
        handleCloseModal,
        setActiveTab
    } = props;
    if (!selectedOrder) return null;

    const handleCopyId = (e, text) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        const btn = e.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span class="text-emerald-500 flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> คัดลอกแล้ว!</span>`;
        setTimeout(() => { btn.innerHTML = originalHtml; }, 1500);
    };

    const orderStat = (selectedOrder.orderStatus || selectedOrder.status || '').toLowerCase();
    const paymentStat = (selectedOrder.paymentStatus || '').toLowerCase();
    const isCancelled = orderStat === 'cancelled' || orderStat === 'void';
    const isPaid = paymentStat === 'paid' || orderStat === 'paid';
    
    const customerName = selectedOrder.customer?.accountName || selectedOrder.customer?.firstName || 'ลูกค้าทั่วไป (Walk-in)';
    const customerPhone = selectedOrder.customer?.phone || selectedOrder.walkInPhone || '-';
    
    // Formatting date safely
    let formattedDate = 'N/A';
    if (selectedOrder.createdAt) {
        if (typeof selectedOrder.createdAt.toDate === 'function') {
            formattedDate = selectedOrder.createdAt.toDate().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
        } else if (selectedOrder.createdAt.seconds) {
            formattedDate = new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
        } else {
            formattedDate = new Date(selectedOrder.createdAt).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
            <div className="bg-[var(--dh-bg-base)] w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-sm shadow-2xl overflow-hidden flex flex-col relative text-[var(--dh-text-main)] border border-[var(--dh-border)] animate-in fade-in zoom-in-95 duration-200">
                
                <OrderActions {...props} />
                
                <div className="flex-1 overflow-hidden p-2 sm:p-3 bg-[var(--dh-bg-base)] relative flex flex-col">
                    {activeTab === 'detail' && (
                        <div className="w-full h-full flex flex-col gap-2">
                            
                            {/* Horizontal Info Bar */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0">
                                
                                {/* 1. Invoice Info */}
                                <div className="bg-[var(--dh-bg-surface)] rounded-sm p-3 border border-[var(--dh-border)] shadow-sm flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-[var(--dh-bg-base)] rounded border border-[var(--dh-border)] flex items-center justify-center shrink-0">
                                            <img src="/dh-logo.png" alt="DH" className="w-6 h-6 object-contain" onError={(e) => e.target.style.display='none'} />
                                        </div>
                                        <div>
                                            <h1 className="text-sm font-black text-[var(--dh-text-main)] leading-none">ใบเสร็จรับเงิน</h1>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 font-mono text-xs font-bold text-[var(--dh-text-muted)]">
                                                    <Receipt size={12}/> {selectedOrder.orderId}
                                                </div>
                                                <button onClick={(e) => handleCopyId(e, selectedOrder.orderId)} className="text-[10px] text-blue-500 hover:text-blue-600 font-bold flex items-center gap-0.5">
                                                    <Copy size={10}/> คัดลอก
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-[var(--dh-border)] pt-2 mt-auto">
                                        <div className="flex items-center gap-1 text-[var(--dh-text-muted)] font-bold">
                                            <CalendarDays size={12}/> {formattedDate.split(' ')[0]}
                                        </div>
                                        {isCancelled ? (
                                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-black">ยกเลิกแล้ว</span>
                                        ) : isPaid ? (
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black">ชำระเงินแล้ว</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-black flex items-center gap-1"><Clock size={10}/> รอชำระเงิน</span>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Customer Info */}
                                <div className="bg-[var(--dh-bg-surface)] rounded-sm p-3 border border-[var(--dh-border)] shadow-sm flex flex-col gap-1.5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <h3 className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-wider flex items-center gap-1">
                                        <User size={12}/> ข้อมูลลูกค้า
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="font-black text-sm text-[var(--dh-text-main)] truncate" title={customerName}>
                                            {customerName}
                                        </div>
                                        {selectedOrder.customer?.role && (
                                            <span className="text-[9px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                                {selectedOrder.customer.role}
                                            </span>
                                        )}
                                        {selectedOrder.customer?.tier && (
                                            <span className="text-[9px] font-black uppercase bg-purple-500/10 text-purple-600 border border-purple-500/20 px-1.5 py-0.5 rounded">
                                                {selectedOrder.customer.tier}
                                            </span>
                                        )}
                                        {selectedOrder.customer?.dealerTier && (
                                            <span className="text-[9px] font-black uppercase bg-orange-500/10 text-orange-600 border border-orange-500/20 px-1.5 py-0.5 rounded">
                                                {selectedOrder.customer.dealerTier}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-[var(--dh-text-muted)] font-bold">
                                        <Phone size={12}/> {customerPhone}
                                    </div>
                                    {selectedOrder.shippingAddress && (
                                        <div className="text-[11px] text-[var(--dh-text-muted)] leading-tight line-clamp-2 mt-1 border-t border-[var(--dh-border)] pt-1.5" title={`${selectedOrder.shippingAddress.address} ${selectedOrder.shippingAddress.subDistrict} ${selectedOrder.shippingAddress.district} ${selectedOrder.shippingAddress.province} ${selectedOrder.shippingAddress.zipCode}`}>
                                            <span className="font-bold text-blue-500">ที่อยู่:</span> {selectedOrder.shippingAddress.address} {selectedOrder.shippingAddress.subDistrict} {selectedOrder.shippingAddress.district} {selectedOrder.shippingAddress.province} {selectedOrder.shippingAddress.zipCode}
                                        </div>
                                    )}
                                </div>

                                {/* 3. Fulfillment Info */}
                                <div className="bg-[var(--dh-bg-surface)] rounded-sm p-3 border border-[var(--dh-border)] shadow-sm flex flex-col gap-1.5">
                                    <h3 className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-wider flex items-center gap-1">
                                        <MapPin size={12}/> การจัดส่ง
                                    </h3>
                                    <div className="font-bold text-xs text-[var(--dh-text-main)]">
                                        {selectedOrder.fulfillmentType === 'Delivery' ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-blue-500">ส่งพัสดุเอกชน ({selectedOrder.shippingMethod || selectedOrder.courier || 'N/A'})</span>
                                                {selectedOrder.trackingNumber && (
                                                    <span className="font-mono text-[10px] bg-[var(--dh-bg-base)] px-1.5 py-0.5 rounded border border-[var(--dh-border)] mt-1 w-max">
                                                        Track: {selectedOrder.trackingNumber}
                                                    </span>
                                                )}
                                            </div>
                                        ) : 'รับหน้าร้าน (Store Pickup)'}
                                    </div>
                                    {selectedOrder.billNote && (
                                        <div className="mt-auto pt-1.5 border-t border-[var(--dh-border)]">
                                            <div className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 italic truncate" title={selectedOrder.billNote}>
                                                หมายเหตุ: {selectedOrder.billNote}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Full Width Order Items Summary */}
                            <div className="flex-1 min-h-0 w-full h-full flex flex-col">
                                <OrderSummary 
                                    selectedOrder={selectedOrder} 
                                    isCancelled={isCancelled} 
                                    paymentStat={paymentStat} 
                                    orderStat={orderStat} 
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="max-w-3xl mx-auto bg-[var(--dh-bg-surface)] rounded-sm p-6 border border-[var(--dh-border)] text-center text-[var(--dh-text-muted)] shadow-sm">
                            <div className="w-16 h-16 bg-[var(--dh-bg-base)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner border border-[var(--dh-border)]">
                                <Clock size={24} className="opacity-50" />
                            </div>
                            <h2 className="text-base font-black text-[var(--dh-text-main)] mb-1.5">ประวัติการอัปเดตบิล</h2>
                            <p className="text-xs font-bold">อยู่ระหว่างการพัฒนา UI ย่อย (สามารถดูข้อมูลประวัติได้ในเวอร์ชั่นเต็ม)</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

