import React from 'react';
import { FileEdit, Receipt } from 'lucide-react';

export default function PaymentActions({
    handleCheckout, isProcessing, isCashShort, hasOutOfStock
}) {
    return (
        <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-sm border border-emerald-100">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Secure Checkout & Auto-Sync
            </div>
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleCheckout('Draft')} disabled={isProcessing} className={`py-2.5 bg-[var(--dh-secondary)] hover:bg-[var(--dh-secondary-hover)] text-white rounded-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border-none text-xs ${hasOutOfStock ? 'bg-red-600 hover:bg-red-700' : ''}`}>
                    <FileEdit size={14}/> {hasOutOfStock ? 'Draft (สต๊อก)' : 'บันทึกร่าง'}
                </button>
                <button onClick={() => handleCheckout('OnAccount')} disabled={isProcessing} className="py-2.5 bg-[var(--dh-secondary)] hover:bg-[var(--dh-secondary-hover)] text-white rounded-sm font-semibold transition-colors flex items-center justify-center gap-1.5 border-none text-xs">
                    เครดิต (On Acc)
                </button>
                <button onClick={() => handleCheckout('Paid')} disabled={isProcessing || isCashShort} title="สามารถกดปุ่มลัด Ctrl + Enter เพื่อยืนยันได้"
                    className={`col-span-2 py-2.5 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2
                        ${isCashShort ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-[var(--dh-success)] hover:bg-[var(--dh-success-hover)] text-white shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 border-none'}
                    `}
                >
                    {isProcessing ? <span className="animate-spin text-sm">⏳</span> : <Receipt size={16}/>} 
                    {isProcessing ? 'กำลังบันทึก...' : 'รับชำระเงิน (Paid)'}
                </button>
            </div>
        </div>
    );
}
