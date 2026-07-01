import React, { useState } from 'react';
import { Receipt, Copy, Ban, Clock, MapPin, Phone, User, CalendarDays, Loader2, CheckCircle, Package } from 'lucide-react';
import OrderSummary from './OrderSummary';
import OrderActions from './OrderActions';
import { billingStatusTransaction } from '../../../firebase/billingStatusTransaction';
import { auth } from '../../../firebase/config';
import toast from 'react-hot-toast';

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

    const [trackingInput, setTrackingInput] = useState(selectedOrder.trackingNumber || '');
    const [courierInput, setCourierInput] = useState(selectedOrder.shippingMethod || selectedOrder.courier || '');
    const [isUpdatingShipping, setIsUpdatingShipping] = useState(false);

    const handleMarkAsShipped = async () => {
        if (!trackingInput.trim() || !courierInput.trim()) {
            toast.error('กรุณากรอกบริษัทขนส่งและเลขพัสดุให้ครบถ้วน');
            return;
        }
        setIsUpdatingShipping(true);
        try {
            await billingStatusTransaction.markOrderAsShipped(selectedOrder.id, trackingInput, courierInput, auth.currentUser?.uid);
            toast.success('แจ้งจัดส่งสำเร็จ!');
            handleCloseModal(); // ปิด Modal หลังจากอัปเดตสำเร็จ
        } catch (error) {
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
        }
        setIsUpdatingShipping(false);
    };

    const handleMarkAsCompleted = async () => {
        setIsUpdatingShipping(true);
        try {
            await billingStatusTransaction.markOrderAsCompleted(selectedOrder.id, auth.currentUser?.uid);
            toast.success('ส่งมอบสินค้าให้ลูกค้าเรียบร้อย!');
            handleCloseModal();
        } catch (error) {
            toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
        }
        setIsUpdatingShipping(false);
    };

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
                                        ) : orderStat === 'completed' ? (
                                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] font-black">เสร็จสิ้น</span>
                                        ) : orderStat === 'approved' ? (
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black">อนุมัติ / หักสต็อกแล้ว</span>
                                        ) : isPaid ? (
                                            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 border border-teal-500/20 text-[10px] font-black">ชำระเงินแล้ว</span>
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
                                        {(() => {
                                            const shippingCost = Number(selectedOrder.shippingFee || selectedOrder.shippingCost || selectedOrder.totals?.shipping || 0);
                                            const isDelivery = selectedOrder.shippingMethod === 'standard' || selectedOrder.fulfillmentType === 'Delivery' || (!selectedOrder.shippingMethod && !selectedOrder.fulfillmentType && shippingCost > 0);
                                            return isDelivery && selectedOrder.shippingAddress && (
                                                <div className="text-[11px] text-[var(--dh-text-muted)] leading-tight line-clamp-2 mt-1 border-t border-[var(--dh-border)] pt-1.5" title={`${selectedOrder.shippingAddress.address} ${selectedOrder.shippingAddress.subDistrict || ''} ${selectedOrder.shippingAddress.district || ''} ${selectedOrder.shippingAddress.province || ''} ${selectedOrder.shippingAddress.zipCode || ''}`}>
                                                    <span className="font-bold text-blue-500">ที่อยู่:</span> {selectedOrder.shippingAddress.address} {selectedOrder.shippingAddress.subDistrict} {selectedOrder.shippingAddress.district} {selectedOrder.shippingAddress.province} {selectedOrder.shippingAddress.zipCode}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* 3. Fulfillment Info */}
                                    <div className="bg-[var(--dh-bg-surface)] rounded-sm p-3 border border-[var(--dh-border)] shadow-sm flex flex-col gap-1.5">
                                        <h3 className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-wider flex items-center gap-1">
                                            <MapPin size={12}/> การจัดส่ง
                                        </h3>
                                        <div className="font-bold text-xs text-[var(--dh-text-main)]">
                                            {(() => {
                                                const shippingCost = Number(selectedOrder.shippingFee || selectedOrder.shippingCost || selectedOrder.totals?.shipping || 0);
                                                const isDelivery = selectedOrder.shippingMethod === 'standard' || selectedOrder.fulfillmentType === 'Delivery' || (!selectedOrder.shippingMethod && !selectedOrder.fulfillmentType && shippingCost > 0);
                                                
                                                return isDelivery ? (
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <span className="text-blue-500">ส่งพัสดุเอกชน ({selectedOrder.shippingMethod || selectedOrder.courier || 'N/A'})</span>
                                                    {selectedOrder.trackingNumber ? (
                                                        <span className="font-mono text-[10px] bg-[var(--dh-bg-base)] px-1.5 py-0.5 rounded border border-[var(--dh-border)] mt-1 w-max">
                                                            Track: {selectedOrder.trackingNumber}
                                                        </span>
                                                    ) : (isPaid || orderStat === 'approved') && orderStat !== 'completed' && orderStat !== 'shipped' && !isCancelled ? (
                                                        <div className="mt-2 pt-2 border-t border-[var(--dh-border)] w-full">
                                                            <p className="text-[10px] font-bold text-[var(--dh-text-muted)] mb-1">แจ้งเลขพัสดุ:</p>
                                                            <div className="flex flex-col gap-1.5">
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="บริษัทขนส่ง" 
                                                                    value={courierInput}
                                                                    onChange={(e) => setCourierInput(e.target.value)}
                                                                    className="text-xs px-2 py-1 bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-sm focus:outline-none focus:border-blue-500 w-full"
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="เลขพัสดุ (Tracking No.)" 
                                                                    value={trackingInput}
                                                                    onChange={(e) => setTrackingInput(e.target.value)}
                                                                    className="text-xs px-2 py-1 bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-sm focus:outline-none focus:border-blue-500 w-full font-mono"
                                                                />
                                                                <button 
                                                                    onClick={handleMarkAsShipped}
                                                                    disabled={isUpdatingShipping}
                                                                    className="mt-1 w-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1.5 rounded-sm font-bold text-xs transition-colors disabled:opacity-50"
                                                                >
                                                                    {isUpdatingShipping ? <Loader2 size={12} className="animate-spin" /> : <Package size={12} />}
                                                                    ยืนยันการจัดส่ง
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1 w-full">
                                                    <span>รับหน้าร้าน (Store Pickup)</span>
                                                    {selectedOrder.shippingAddress && (
                                                        <div className="text-[10px] text-[var(--dh-text-muted)] font-normal mt-1 leading-relaxed border-t border-[var(--dh-border)] pt-1.5">
                                                            <span className="font-bold text-blue-500 block mb-0.5">ที่อยู่สาขา:</span>
                                                            {selectedOrder.shippingAddress.address} {selectedOrder.shippingAddress.subDistrict || ''} {selectedOrder.shippingAddress.district || ''} {selectedOrder.shippingAddress.province || ''} {selectedOrder.shippingAddress.zipCode || ''}
                                                        </div>
                                                    )}
                                                {(isPaid || orderStat === 'approved') && orderStat !== 'completed' && orderStat !== 'shipped' && !isCancelled && (
                                                    <button 
                                                        onClick={handleMarkAsCompleted}
                                                        disabled={isUpdatingShipping}
                                                        className="mt-2 w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded-sm font-bold text-xs transition-colors disabled:opacity-50"
                                                    >
                                                        {isUpdatingShipping ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                        มอบสินค้าให้ลูกค้าแล้ว
                                                    </button>
                                                )}
                                            </div>
                                        ); })()}
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

