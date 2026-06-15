import React, { useState } from 'react';
import { User, Phone, CheckCircle2, Copy, Wallet, Coins, ArrowDownToLine, Banknote, ArrowUpFromLine, Clock, History, Star, Loader2 } from 'lucide-react';

export default function WalletDetailPanel({ 
    selectedUser, currentWalletBalance, currentPointsBalance,
    activeTab, setActiveTab, transactions, pointTransactions, isLoadingTx,
    onOpenAdjustModal
}) {
    const [copiedPhone, setCopiedPhone] = useState(null);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedPhone(text);
        setTimeout(() => setCopiedPhone(null), 2000);
    };

    if (!selectedUser) return null;

    return (
        <div className="flex-1 flex flex-col gap-3 lg:gap-4 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Wallet Status Card */}
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

            {/* Statement Table */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                <div className="px-5 pt-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setActiveTab('wallet')} className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'wallet' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <Wallet size={16}/> ประวัติกระเป๋าเงิน
                        </button>
                        <button onClick={() => setActiveTab('points')} className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 ${activeTab === 'points' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <Coins size={16}/> ประวัติแต้ม
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoadingTx ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Loader2 size={32} className="animate-spin mb-2 opacity-50" />
                            <span className="font-bold text-xs">กำลังเรียกข้อมูลบัญชี...</span>
                        </div>
                    ) : activeTab === 'wallet' ? (
                        transactions.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-white sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 shadow-sm">
                                    <tr>
                                        <th className="px-5 py-3">รายละเอียด (Description)</th>
                                        <th className="px-5 py-3 text-right">จำนวนเงิน</th>
                                        <th className="px-5 py-3 text-right">คงเหลือ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map(tx => {
                                        const isPositive = tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'WITHDRAWAL_REJECTED';
                                        const isCash = tx.type === 'cash_withdrawal' || tx.type === 'WITHDRAWAL_COMPLETED' || tx.type === 'WITHDRAWAL_REQUEST';
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isCash ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                            {isPositive ? <ArrowDownToLine size={14} strokeWidth={2.5}/> : isCash ? <Banknote size={14} strokeWidth={2.5}/> : <ArrowUpFromLine size={14} strokeWidth={2.5}/>}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-xs text-slate-800">{tx.note || tx.type}</div>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                                                <span className="flex items-center gap-1"><Clock size={10}/> {tx.timestamp ? new Date(tx.timestamp.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="font-mono text-slate-500">Ref: {tx.referenceId || tx.transactionId}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right align-top">
                                                    <div className={`font-black text-sm ${isPositive ? 'text-emerald-600' : isCash ? 'text-amber-600' : 'text-rose-600'}`}>
                                                        {isPositive ? '+' : '-'} {Number(tx.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    {tx.status && <div className={`text-[9px] font-bold uppercase mt-0.5 ${tx.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}`}>{tx.status}</div>}
                                                </td>
                                                <td className="px-5 py-3.5 text-right align-top">
                                                    <div className="font-bold text-xs text-slate-500">
                                                        {Number(tx.balanceAfter || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                <Wallet size={40} className="mb-2 opacity-30" strokeWidth={1.5} />
                                <span className="font-bold text-xs">ยังไม่มีความเคลื่อนไหวทางบัญชี</span>
                            </div>
                        )
                    ) : (
                        pointTransactions.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-white sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 shadow-sm">
                                    <tr>
                                        <th className="px-5 py-3">รายละเอียดการใช้งาน</th>
                                        <th className="px-5 py-3 text-right">จำนวนแต้ม</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {pointTransactions.map(pt => {
                                        const isEarn = pt.type === 'deposit' || pt.type === 'earn';
                                        return (
                                            <tr key={pt.id} className="hover:bg-amber-50/30 transition-colors group">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 border ${isEarn ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                            {isEarn ? <Star size={14} strokeWidth={2.5}/> : <History size={14} strokeWidth={2.5}/>}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-xs text-slate-800">{pt.note || pt.type}</div>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                                                                <span className="flex items-center gap-1"><Clock size={10}/> {pt.createdAt ? new Date(pt.createdAt.toMillis()).toLocaleString('th-TH') : '-'}</span>
                                                                {pt.referenceId && <><span className="text-slate-300">•</span><span className="font-mono text-slate-500">Ref: {pt.referenceId}</span></>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right align-top">
                                                    <div className={`font-black text-sm ${isEarn ? 'text-amber-600' : 'text-slate-600'}`}>
                                                        {isEarn ? '+' : '-'} {Number(pt.amount || 0).toLocaleString('th-TH')}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                                <Coins size={40} className="mb-2 opacity-30" strokeWidth={1.5} />
                                <span className="font-bold text-xs">ยังไม่มีประวัติการใช้แต้ม</span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
