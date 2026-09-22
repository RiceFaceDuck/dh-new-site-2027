import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Server, 
  Loader2, 
  ArrowLeft,
  RefreshCw,
  Zap,
  Layers,
  Lock
} from 'lucide-react';

// นำเข้า Components ย่อยของ Dashboard
import DashboardTabs from './components/DashboardTabs';
import LedgerStatsCards from './components/LedgerStatsCards';

// นำเข้า Tabs ทั้ง 5 หมวด
import CreditAdjustTab from './components/tabs/CreditAdjustTab';
import CreditHistoryTab from './components/tabs/CreditHistoryTab';
import PartnerCreditsTab from './components/tabs/PartnerCreditsTab';
import CreditSettingsTab from './components/tabs/CreditSettingsTab';
import CreditCalculatorTab from './components/tabs/CreditCalculatorTab';

// นำเข้า Hooks & Cache จัดการข้อมูลส่วนกลาง
import useLedgerStats from './hooks/useLedgerStats';
import useSystemHealth from './hooks/useSystemHealth';
import { creditCacheManager } from '../../../firebase/credit/creditCacheManager';

export default function CreditDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('partners');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // ⚡ ดึงสถิติ Ledger และสถานะระบบจาก Custom Hooks
  const { stats: ledgerStats, isLoading: isStatsLoading, refetch: refetchStats } = useLedgerStats();
  const { healthStatus, isCheckingHealth, healthLogs, checkHealth, addLog } = useSystemHealth();

  // 🚀 ฟังก์ชันศูนย์กลางในการรับรู้เมื่อมีการทำธุรกรรมใน Tab ต่างๆ
  const handleSubmitTransaction = async (transactionCallback, successMessage = 'ทำรายการสำเร็จ') => {
    setIsSubmitting(true);
    try {
      if (typeof transactionCallback === 'function') {
        await transactionCallback();
      }
      
      // ล้างแคชที่เกี่ยวข้องทั้งหมดเพื่อให้หน้าจออัปเดตข้อมูลสดใหม่
      creditCacheManager.invalidateAll();

      // แจ้งเตือนความสำเร็จ
      setNotification({ type: 'success', msg: successMessage });
      addLog(`การประมวลผลรายการสำเร็จ: ${successMessage}`, 'success');
      
      // 🔄 บังคับอัปเดตสถิติ Ledger กองกลางทันที
      if (refetchStats) refetchStats(true);
      
    } catch (error) {
      console.error("Dashboard Transaction Error:", error);
      setNotification({ type: 'error', msg: error.message || 'เกิดข้อผิดพลาดในการทำรายการ' });
      addLog(`การประมวลผลรายการล้มเหลว: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
      // เคลียร์การแจ้งเตือนอัตโนมัติ
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto space-y-4 pb-6 pt-1 animate-in fade-in duration-500">
      
      {/* ==========================================
          1. Header Section (Enterprise Premium Theme)
      ========================================== */}
      <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden text-white">
        {/* Abstract Background Effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Left Column: Back button + Title */}
          <div className="lg:col-span-3 flex flex-col items-start justify-start space-y-2.5">
            <button
              onClick={() => navigate('/managers')}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold text-indigo-200 bg-indigo-950/90 border border-indigo-500/40 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-400 transition-all shadow-xs active:scale-95 cursor-pointer tracking-wide"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>ย้อนกลับ (Settings)</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400 shadow-inner shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-wide leading-tight">
                  Credit Core Engine
                </h1>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                  <Server className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>ระบบการเงินกองกลาง</span>
                </p>
              </div>
            </div>
          </div>

          {/* Middle Column: Integrated EVENT LOGS */}
          <div className="lg:col-span-6 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-1 px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  บันทึกเหตุการณ์ระบบ (EVENT LOGS)
                </span>
              </div>
              <button
                onClick={checkHealth}
                disabled={isCheckingHealth}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={10} className={isCheckingHealth ? 'animate-spin text-indigo-400' : ''} />
                {isCheckingHealth ? 'กำลังตรวจสอบ...' : 'รีเฟรช'}
              </button>
            </div>
            <div className="h-[48px] overflow-y-auto font-mono text-[11px] space-y-1 pr-1 scrollbar-thin">
              {healthLogs.length === 0 ? (
                <div className="text-slate-500 italic">ยังไม่มีบันทึกเหตุการณ์ในขณะนี้...</div>
              ) : (
                healthLogs.slice(0, 10).map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-tight">
                    <span className="text-slate-400 text-[10px] shrink-0 font-semibold">[{log.time}]</span>
                    <span className={`break-all ${
                      log.type === 'error' ? 'text-rose-400 font-bold' :
                      log.type === 'warning' ? 'text-amber-300 font-semibold' :
                      log.type === 'success' ? 'text-emerald-300 font-medium' :
                      'text-slate-200'
                    }`}>
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Status & Security Framework Badges */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-2">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center justify-between font-bold text-xs shadow-xs ${
              healthStatus === 'healthy' ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' :
              healthStatus === 'warning' ? 'bg-amber-950/70 border-amber-500/40 text-amber-300' :
              'bg-rose-950/70 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-1.5">
                <Activity className={`w-3.5 h-3.5 ${healthStatus === 'healthy' ? 'animate-pulse text-emerald-400' : ''}`} />
                <span>{healthStatus === 'healthy' ? 'SYSTEM OPTIMAL' : healthStatus === 'warning' ? 'WARNING' : 'CRITICAL'}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-700/50">
                Active
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800/60 shrink-0" title="Atomic Operations: ทุกคำสั่งประมวลผลแบบรวบยอด">
                <Zap size={11} className="text-emerald-400" />
                <span>Atomic TXN</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-950/60 px-2 py-1 rounded-lg border border-blue-800/60 shrink-0" title="Multi-Layer Sync: ปรับสมดุล Real-Time ข้ามอุปกรณ์">
                <Layers size={11} className="text-blue-400" />
                <span>Multi-Sync</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded-lg border border-indigo-800/60 shrink-0" title="Immutable Audit Trail: บันทึกประวัติถาวร">
                <Lock size={11} className="text-indigo-400" />
                <span>Audit Log</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ==========================================
          2. Ledger Statistics (ตัวเลขกองกลาง 4 ใบ)
      ========================================== */}
      <div className="shrink-0 relative z-20">
        <LedgerStatsCards stats={ledgerStats} isLoading={isStatsLoading} />
      </div>

      {/* ==========================================
          3. Main Dashboard Content (Full Width 12-col)
      ========================================== */}
      <div className="flex-1 min-h-0">
        <div className="flex flex-col bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden h-full">
          
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
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

            {/* Tab Contents */}
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

            {/* Loading Overlay during submit */}
            {isSubmitting && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-xs rounded-b-2xl">
                <div className="flex flex-col items-center gap-4 bg-white/90 p-8 rounded-3xl shadow-2xl border border-slate-100/50 backdrop-blur-md">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-sm animate-ping opacity-20"></div>
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin relative z-10" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 tracking-wider">กำลังประมวลผลธุรกรรมทางการเงิน...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}