import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, CheckCircle2, Activity, Server, Database, Loader2, ArrowLeft } from 'lucide-react';

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
import CreditCalculatorTab from './components/tabs/CreditCalculatorTab';

// นำเข้า Hooks จัดการข้อมูลส่วนกลาง
import useLedgerStats from './hooks/useLedgerStats';
import useSystemHealth from './hooks/useSystemHealth';

export default function CreditDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('partners');
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
    // 🛠️ แก้ไข: เพิ่ม h-full และ flex-col ให้เต็มจอพอดี ไม่ดันทะลุ
    <div className="h-full flex flex-col max-w-7xl mx-auto space-y-6 pb-6 pt-4 animate-in fade-in duration-500">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/managers')}
        className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm active:scale-95 w-fit"
      >
        <ArrowLeft size={18} /> ย้อนกลับ (Settings)
      </button>

      {/* ==========================================
          1. Header Section (Enterprise Premium Theme)
      ========================================== */}
      <div className="shrink-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-700/50">
        {/* Abstract Background Effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-all duration-700"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/3 pointer-events-none transition-all duration-700"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 flex items-center gap-3 tracking-wide drop-shadow-sm">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            Credit Core Engine
          </h1>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2 font-medium tracking-wide">
            <Server className="w-4 h-4 text-slate-500" /> ศูนย์ปฏิบัติการและควบคุมระบบการเงินกองกลาง (System Ledger)
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className={`px-4 py-2.5 rounded-xl border backdrop-blur-md flex items-center gap-2 font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-300 ${
            healthStatus === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5' :
            healthStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/5' :
            'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/5'
          }`}>
            <Activity className={`w-4 h-4 ${healthStatus === 'healthy' ? 'animate-pulse' : ''}`} />
            {healthStatus === 'healthy' ? 'System Optimal' : healthStatus === 'warning' ? 'Warning' : 'Critical'}
          </div>
        </div>
      </div>

      {/* ==========================================
          2. Ledger Statistics (ตัวเลขกองกลาง)
      ========================================== */}
      <div className="shrink-0 relative z-20">
        <LedgerStatsCards stats={ledgerStats} isLoading={isStatsLoading} />
      </div>

      {/* ==========================================
          3. Main Dashboard Content (Grid Layout)
      ========================================== */}
      {/* 🛠️ แก้ไข: ใส่ flex-1 min-h-0 เพื่อบังคับให้ Scroll อยู่ภายในกล่อง Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Operations & Tabs (8 cols) */}
        {/* 🛠️ แก้ไข: ใส่ h-full และ flex-col ให้ตู้ฝั่งซ้าย */}
        <div className="xl:col-span-8 flex flex-col bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden h-full">
          
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* 🛠️ แก้ไข: เปลี่ยน p-6 เป็นกล่องที่รองรับ overflow-y-auto เพื่อให้ตารางหรือเนื้อหาข้างในเลื่อนได้เอง */}
          <div className="p-0 sm:p-6 bg-slate-50/50 flex-1 relative overflow-y-auto scroll-smooth">
            
            {/* Global Notification Toast */}
            {notification && (
              <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-sm font-bold tracking-wide animate-in slide-in-from-top-4 fade-in duration-300 backdrop-blur-md ${
                notification.type === 'success' 
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50/90 border-rose-200 text-rose-800'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                {notification.msg}
              </div>
            )}

            {/* Tab Contents - ใส่ div ครอบเพิ่ม padding ให้มือถือถ้าตั้ง p-0 ด้านบน */}
            <div className={`p-4 sm:p-0 transition-all duration-300 h-full ${isSubmitting ? 'opacity-40 scale-[0.99] pointer-events-none' : 'opacity-100 scale-100'}`}>
              {activeTab === 'adjust' && (
                <CreditAdjustTab 
                  onSubmitTransaction={handleSubmitTransaction} 
                  isSubmitting={isSubmitting} 
                />
              )}
              {activeTab === 'history' && <CreditHistoryTab />}
              {activeTab === 'partners' && <PartnerCreditsTab />}
              {activeTab === 'settings' && <CreditSettingsTab />}
              {activeTab === 'calculator' && <CreditCalculatorTab />}
            </div>

            {/* Loading Overlay during submit - Enterprise Style */}
            {isSubmitting && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-b-2xl">
                <div className="flex flex-col items-center gap-4 bg-white/90 p-8 rounded-3xl shadow-2xl border border-slate-100/50 backdrop-blur-md">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur animate-ping opacity-20"></div>
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin relative z-10" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 tracking-wider">กำลังประมวลผลธุรกรรมทางการเงิน...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: System Health & Security (4 cols) */}
        {/* 🛠️ แก้ไข: ใส่ sticky เพื่อให้เลื่อนตามหน้าจอเมื่อพื้นที่ข้างในยาวเกิน */}
        <div className="xl:col-span-4 flex flex-col gap-6 sticky top-6 h-fit">
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