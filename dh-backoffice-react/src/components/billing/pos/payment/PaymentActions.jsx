import React from 'react';
import { FileEdit, Receipt } from 'lucide-react';

export default function PaymentActions({
    handleCheckout, isProcessing, isCashShort, hasOutOfStock
}) {
    return (
        <div className="grid grid-cols-4 gap-2 mt-auto">
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
    );
}
