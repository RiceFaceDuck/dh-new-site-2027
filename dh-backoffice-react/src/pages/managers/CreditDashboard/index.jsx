import React, { useState, useEffect } from 'react';

// -------------------------------------------------------------
// นำเข้า Components ย่อยที่เราได้ทำการแยกไฟล์ไว้อย่างเป็นระเบียบ
// -------------------------------------------------------------
import DashboardTabs from './components/DashboardTabs';
import SecurityFrameworkInfo from './components/SecurityFrameworkInfo';
import SystemHealthPanel from './components/SystemHealthPanel';
import LedgerStatsCards from './components/LedgerStatsCards';
import CreditAdjustTab from './components/tabs/CreditAdjustTab';
import CreditHistoryTab from './components/tabs/CreditHistoryTab';
import PartnerCreditsTab from './components/tabs/PartnerCreditsTab';
import CreditSettingsTab from './components/tabs/CreditSettingsTab';

export default function CreditDashboard() {
  // ==========================================
  // 1. States สำหรับควบคุม UI และ Navigation
  // ==========================================
  const [activeTab, setActiveTab] = useState('adjust');
  const [isInitializing, setIsInitializing] = useState(true);

  // ==========================================
  // 2. States สำหรับ System Health & Logs
  // ==========================================
  const [healthStatus, setHealthStatus] = useState('healthy'); // 'healthy', 'warning', 'critical'
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthLogs, setHealthLogs] = useState([
    { time: new Date().toLocaleTimeString(), msg: "DH-Core: Authentication successful.", type: "success" },
    { time: new Date().toLocaleTimeString(), msg: "Credit Engine: Standing by.", type: "info" }
  ]);

  // ==========================================
  // 3. States สำหรับสถิติ Ledger (ตัวเลขสรุป)
  // ==========================================
  const [ledgerStats, setLedgerStats] = useState({
    totalUserCredits: 1250000,
    systemLedgerBalance: 1250000,
    discrepancy: 0,
    totalPartnersWithCredit: 145,
  });

  // ==========================================
  // Effects
  // ==========================================
  // จำลองการโหลดระบบตอนเปิดหน้าเว็บครั้งแรก (UX Improvement)
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // Handlers (ฟังก์ชันการทำงาน)
  // ==========================================
  
  // กดปุ่มเช็คสถานะเซิร์ฟเวอร์ (Diagnostics)
  const handleRefreshHealth = () => {
    setIsCheckingHealth(true);
    // จำลองการดึงข้อมูล API 1.2 วินาที
    setTimeout(() => {
      setHealthLogs(prev => [
         { time: new Date().toLocaleTimeString(), msg: "System health check OK. DB Latency: 24ms", type: "success" },
         ...prev
      ].slice(0, 15)); // เก็บประวัติแค่ 15 บรรทัดล่าสุดกัน UI รก
      setIsCheckingHealth(false);
    }, 1200);
  };

  // รับข้อมูลจากการกดปุ่ม ยืนยันทำรายการ ใน CreditAdjustTab
  const handleSubmitTransaction = async (txData) => {
    // เพิ่ม Log ว่ากำลังทำงาน
    const logMsg = `Transaction [${txData.actionType.toUpperCase()}] for ${txData.partnerId} amount ฿${txData.amount.toLocaleString()} processing...`;
    setHealthLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: logMsg, type: "warning" }, ...prev]);

    // จำลองการรอ API (ในของจริงตรงนี้คือการเรียก creditService)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // อัปเดตตัวเลขสถิติแบบ Real-time หลังจากทำรายการเสร็จ
    setLedgerStats(prev => {
       const newCredits = txData.actionType === 'add' 
          ? prev.totalUserCredits + txData.amount 
          : prev.totalUserCredits - txData.amount;
       
       return {
         ...prev,
         totalUserCredits: newCredits,
         systemLedgerBalance: newCredits, // สมมติว่า Sync ตรงกันเป๊ะ
         discrepancy: 0
       }
    });

    // แจ้งเตือนความสำเร็จลง Terminal
    setHealthLogs(prev => [
        { time: new Date().toLocaleTimeString(), msg: `Transaction SUCCESS for ${txData.partnerId}. UID generated.`, type: "success" },
        ...prev
    ]);
  };

  // ==========================================
  // Render
  // ==========================================
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="font-medium animate-pulse tracking-wide">Initializing Credit Core System...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Credit Management <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">Core</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">ศูนย์กลางจัดการระบบเครดิตและตรวจสอบกระเป๋าเงินพาร์ทเนอร์ (DH-Core)</p>
        </div>
      </div>

      {/* Row 1: สถิติตัวเลขด้านบนสุด */}
      <LedgerStatsCards stats={ledgerStats} isLoading={isInitializing} />

      {/* Row 2: เลย์เอาต์หลัก แบ่ง 3:1 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* คอลัมน์ซ้าย (กว้าง 3 ส่วน): พื้นที่ทำงานหลัก */}
        <div className="xl:col-span-3 space-y-6 flex flex-col h-full">
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* พื้นที่แสดงเนื้อหาของแต่ละ Tab */}
          <div className="flex-1">
            {activeTab === 'adjust' && (
              <CreditAdjustTab 
                onSubmitTransaction={handleSubmitTransaction} 
                isSubmitting={false} 
              />
            )}
            
            {activeTab === 'history' && <CreditHistoryTab />}
            
            {activeTab === 'partners' && <PartnerCreditsTab />}
            
            {activeTab === 'settings' && <CreditSettingsTab />}
          </div>
        </div>

        {/* คอลัมน์ขวา (กว้าง 1 ส่วน): แผงควบคุมระบบ (Sticky Sidebar) */}
        <div className="space-y-6 xl:sticky xl:top-6 self-start">
          <SystemHealthPanel 
            healthStatus={healthStatus}
            isCheckingHealth={isCheckingHealth}
            healthLogs={healthLogs}
            onRefresh={handleRefreshHealth}
          />
          <SecurityFrameworkInfo />
        </div>

      </div>
    </div>
  );
}