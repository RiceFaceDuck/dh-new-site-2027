import { FileEdit, Receipt } from 'lucide-react';

export default function PaymentActions({
    handleCheckout, isProcessing, isCashShort, hasOutOfStock
}) {
    return (
        <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xs border border-emerald-100">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Secure Checkout & Auto-Sync
            </div>
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleCheckout('Draft')} disabled={isProcessing} className={`py-2.5 bg-(--dh-secondary) hover:bg-(--dh-secondary-hover) text-white rounded-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border-none text-xs ${hasOutOfStock ? 'bg-red-600 hover:bg-red-700' : ''}`}>
                    <FileEdit size={14}/> {hasOutOfStock ? 'Draft (สต๊อก)' : 'บันทึกร่าง'}
                </button>
                <button onClick={() => handleCheckout('OnAccount')} disabled={isProcessing} className="py-2.5 bg-(--dh-secondary) hover:bg-(--dh-secondary-hover) text-white rounded-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border-none text-xs">
                    เครดิต (On Acc)
                </button>
                <button onClick={() => handleCheckout('Paid')} disabled={isProcessing || isCashShort} title="สามารถกดปุ่มลัด Ctrl + Enter เพื่อยืนยันได้"
                    className={`col-span-2 py-2.5 rounded-xs font-bold text-sm transition-all flex items-center justify-center gap-2
                        ${isCashShort ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-(--dh-success) hover:bg-(--dh-success-hover) text-white shadow-xs hover:shadow-sm active:scale-[0.98] disabled:opacity-70 border-none'}
                    `}
                >
                    {isProcessing ? <span className="animate-spin text-sm">⏳</span> : <Receipt size={16}/>} 
                    {isProcessing ? 'กำลังบันทึก...' : 'รับชำระเงิน (Paid)'}
                </button>
            </div>
        </div>
    );
}
