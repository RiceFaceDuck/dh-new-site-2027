import React from 'react';
import { Wallet, ShieldCheck, Clock, ArrowRightLeft } from 'lucide-react';
import { formatCredit } from '../../../../firebase/creditService';

const WalletCard = ({ walletBalance, pendingWithdrawal, setIsWithdrawModalOpen }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-300">
            <Wallet className="w-5 h-5" />
            <span className="font-medium tracking-wide">DH Wallet Balance</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono tracking-tight">฿ {formatCredit(walletBalance)}</span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> ยอดเงินค้างในระบบ ปลอดภัย 100%
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          {pendingWithdrawal > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 animate-in fade-in">
              <Clock className="w-4 h-4 text-amber-300" />
              <div className="text-right">
                <p className="text-[10px] text-slate-300 uppercase tracking-wider">กำลังรอตรวจสอบและโอนคืน</p>
                <p className="font-mono font-bold text-amber-300">฿ {formatCredit(pendingWithdrawal)}</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={walletBalance <= 0}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-[10px] font-medium rounded-lg transition-all border border-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
          >
            แจ้งขอคืนเงิน (LINE)
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
