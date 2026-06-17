import React, { useState } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { getAuth } from 'firebase/auth';

import { useWalletBalance } from '../../../firebase/walletService';
import { useWalletData } from './wallet/useWalletData';
import WalletCard from './wallet/WalletCard';
import WalletHistory from './wallet/WalletHistory';
import WithdrawModal from './wallet/WithdrawModal';

export default function TabWallet() {
  const auth = getAuth();
  const user = auth.currentUser;

  const { walletBalance, pendingWithdrawal, loading: walletLoading } = useWalletBalance(user?.uid);
  const { historyLogs, loadingHistory } = useWalletData(user);

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
      <WalletCard 
        walletBalance={walletBalance} 
        pendingWithdrawal={pendingWithdrawal} 
        setIsWithdrawModalOpen={setIsWithdrawModalOpen} 
      />

      <WalletHistory 
        historyLogs={historyLogs} 
        loadingHistory={loadingHistory} 
      />

      <WithdrawModal 
        user={user} 
        walletBalance={walletBalance} 
        isWithdrawModalOpen={isWithdrawModalOpen} 
        setIsWithdrawModalOpen={setIsWithdrawModalOpen} 
      />
    </div>
  );
}