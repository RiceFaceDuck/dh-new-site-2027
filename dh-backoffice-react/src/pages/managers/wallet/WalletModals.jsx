import React from 'react';
import { X, ArrowDownToLine, ArrowUpFromLine, Banknote, FileText, Loader2, Save } from 'lucide-react';

export default function WalletModals({
    isModalOpen, setIsModalOpen, adjType, setAdjType, adjAmount, setAdjAmount, adjNote, setAdjNote,
    isSubmitting, handleAdjustmentSubmit, selectedUser, currentWalletBalance,
    
    isActionModalOpen, setIsActionModalOpen, selectedTask, actionType, actionNote, setActionNote,
    isActionSubmitting, handleProcessAction
}) {
    return (
        <>
            {/* ✨ Modal: Manual Adjust */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                        <div className={`p-6 text-white relative ${adjType === 'deposit' ? 'bg-emerald-600' : adjType === 'cash_withdrawal' ? 'bg-amber-500' : 'bg-slate-800'}`}>
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {adjType === 'deposit' ? <ArrowDownToLine className="w-6 h-6" /> : adjType === 'cash_withdrawal' ? <Banknote className="w-6 h-6" /> : <ArrowUpFromLine className="w-6 h-6" />}
                                {adjType === 'deposit' ? 'เพิ่มเงิน Wallet' : adjType === 'cash_withdrawal' ? 'จ่ายคืนเป็นเงินสด' : 'หักเงิน Wallet'}
                            </h2>
                            <p className="text-white/80 text-sm mt-1 truncate pr-8">บัญชี: {selectedUser.displayName || selectedUser.accountName}</p>
                        </div>

                        <form onSubmit={handleAdjustmentSubmit} className="flex flex-col">
                            <div className="p-6 bg-white flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-700 mb-1.5 block">จำนวนเงิน (บาท) <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">฿</span>
                                        <input 
                                            type="number" step="0.01" min="0.01"
                                            max={(adjType === 'deduct' || adjType === 'cash_withdrawal') ? currentWalletBalance : undefined}
                                            value={adjAmount}
                                            onChange={e => setAdjAmount(e.target.value)}
                                            required
                                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border-2 rounded-xl font-black text-lg outline-none transition-all ${adjType === 'deposit' ? 'border-emerald-200 focus:border-emerald-500 focus:bg-white text-emerald-700' : adjType === 'cash_withdrawal' ? 'border-amber-200 focus:border-amber-500 focus:bg-white text-amber-700' : 'border-slate-200 focus:border-slate-500 focus:bg-white text-slate-800'}`}
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                    {(adjType === 'deduct' || adjType === 'cash_withdrawal') && (
                                        <div className="flex justify-between items-center mt-2 px-1">
                                            <span className="text-xs text-slate-500 font-medium">ยอดเงินที่ทำรายการได้</span>
                                            <span className="text-xs font-bold text-slate-700 font-mono">฿ {currentWalletBalance.toLocaleString('th-TH')}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="text-xs font-black text-slate-700 mb-1.5 block">รายละเอียด / อ้างอิง (Memo) <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <textarea 
                                            required
                                            value={adjNote}
                                            onChange={e => setAdjNote(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all min-h-[80px]"
                                            placeholder={adjType === 'deposit' ? "เช่น คืนเงินจากออเดอร์ยกเลิก..." : adjType === 'cash_withdrawal' ? "เช่น ลูกค้ารับเงินสดที่เคาน์เตอร์โดย นาย..." : "เช่น ดึงเงินคืนระบบ..."}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white text-slate-600 font-black rounded-xl hover:bg-slate-100 transition-colors text-sm border border-slate-200 shadow-sm">ยกเลิก</button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || ((adjType === 'deduct' || adjType === 'cash_withdrawal') && Number(adjAmount) > currentWalletBalance)} 
                                    className={`px-5 py-2.5 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-md text-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${adjType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500' : adjType === 'cash_withdrawal' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} strokeWidth={2.5}/>} 
                                    ยืนยันทำรายการ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Process Withdrawal */}
            {isActionModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                        <div className={`p-6 text-white relative ${actionType === 'APPROVE' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                            <button onClick={() => setIsActionModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {actionType === 'APPROVE' ? 'ยืนยันการโอนเงินคืน' : 'ปฏิเสธการถอนเงิน'}
                            </h2>
                            <p className="text-white/80 text-sm mt-1 pr-8 truncate">ยอด: ฿{Number(selectedTask.withdrawalDetails?.amount||0).toLocaleString('th-TH')}</p>
                        </div>
                        <form onSubmit={handleProcessAction} className="flex flex-col">
                            <div className="p-6 bg-white flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-700 mb-1.5 block">หมายเหตุ {actionType === 'REJECT' && <span className="text-rose-500">*</span>}</label>
                                    <textarea 
                                        required={actionType === 'REJECT'}
                                        value={actionNote}
                                        onChange={e => setActionNote(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800 outline-none focus:border-indigo-500 transition-all min-h-[80px]"
                                        placeholder={actionType === 'APPROVE' ? "บันทึกการโอนเงิน (ไม่บังคับ)" : "เหตุผลที่ปฏิเสธ (บังคับ)"}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setIsActionModalOpen(false)} className="px-5 py-2.5 bg-white text-slate-600 font-black rounded-xl hover:bg-slate-100 transition-colors text-sm border border-slate-200 shadow-sm">ยกเลิก</button>
                                <button 
                                    type="submit" 
                                    disabled={isActionSubmitting} 
                                    className={`px-5 py-2.5 text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-md text-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                                >
                                    {isActionSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} strokeWidth={2.5}/>} 
                                    ยืนยัน
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
