import React from 'react';
import { User, Phone, CheckCircle2, Copy, Wallet, Coins, ArrowDownToLine, Banknote, ArrowUpFromLine } from 'lucide-react';

export default function WalletStatusCard({ 
  selectedUser, 
  currentWalletBalance, 
  currentPointsBalance, 
  onOpenAdjustModal, 
  copiedPhone, 
  copyToClipboard 
}) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-lg border border-indigo-900/50 p-5 lg:p-6 shrink-0 relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 relative z-10">
            <div>
                <div className="flex items-center gap-3 mb-5">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10"><User size={20} className="text-indigo-100" /></div>
                    <div>
                        <h2 className="text-sm font-black text-white">{selectedUser.accountName || selectedUser.displayName || 'ลูกค้าทั่วไป'}</h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-200/70 font-mono mt-0.5">
                            <span>ID: {selectedUser.customerCode || selectedUser.id}</span>
                            {(selectedUser.phone || selectedUser.phoneNumber) && (
                                <button onClick={() => copyToClipboard(selectedUser.phone || selectedUser.phoneNumber)} className="flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                    <Phone size={10}/> {selectedUser.phone || selectedUser.phoneNumber} 
                                    {copiedPhone === (selectedUser.phone || selectedUser.phoneNumber) ? <CheckCircle2 size={10} className="text-emerald-400"/> : <Copy size={10}/>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-end gap-6">
                    <div>
                        <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 flex items-center gap-1"><Wallet size={12}/> กระเป๋าเงิน (Wallet)</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">฿{currentWalletBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <div className="pb-1">
                        <h3 className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest mb-1 flex items-center gap-1"><Coins size={12}/> แต้ม (Points)</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-amber-400/80 tracking-tight">{currentPointsBalance.toLocaleString('th-TH')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-wrap md:flex-col gap-2 md:w-48 shrink-0">
                <button onClick={() => onOpenAdjustModal('deposit')} className="flex-1 md:w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95">
                    <ArrowDownToLine size={14} strokeWidth={3} /> เติมเงินเข้ากระเป๋า
                </button>
                <button onClick={() => onOpenAdjustModal('cash_withdrawal')} className="flex-1 md:w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all active:scale-95">
                    <Banknote size={14} strokeWidth={3} /> จ่ายคืนเป็นเงินสด
                </button>
                <button onClick={() => onOpenAdjustModal('deduct')} className="flex-1 md:w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 border border-white/10 backdrop-blur-sm transition-all active:scale-95">
                    <ArrowUpFromLine size={14} strokeWidth={3} /> ยึดเงิน / หักยอด
                </button>
            </div>
        </div>
    </div>
  );
}
