import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Activity, Server, Database, Loader2 } from 'lucide-react';

// นำเข้า Components ย่อยของ Dashboard
import DashboardTabs from './components/DashboardTabs';
import SecurityFrameworkInfo from './components/SecurityFrameworkInfo';
import SystemHealthPanel from './components/SystemHealthPanel';
import LedgerStatsCards from './components/LedgerStatsCards';

// นำเข้า Tabs
import CreditAdjustTab from './components/tabs/CreditAdjustTab';
import CreditHistoryTab from './components/tabs/CreditHistoryTab';
import PartnerCreditsTab from './components/tabs/PartnerCreditsTab';
import CreditSettingsTab from './components/tabs/CreditSettingsTab';

// นำเข้า Hooks จัดการข้อมูลส่วนกลาง
import useLedgerStats from './hooks/useLedgerStats';
import useSystemHealth from './hooks/useSystemHealth';

export default function CreditDashboard() {
  const [activeTab, setActiveTab] = useState('adjust');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // ⚡ ดึงสถิติ Ledger และสถานะระบบจาก Custom Hooks
  const { stats: ledgerStats, isLoading: isStatsLoading, refetch: refetchStats } = useLedgerStats();
  const { healthStatus, isCheckingHealth, healthLogs, checkHealth, addLog } = useSystemHealth();

  // ตรวจสอบระบบอัตโนมัติเมื่อเปิดหน้า Dashboard
  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🚀 ฟังก์ชันศูนย์กลางในการรับรู้เมื่อมีการทำธุรกรรมใน Tab ต่างๆ
  const handleSubmitTransaction = async (transactionCallback, successMessage = 'ทำรายการสำเร็จ') => {
    setIsSubmitting(true);
    try {
      if (typeof transactionCallback === 'function') {
        await transactionCallback();
      }
      
      // แจ้งเตือนความสำเร็จ
      setNotification({ type: 'success', msg: successMessage });
      addLog(`Transaction completed: ${successMessage}`, 'success');
      
      // 🔄 บังคับอัปเดตสถิติ Ledger กองกลางทันที
      if (refetchStats) refetchStats();
      
    } catch (error) {
      console.error("Dashboard Transaction Error:", error);
      setNotification({ type: 'error', msg: error.message || 'เกิดข้อผิดพลาดในการทำรายการ' });
      addLog(`Transaction failed: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
      // เคลียร์การแจ้งเตือนอัตโนมัติ
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* ==========================================
          1. Header Section (Executive Theme)
      ========================================== */}
      <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        {/* Abstract Background Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-wide">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            Credit Core Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 flex items-center gap-2 font-medium">
            <Server className="w-4 h-4" /> ศูนย์ปฏิบัติการและควบคุมระบบการเงินกองกลาง (System Ledger)
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${
            healthStatus === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            healthStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
            'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <Activity className="w-4 h-4" />
            {healthStatus === 'healthy' ? 'System Optimal' : healthStatus === 'warning' ? 'Warning' : 'Critical'}
          </div>
        </div>
      </div>

      {/* ==========================================
          2. Ledger Statistics (ตัวเลขกองกลาง)
      ========================================== */}
      <div className="relative z-20">
        <LedgerStatsCards stats={ledgerStats} isLoading={isStatsLoading} />
      </div>

      {/* ==========================================
          3. Main Dashboard Content (Grid Layout)
      ========================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Operations & Tabs (8 cols) */}
        <div className="xl:col-span-8 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="p-6 bg-slate-50/30 flex-1 relative min-h-[500px]">
            {/* Global Notification Toast */}
            {notification && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-sm font-bold tracking-wide animate-in slide-in-from-top-4 fade-in duration-300 ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                {notification.msg}
              </div>
            )}

            {/* Tab Contents */}
            <div className={`transition-opacity duration-300 ${isSubmitting ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {activeTab === 'adjust' && (
                <CreditAdjustTab 
                  onSubmitTransaction={handleSubmitTransaction} 
                  isSubmitting={isSubmitting} 
                />
              )}
              {activeTab === 'history' && <CreditHistoryTab />}
              {activeTab === 'partners' && <PartnerCreditsTab />}
              {activeTab === 'settings' && <CreditSettingsTab />}
            </div>

            {/* Loading Overlay during submit */}
            {isSubmitting && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-b-2xl">
                <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-sm font-bold text-slate-700">กำลังประมวลผลธุรกรรมทางการเงิน...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: System Health & Security (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
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
  );
}