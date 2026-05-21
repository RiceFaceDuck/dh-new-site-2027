import React, { useState, useEffect } from 'react';
import { doc, collection, query, where, getDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';
import { creditService } from '../../../firebase/creditService';
import { ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';

import DashboardTabs from './components/DashboardTabs';
import SecurityFrameworkInfo from './components/SecurityFrameworkInfo';
import SystemHealthPanel from './components/SystemHealthPanel';
import LedgerStatsCards from './components/LedgerStatsCards';
import CreditAdjustTab from './components/tabs/CreditAdjustTab';
import CreditHistoryTab from './components/tabs/CreditHistoryTab';
import PartnerCreditsTab from './components/tabs/PartnerCreditsTab';
import CreditSettingsTab from './components/tabs/CreditSettingsTab';

import useLedgerStats from './hooks/useLedgerStats';
import useSystemHealth from './hooks/useSystemHealth';

export default function CreditDashboard() {
  const [activeTab, setActiveTab] = useState('adjust');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const { stats: ledgerStats, isLoading: isStatsLoading, refetch: refetchStats } = useLedgerStats();
  const { healthStatus, isCheckingHealth, healthLogs, checkHealth, addLog } = useSystemHealth();

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const showNotification = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 6000);
  };

  const handleSubmitTransaction = async (txData) => {
    if (!txData.partnerId) return;
    setIsSubmitting(true);
    addLog(`[TX_INIT] Requesting ${txData.actionType.toUpperCase()} for Account: ${txData.partnerId}`, "warning");

    try {
      let targetUid = txData.partnerId;
      const amount = Number(txData.amount);

      if (amount <= 0 || isNaN(amount)) {
        throw new Error("Invalid transaction amount.");
      }

      let userRef = doc(db, 'users', targetUid);
      let userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const qPhone = query(collection(db, 'users'), where('phone', '==', txData.partnerId));
        const phoneSnap = await getDocs(qPhone);
        if (!phoneSnap.empty) {
          targetUid = phoneSnap.docs[0].id;
        } else {
          throw new Error(`ไม่พบบัญชีผู้ใช้งานที่ตรงกับ: ${txData.partnerId}`);
        }
      }

      const type = txData.actionType === 'add' ? 'deposit' : 'deduct';
      const operatorUid = auth.currentUser?.email || auth.currentUser?.uid || 'SYSTEM_ADMIN';

      // 🚀 สั่งงานตรงไปยัง creditService ของจริงที่คุณเขียนไว้! ปลอดภัย 100%
      await creditService.adjustUserCredit(targetUid, amount, type, txData.remark, operatorUid);

      addLog(`[TX_SUCCESS] Processed ฿${amount.toLocaleString('th-TH')} for UID: ${targetUid}`, "success");
      showNotification('success', `Transaction Authorized: Successfully updated account balance.`);
      refetchStats(); 
      
    } catch (error) {
      console.error("Transaction Error:", error);
      addLog(`[TX_ERR] ${error.message}`, "error");
      showNotification('error', `Transaction Rejected: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 bg-slate-50 font-mono text-sm tracking-widest">
        [ SYSTEM INITIALIZING ]
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-100 min-h-screen">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/10 flex items-center justify-center">
          <div className="bg-white px-5 py-3 border border-slate-300 shadow-md flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-slate-800 tracking-wider">PROCESSING SECURE TRANSACTION...</span>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-slate-300 px-6 py-4 flex justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 text-white p-1.5 rounded-sm">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-widest uppercase">Credit Control Module</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Financial Core Operations</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-sm uppercase tracking-wider">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          System Secure
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 max-w-[1600px] mx-auto">
        <LedgerStatsCards stats={ledgerStats} isLoading={isStatsLoading} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start min-w-0">
          <div className="xl:col-span-8 flex flex-col space-y-0 min-w-0 bg-white border border-slate-300 shadow-sm rounded-sm">
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="p-5">
              {notification && (
                <div className={`p-3 mb-5 rounded-sm border flex items-center gap-3 text-xs font-bold tracking-wide animate-in fade-in slide-in-from-top-2
                  ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                  {notification.type === 'success' ? <CheckCircle size={16} className="text-emerald-600"/> : <AlertTriangle size={16} className="text-red-600"/>}
                  {notification.msg}
                </div>
              )}

              <div className="min-h-[400px]">
                {activeTab === 'adjust' && <CreditAdjustTab onSubmitTransaction={handleSubmitTransaction} isSubmitting={isSubmitting} />}
                {activeTab === 'history' && <CreditHistoryTab />}
                {activeTab === 'partners' && <PartnerCreditsTab />}
                {activeTab === 'settings' && <CreditSettingsTab />}
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 flex flex-col space-y-4 min-w-0">
            <SystemHealthPanel 
              healthStatus={healthStatus}
              isCheckingHealth={isCheckingHealth}
              healthLogs={healthLogs}
              onRefresh={checkHealth}
            />
            <SecurityFrameworkInfo />
          </div>
        </div>
      </div>
    </div>
  );
}