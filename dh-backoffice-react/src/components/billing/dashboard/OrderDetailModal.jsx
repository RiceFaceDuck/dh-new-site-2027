import React from 'react';
import { Receipt, Ban, Copy, Trash2, Eye, History, X, Loader2, FileEdit, Printer, Clock } from 'lucide-react';

export default function OrderDetailModal({ 
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
    if (!selectedOrder) return null;

    const handleCopyId = (e, text) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        const btn = e.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span class="text-green-500 flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> คัดลอกแล้ว!</span>`;
        setTimeout(() => { btn.innerHTML = originalHtml; }, 1500);
    };

    const orderStat = (selectedOrder.orderStatus || selectedOrder.status || '').toLowerCase();
    const isApprovedOrCompleted = orderStat === 'approved' || orderStat === 'completed';
    const isCancelled = orderStat === 'cancelled' || orderStat === 'void';
    const paymentStat = (selectedOrder.paymentStatus || '').toLowerCase();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[var(--dh-bg-surface)] dh-glass rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col relative text-[var(--dh-text-main)] border border-[var(--dh-glass-border)] animate-in fade-in zoom-in-95 duration-300 dh-hover-lift">
                <div className="p-5 border-b border-[var(--dh-border)] flex justify-between items-center bg-[var(--dh-bg-base)]/80 shrink-0 relative z-10 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <h3 className="font-black text-xl flex items-center gap-2 dh-text-glow">
                            <Receipt size={22} className="text-[var(--dh-accent)]"/> 
                            รายละเอียดบิล
                        </h3>
                        <button 
                            onClick={(e) => handleCopyId(e, selectedOrder.orderId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--dh-bg-surface)] hover:bg-[var(--dh-accent-light)] text-[var(--dh-text-main)] rounded-lg text-xs font-bold font-mono transition-colors border border-[var(--dh-border)] shadow-sm dh-active-press"
                            title="คัดลอกรหัสบิล"
                        >
                            <Copy size={12}/> {selectedOrder.orderId}
                        </button>
                        
                        {isCancelled && (
                            <span className="ml-2 text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-1 rounded-md shadow-sm dh-glow">
                                <Ban size={12} className="inline mr-1 -mt-0.5"/>
                                VOIDED
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="flex bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-xl p-1 gap-1 shadow-inner dh-inner-shadow">
                            {!isCancelled && !isApprovedOrCompleted && (
                                <button 
                                    onClick={() => executeVoidOrder(selectedOrder)} 
                                    disabled={isVoiding} 
                                    className="flex items-center gap-1.5 font-black px-4 py-2 rounded-lg transition-all text-sm active:scale-95 text-orange-500 hover:text-white hover:bg-orange-500 dh-active-press"
                                >
                                    {isVoiding ? <Loader2 size={14} className="animate-spin"/> : <Ban size={14} strokeWidth={2.5}/>} 
                                    <span className="hidden sm:inline">ยกเลิกบิลนี้</span>
                                </button>
                            )}

                            {(isCancelled || orderStat === 'draft' || orderStat === 'pending') && (
                                <button 
                                    onClick={() => handleDeleteOrder(selectedOrder)}
                                    className="flex items-center gap-1.5 font-black px-4 py-2 rounded-lg transition-all text-sm active:scale-95 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 dh-active-press"
                                    title="ลบบิลออกจากฐานข้อมูลอย่างถาวร"
                                >
                                    <Trash2 size={14} strokeWidth={2.5}/> 
                                    <span className="hidden sm:inline">ลบถาวร!</span>
                                </button>
                            )}
                        </div>

                        <div className="flex bg-[var(--dh-bg-base)] rounded-xl p-1 gap-1 shadow-inner dh-inner-shadow border border-[var(--dh-border)]">
                            <button 
                                onClick={() => setActiveTab('detail')}
                                className={`flex items-center gap-1.5 font-black px-4 py-2 rounded-lg transition-all text-sm ${activeTab === 'detail' ? 'bg-[var(--dh-bg-surface)] text-[var(--dh-accent)] shadow-sm' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)]'}`}
                            >
                                <Eye size={14} strokeWidth={2.5}/> รายละเอียด
                            </button>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center gap-1.5 font-black px-4 py-2 rounded-lg transition-all text-sm ${activeTab === 'history' ? 'bg-[var(--dh-bg-surface)] text-[var(--dh-accent)] shadow-sm' : 'text-[var(--dh-text-muted)] hover:text-[var(--dh-text-main)]'}`}
                            >
                                <History size={14} strokeWidth={2.5}/> ประวัติ
                            </button>
                        </div>

                        <button 
                            onClick={handleCloseModal} 
                            className="text-[var(--dh-text-muted)] hover:text-rose-500 p-2.5 hover:bg-rose-500/10 rounded-xl transition-all dh-active-press"
                        >
                            <X size={22} strokeWidth={2.5}/>
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--dh-bg-base)] p-4 md:p-8">
                    {activeTab === 'detail' && (
                        <div className="bg-[var(--dh-bg-surface)] max-w-3xl mx-auto rounded-xl p-6 md:p-10 border border-[var(--dh-border)] shadow-sm relative">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--dh-border)]">
                                <div className="flex items-center gap-4">
                                    <img src="/dh-logo.png" alt="DH" className="h-12 object-contain" onError={(e) => e.target.style.display='none'} />
                                    <div>
                                        <h1 className="text-lg font-black text-[var(--dh-text-main)] leading-tight">บริษัท ดีเอช โน๊ตบุ๊ค จำกัด</h1>
                                        <p className="text-[11px] text-[var(--dh-text-muted)] font-bold mt-0.5">dhnotebook.com | Line: @dhnotebook | โทร. 087-5153122</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="border-2 border-[var(--dh-text-main)] rounded-lg px-4 py-1.5">
                                        <h2 className="text-xs font-black tracking-widest text-[var(--dh-text-main)] uppercase">รายการออเดอร์</h2>
                                    </div>
                                    <div className="flex gap-2">
                                        {!isCancelled && !isApprovedOrCompleted && orderStat !== 'paid' && paymentStat !== 'paid' && (
                                            <button 
                                                onClick={() => { handleCloseModal(); if (onResumeDraft) onResumeDraft(selectedOrder); }} 
                                                className="flex items-center gap-1.5 text-white font-black px-3 py-1.5 bg-[var(--dh-accent)] hover:bg-[var(--dh-accent-hover)] rounded-md shadow-sm transition-all active:scale-95 text-[11px] dh-active-press dh-glow"
                                            >
                                                <FileEdit size={12} strokeWidth={2.5}/> แก้ไขร่าง
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setShowPrintPreview(true)} 
                                            className="flex items-center gap-1.5 text-[var(--dh-text-main)] hover:text-blue-600 font-black px-3 py-1.5 bg-transparent hover:bg-blue-500/10 border border-[var(--dh-border)] hover:border-blue-400 rounded-md transition-all text-[11px] group dh-active-press"
                                        >
                                            <Printer size={12} className="text-[var(--dh-text-muted)] group-hover:text-blue-500"/> พิมพ์บิล
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isCancelled ? (
                                <div className="text-center text-rose-600 font-black text-sm mb-6 border-2 border-rose-500/30 bg-rose-500/10 py-2 rounded-xl tracking-wide flex items-center justify-center gap-2 dh-glow">
                                    <Ban size={18}/> *** บิลนี้ถูกยกเลิกไปแล้ว (VOIDED) ***
                                </div>
                            ) : paymentStat !== 'paid' && orderStat !== 'paid' && (
                                <div className="text-center text-orange-600 font-black text-sm mb-6 border-2 border-orange-500/30 bg-orange-500/10 py-2 rounded-xl tracking-wide dh-glow">
                                    *** บิลฉบับร่าง (DRAFT) - ยังไม่ได้ชำระเงิน ***
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="font-bold text-[14px] text-[var(--dh-text-main)] border-b border-[var(--dh-border)] pb-2 mb-3">รายการสินค้า</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm p-3 bg-[var(--dh-bg-base)] rounded-lg border border-[var(--dh-border)] shadow-sm">
                                            <div>
                                                <div className="font-bold">{item.name}</div>
                                                <div className="text-xs text-[var(--dh-text-muted)]">SKU: {item.sku} | จำนวน: {item.qty}</div>
                                            </div>
                                            <div className="font-black text-[var(--dh-accent)]">
                                                ฿{(item.price * item.qty).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4 border-t border-[var(--dh-border)]">
                                <div className="text-right space-y-1">
                                    <div className="text-sm text-[var(--dh-text-muted)] font-bold">ยอดสุทธิ: <span className="text-[var(--dh-text-main)] text-xl ml-2">฿{(selectedOrder.netTotal || 0).toLocaleString()}</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="max-w-3xl mx-auto bg-[var(--dh-bg-surface)] rounded-xl p-6 border border-[var(--dh-border)] text-center text-[var(--dh-text-muted)]">
                            <Clock size={40} className="mx-auto mb-3 opacity-50" />
                            <p>ประวัติการอัปเดตบิลอยู่ระหว่างการพัฒนา UI ย่อย (ดูได้ในเวอร์ชั่นเต็ม)</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
