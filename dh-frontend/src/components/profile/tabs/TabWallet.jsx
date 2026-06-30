import React, { useState } from 'react';
import { Loader2, Wallet, ArrowLeft } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { useWalletBalance } from '../../../firebase/walletService';
import { useWalletData } from './wallet/useWalletData';
import WalletCard from './wallet/WalletCard';
import WalletHistory from './wallet/WalletHistory';
import WithdrawModal from './wallet/WithdrawModal';
import { useUserCredit, formatCredit } from '../../../firebase/creditService';
import { Coins } from 'lucide-react';

export default function TabWallet({ type = 'wallet' }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const { walletBalance, pendingWithdrawal, loading: walletLoading } = useWalletBalance(user?.uid);
  const { balance: creditBalance, tier, loading: creditLoading } = useUserCredit(user?.uid);
  const { historyLogs, loadingHistory } = useWalletData(user);
  
  // กรองประวัติตามประเภท
  const filteredLogs = historyLogs.filter(log => {
    if (type === 'credit') {
      // Credit logs usually don't have 'withdraw' types like wallet does, or they have 'points' instead of 'amount'
      // Another way is to just check if it has 'points' or the note contains 'เครดิต'
      return log.points !== undefined || log.note?.includes('แต้ม') || log.type === 'spend' || log.type === 'earn';
    } else {
      // Wallet logs
      return log.amount !== undefined || log.type?.includes('WITHDRAWAL') || log.type === 'deposit';
    }
  });

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  if (walletLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Wallet className="w-10 h-10 text-indigo-100 absolute" />
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin relative" />
        </div>
        <p className="text-sm font-bold text-slate-500 mt-4">กำลังเชื่อมต่อกระเป๋าเงินระบบ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/profile?tab=overview')}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors w-fit px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-200 hover:bg-indigo-50"
      >
        <ArrowLeft size={16} /> ย้อนกลับ (Back)
      </button>

      {type === 'wallet' ? (
        <WalletCard 
          walletBalance={walletBalance} 
          pendingWithdrawal={pendingWithdrawal} 
          setIsWithdrawModalOpen={setIsWithdrawModalOpen} 
        />
      ) : (
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-300">
                <Coins className="w-5 h-5" />
                <span className="font-medium tracking-wide">Credit Points</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono tracking-tight text-indigo-50">{formatCredit(creditBalance)} <span className="text-lg font-medium text-indigo-400">Pts</span></span>
              </div>
            </div>
            {tier && (
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${tier.bg} ${tier.border} ${tier.color} shadow-sm`}>
                <span className="text-xl">{tier.icon}</span>
                <span className="text-sm font-black uppercase tracking-wider">{tier.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <WalletHistory 
        historyLogs={filteredLogs} 
        loadingHistory={loadingHistory} 
        type={type}
      />

      {type === 'wallet' && (
        <WithdrawModal 
          user={user} 
          walletBalance={walletBalance} 
          isWithdrawModalOpen={isWithdrawModalOpen} 
          setIsWithdrawModalOpen={setIsWithdrawModalOpen} 
        />
      )}
    </div>
  );
}