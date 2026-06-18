import React, { useState } from 'react';
import { Wallet, Coins, Loader2 } from 'lucide-react';
import WalletStatusCard from './components/WalletStatusCard';
import TransactionTable from './components/TransactionTable';
import PointTransactionTable from './components/PointTransactionTable';

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
            <WalletStatusCard 
              selectedUser={selectedUser} 
              currentWalletBalance={currentWalletBalance} 
              currentPointsBalance={currentPointsBalance} 
              onOpenAdjustModal={onOpenAdjustModal} 
              copiedPhone={copiedPhone} 
              copyToClipboard={copyToClipboard} 
            />

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
                        <TransactionTable transactions={transactions} />
                    ) : (
                        <PointTransactionTable pointTransactions={pointTransactions} />
                    )}
                </div>
            </div>
        </div>
    );
}

