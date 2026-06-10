import React from 'react';
import { Ban, Trash2, Eye, History, FileEdit, Printer, X, Loader2 } from 'lucide-react';

export default function OrderActions({ 
    selectedOrder, 
    handleCloseModal, 
    activeTab, 
    setActiveTab, 
    executeVoidOrder, 
    isVoiding, 
    handleDeleteOrder, 
    setShowPrintPreview, 
    onResumeDraft 
}) {
    const orderStat = (selectedOrder.orderStatus || selectedOrder.status || '').toLowerCase();
    const paymentStat = (selectedOrder.paymentStatus || '').toLowerCase();
    const isApprovedOrCompleted = orderStat === 'approved' || orderStat === 'completed';
    const isCancelled = orderStat === 'cancelled' || orderStat === 'void';
    const isPaid = paymentStat === 'paid' || orderStat === 'paid';

    return (
        <div className="flex justify-between items-center bg-[var(--dh-bg-base)]/90 backdrop-blur-md px-3 py-2 border-b border-[var(--dh-border)] sticky top-0 z-20 shadow-sm flex-wrap gap-2">
            {/* Left Actions */}
            <div className="flex items-center gap-1.5">
                <div className="flex bg-[var(--dh-bg-surface)] p-0.5 rounded-sm border border-[var(--dh-border)] shadow-inner">
                    <button 
                        onClick={() => setActiveTab('detail')}
                        className={`flex items-center gap-1 font-bold px-3 py-1.5 rounded-sm transition-all text-xs sm:text-sm ${activeTab === 'detail' ? 'bg-[var(--dh-accent)] text-white shadow-sm dh-glow' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-base)]'}`}
                    >
                        <Eye size={15} strokeWidth={2.5}/> <span className="hidden sm:inline">รายละเอียดบิล</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-1 font-bold px-3 py-1.5 rounded-sm transition-all text-xs sm:text-sm ${activeTab === 'history' ? 'bg-[var(--dh-accent)] text-white shadow-sm dh-glow' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)] hover:bg-[var(--dh-bg-base)]'}`}
                    >
                        <History size={15} strokeWidth={2.5}/> <span className="hidden sm:inline">ประวัติ</span>
                    </button>
                </div>

                <div className="h-8 w-px bg-[var(--dh-border)] mx-1 hidden md:block"></div>

                <button 
                    onClick={() => setShowPrintPreview(true)} 
                    className="flex items-center gap-1.5 text-[var(--dh-text-main)] hover:text-blue-600 font-bold px-3 py-1.5 bg-[var(--dh-bg-surface)] hover:bg-blue-50 border border-[var(--dh-border)] hover:border-blue-400 rounded-sm transition-all text-xs sm:text-sm shadow-sm active:scale-95 dh-active-press group"
                >
                    <Printer size={15} className="text-[var(--dh-text-muted)] group-hover:text-blue-500 transition-colors"/> 
                    <span className="hidden sm:inline">พิมพ์บิล</span>
                </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5">
                {!isCancelled && !isApprovedOrCompleted && !isPaid && (
                    <button 
                        onClick={() => { handleCloseModal(); if (onResumeDraft) onResumeDraft(selectedOrder); }} 
                        className="flex items-center gap-1.5 text-white font-bold px-3 py-1.5 bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] rounded-sm shadow-sm transition-all active:scale-95 text-xs sm:text-sm dh-active-press"
                    >
                        <FileEdit size={15} strokeWidth={2.5}/> <span className="hidden sm:inline">แก้ไขบิล</span>
                    </button>
                )}

                <div className="flex bg-[var(--dh-bg-surface)] rounded-sm p-0.5 border border-[var(--dh-border)] shadow-sm">
                    {!isCancelled && !isApprovedOrCompleted && (
                        <button 
                            onClick={() => executeVoidOrder(selectedOrder)} 
                            disabled={isVoiding} 
                            className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-sm transition-all text-xs sm:text-sm text-orange-500 hover:text-white hover:bg-orange-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isVoiding ? <Loader2 size={15} className="animate-spin"/> : <Ban size={15} strokeWidth={2.5}/>} 
                            <span className="hidden lg:inline">ยกเลิกบิล</span>
                        </button>
                    )}

                    {(isCancelled || orderStat === 'draft' || orderStat === 'pending') && (
                        <button 
                            onClick={() => handleDeleteOrder(selectedOrder)}
                            className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-sm transition-all text-xs sm:text-sm text-rose-600 hover:text-white hover:bg-rose-600 active:scale-95"
                            title="ลบบิลออกจากฐานข้อมูลอย่างถาวร"
                        >
                            <Trash2 size={15} strokeWidth={2.5}/> 
                            <span className="hidden lg:inline">ลบถาวร!</span>
                        </button>
                    )}
                </div>

                <button 
                    onClick={handleCloseModal} 
                    className="flex items-center justify-center text-[var(--dh-text-muted)] hover:text-rose-500 w-8 h-8 hover:bg-rose-500/10 rounded-sm transition-all border border-transparent hover:border-rose-500/20 active:scale-95 ml-1"
                >
                    <X size={18} strokeWidth={2.5}/>
                </button>
            </div>
        </div>
    );
}
