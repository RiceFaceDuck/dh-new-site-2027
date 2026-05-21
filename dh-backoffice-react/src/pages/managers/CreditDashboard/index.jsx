import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';

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

  const { stats: ledgerStats, isLoading: isStatsLoading, refetch: refetchStats } = useLedgerStats();
  const { healthStatus, isCheckingHealth, healthLogs, checkHealth, addLog } = useSystemHealth();

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmitTransaction = async (txData) => {
    if (!txData.partnerId) return;
    setIsSubmitting(true);
    addLog(`Processing [${txData.actionType.toUpperCase()}] for ${txData.partnerId}...`, "warning");

    try {
      let userRef, userSnap;
      let targetUid = txData.partnerId;

      userRef = doc(db, 'users', targetUid);
      userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const qPhone = query(collection(db, 'users'), where('phone', '==', txData.partnerId));
        const phoneSnap = await getDocs(qPhone);
        if (!phoneSnap.empty) {
          targetUid = phoneSnap.docs[0].id;
          userRef = doc(db, 'users', targetUid);
          userSnap = phoneSnap.docs[0];
        } else {
          throw new Error("ไม่พบข้อมูล Partner ID หรือเบอร์โทรศัพท์นี้ในระบบ");
        }
      }

      const userData = userSnap.data();
      const currentCredit = Number(userData.credit || userData.creditBalance || 0);
      const amount = Number(txData.amount);
      
      if (txData.actionType === 'deduct' && currentCredit < amount) {
        throw new Error("ยอดเครดิตคงเหลือไม่เพียงพอให้หัก");
      }

      const newCredit = txData.actionType === 'add' ? currentCredit + amount : currentCredit - amount;

      await updateDoc(userRef, {
        credit: newCredit,
        creditBalance: newCredit,
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'credit_transactions'), {
        partnerId: targetUid,
        partnerName: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : 'ไม่ระบุชื่อ',
        type: txData.actionType,
        amount: amount,
        balanceAfter: newCredit,
        remark: txData.remark,
        operator: auth.currentUser?.email || 'System Admin',
        timestamp: serverTimestamp()
      });

      addLog(`Transaction SUCCESS: ฿${amount.toLocaleString('th-TH')} updated.`, "success");
      refetchStats(); 
      alert("ทำรายการสำเร็จเรียบร้อย");
      
    } catch (error) {
      console.error("TX Error:", error);
      addLog(`TX Failed: ${error.message}`, "error");
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
        <p className="text-sm font-medium">Loading System...</p>
      </div>
    );
  }

  return (
    // ลบการจำกัดความสูงออกทั้งหมด และใช้ช่องว่าง (gap/space) แค่ 4
    <div className="w-full pb-10 space-y-4">
      
      {/* Header: เรียบง่าย ทรงเหลี่ยม ไม่กินพื้นที่ */}
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Credit Control System</h1>
          <p className="text-xs text-slate-500">Centralized Financial Operations</p>
        </div>
        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-sm">
          System Online
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* สถิติ */}
        <LedgerStatsCards stats={ledgerStats} isLoading={isStatsLoading} />

        {/* Layout หลัก แบ่ง 8:4 ไม่มี Sticky ไม่มี Lock Scroll */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          
          {/* คอลัมน์ซ้าย */}
          <div className="xl:col-span-8 flex flex-col space-y-0 bg-white border border-slate-300 rounded-sm">
            <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="p-4 bg-white">
              {activeTab === 'adjust' && <CreditAdjustTab onSubmitTransaction={handleSubmitTransaction} isSubmitting={isSubmitting} />}
              {activeTab === 'history' && <CreditHistoryTab />}
              {activeTab === 'partners' && <PartnerCreditsTab />}
              {activeTab === 'settings' && <CreditSettingsTab />}
            </div>
          </div>

          {/* คอลัมน์ขวา: ปล่อยไหลตามธรรมชาติ */}
          <div className="xl:col-span-4 space-y-4">
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