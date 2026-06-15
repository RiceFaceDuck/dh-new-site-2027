import React from 'react';
import { Users, Wallet, Clock, Loader2 } from 'lucide-react';

export default function WalletDashboardStats({ isDashboardLoading, walletHoldersCount, stats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 mt-3 lg:mt-4 shrink-0">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0"><Users size={24} strokeWidth={2}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">บัญชีที่มียอดค้าง</p>
                    {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-300"/> : (
                        <h3 className="text-xl font-black text-slate-800">{walletHoldersCount.toLocaleString()} <span className="text-xs font-bold text-slate-500">บัญชี</span></h3>
                    )}
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Wallet size={24} strokeWidth={2}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ยอดเงินคงค้างระบบทั้งหมด</p>
                    {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-300"/> : (
                        <h3 className="text-xl font-black text-slate-800 font-mono">฿{Number(stats.totalBalance || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
                    )}
                </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm flex items-center gap-4 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="p-3 bg-slate-700 text-amber-400 rounded-xl shrink-0"><Clock size={24} strokeWidth={2}/></div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ยอดเงินรออนุมัติถอน</p>
                    {isDashboardLoading ? <Loader2 size={16} className="animate-spin text-slate-500"/> : (
                        <h3 className="text-xl font-black text-amber-400 font-mono">฿{Number(stats.pendingAmount || 0).toLocaleString('th-TH', {minimumFractionDigits: 2})}</h3>
                    )}
                </div>
            </div>
        </div>
    );
}
