import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle } from 'lucide-react';

// 📦 นำเข้า Components ดั้งเดิม
import QuickAccessTools from './QuickAccessTools';
import StaffApprovalModal from './StaffApprovalModal';
import VipManagementModal from './VipManagementModal';

// 🌟 THE FIX [Clean Architecture]: นำเข้า Component To-do ที่แยกส่วนไว้
import ManagerTaskSection from './components/ManagerTaskSection';
import EmailSetupModal from './components/EmailSetupModal';
import ManagerDrivePanel from './components/ManagerDrivePanel';
import MenuLayoutManager from './components/MenuLayoutManager';
import ManagerQRGeneratorModal from './components/ManagerQRGeneratorModal';

// 🌟 นำเข้า Hook ของ Dashboard
import { useManagerDashboard } from './useManagerDashboard';
import { useAuth } from '../../contexts/AuthContext';

export default function ManagersOverview() {
  const navigate = useNavigate();
  
  // 🌟 เรียกใช้งานข้อมูล Dashboard ดั้งเดิม
  const dashboardLogic = useManagerDashboard() || {};
  const { isManagerOrOwner } = useAuth();
  
  // 🌟 States สำหรับ Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isEmailSetupOpen, setIsEmailSetupOpen] = useState(false);
  const [isDrivePanelOpen, setIsDrivePanelOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  
  // 🌟 States สำหรับ Drag & Drop Layout
  const [isLayoutManagerOpen, setIsLayoutManagerOpen] = useState(false);
  const [menuRefreshTrigger, setMenuRefreshTrigger] = useState(0);

  // 🌟 ฟังก์ชันดั้งเดิมสำหรับจัดการหน้าต่าง Staff
  const handleApproveStaff = async (staffId) => {
    if (dashboardLogic.approveStaff) {
      const result = await dashboardLogic.approveStaff(staffId);
      if (result.success) {
        alert("อนุมัติพนักงานเรียบร้อยแล้ว");
        setIsStaffModalOpen(false);
      } else {
        alert("เกิดข้อผิดพลาด: " + result.error?.message);
      }
    }
  };

  // 🌟 ฟังก์ชันดั้งเดิมสำหรับจัดการหน้าต่าง VIP
  const handleRevokeVip = async (userId) => {
    if (dashboardLogic.revokeVipStatus) {
      const result = await dashboardLogic.revokeVipStatus(userId);
      if (!result.success) {
        alert("เกิดข้อผิดพลาด: " + result.error?.message);
      }
    }
  };

  const handleOpenMasterSheet = () => {
    if (isManagerOrOwner) {
      window.open('https://docs.google.com/spreadsheets/d/1f3ZyfZM6nwE3OSNeseMqlqElDqv7Kxt_UL3H1IPTLos/edit?usp=sharing', '_blank');
    } else {
      alert('คุณไม่สามารถใช้งานได้\nต้องใช้ตำแหน่ง ผู้จัดการ หรือสูงกว่า หรือ ตำแหน่งที่อนุมัติ ให้ใช้งานได้');
    }
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto p-3 sm:p-4 lg:p-5 h-[calc(100vh-16px)] flex flex-col overflow-hidden space-y-3">
      
      {/* --- Header (Dark Slim Banner ตรงกับ Production) --- */}
      <div className="shrink-0">
        <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white rounded-xl p-3 sm:px-4 sm:py-3 border border-indigo-500/30 shadow-md relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                    แผงควบคุม DH NOTEBOOK
                  </h1>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 tracking-wider">Live</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
              <button 
                onClick={handleOpenMasterSheet}
                title="เปิดฐานข้อมูล Google Sheet"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline-block">Master DB</span>
              </button>
              
              <button 
                onClick={() => navigate('/managers/audit-ledger')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg border border-indigo-400/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5 text-indigo-200" />
                <span>Audit Ledger</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- 🗂️ Grid Layout: ซ้ายเครื่องมือ (2/3) ขวา To-do (1/3) พอดีกับความสูงหน้าจอ --- */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 items-stretch overflow-hidden">
        
        {/* 👈 ฝั่งซ้าย: เมนูเครื่องมือด่วน (Scrollable) */}
        <div className="w-full lg:w-7/12 xl:w-2/3 h-full overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-4">
          <QuickAccessTools 
            onNavigatePricing={() => navigate('/managers/pricing')}
            onNavigateStaff={() => navigate('/managers/staff')}
            onNavigateHistory={() => navigate('/history')}
            onNavigateAds={() => navigate('/managers/ads')}
            onNavigateCredit={() => navigate('/managers/credit-dashboard')}
            onOpenEmailSetup={() => setIsEmailSetupOpen(true)}
            onOpenDrivePanel={() => setIsDrivePanelOpen(true)}
            onOpenVipModal={() => setIsVipModalOpen(true)}
            onOpenLayoutManager={() => setIsLayoutManagerOpen(true)}
            onOpenScannerModal={() => setIsScannerModalOpen(true)}
            refreshTrigger={menuRefreshTrigger}
            pendingStaffCount={dashboardLogic.pendingStaffs?.length || 0}
            vipCount={dashboardLogic.stats?.vipCount || 0}
          />
        </div>

        {/* 👉 ฝั่งขวา: งานที่ต้องอนุมัติ & สถิติ (พอดีกับความสูงหน้าจอ) */}
        <div className="w-full lg:w-5/12 xl:w-1/3 h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <ManagerTaskSection />
          
        </div>
      </div>

      {/* --- 🧩 Modals --- */}
      <StaffApprovalModal 
        isOpen={isStaffModalOpen} 
        onClose={() => setIsStaffModalOpen(false)} 
        pendingStaffs={dashboardLogic.pendingStaffs || []}
        isLoading={dashboardLogic.isLoadingStaffs}
        onApprove={handleApproveStaff}
      />
      
      <VipManagementModal 
        isOpen={isVipModalOpen} 
        onClose={() => setIsVipModalOpen(false)} 
        vipUsers={dashboardLogic.vipUsers || []}
        isLoading={dashboardLogic.isLoadingVips}
        onFetchVips={dashboardLogic.fetchVipUsers}
        onRevokeVip={handleRevokeVip}
      />

      <EmailSetupModal 
        isOpen={isEmailSetupOpen} 
        onClose={() => setIsEmailSetupOpen(false)} 
      />

      <ManagerDrivePanel
        isOpen={isDrivePanelOpen}
        onClose={() => setIsDrivePanelOpen(false)}
      />

      <MenuLayoutManager 
        isOpen={isLayoutManagerOpen}
        onClose={() => setIsLayoutManagerOpen(false)}
        onSaved={() => setMenuRefreshTrigger(prev => prev + 1)}
      />

      <ManagerQRGeneratorModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
      />

    </div>
  );
}
