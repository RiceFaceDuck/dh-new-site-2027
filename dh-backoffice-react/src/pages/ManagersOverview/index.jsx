import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

// 📦 นำเข้า Components ดั้งเดิม
import QuickAccessTools from './QuickAccessTools';
import StaffApprovalModal from './StaffApprovalModal';
import VipManagementModal from './VipManagementModal';

// 🌟 THE FIX [Clean Architecture]: นำเข้า Component To-do ที่แยกส่วนไว้
import ManagerTaskSection from './components/ManagerTaskSection';
import EmailSetupModal from './components/EmailSetupModal';
import ManagerDrivePanel from './components/ManagerDrivePanel';
import MenuLayoutManager from './components/MenuLayoutManager';

// 🌟 นำเข้า Hook ของ Dashboard
import { useManagerDashboard } from './useManagerDashboard';

export default function ManagersOverview() {
  const navigate = useNavigate();
  
  // 🌟 เรียกใช้งานข้อมูล Dashboard ดั้งเดิม
  const dashboardLogic = useManagerDashboard() || {};
  
  // 🌟 States สำหรับ Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isEmailSetupOpen, setIsEmailSetupOpen] = useState(false);
  const [isDrivePanelOpen, setIsDrivePanelOpen] = useState(false);
  
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

  return (
    <div className="w-full max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* --- Header --- */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-2xl shadow-[0_8px_30px_-5px_rgba(79,70,229,0.6)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden transition-all duration-300 border-2 border-indigo-400/30">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-[80px] opacity-20 animate-pulse pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <ShieldCheck className="w-8 h-8 text-blue-200" />
            แผงควบคุมการทำงาน DH NOTEBOOK
          </h1>
          <p className="text-blue-100 mt-2 font-medium text-sm flex items-center gap-2">
            จัดการและอนุมัติรายการสำคัญ, ตรวจสอบสถิติองค์กร
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 relative z-10 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <span className="text-xs font-bold text-white tracking-wider">System Live</span>
        </div>
      </div>

      {/* --- 🗂️ Grid Layout: ซ้ายเครื่องมือ (2/3) ขวา To-do (1/3) --- */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* 👈 ฝั่งซ้าย: เมนูเครื่องมือด่วน (Scrollable) */}
        <div className="w-full lg:w-2/3 xl:w-3/4 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2 pb-8">
          <QuickAccessTools 
            onNavigatePricing={() => navigate('/managers/pricing')}
            onNavigateStaff={() => navigate('/managers/staff')}
            onNavigateHistory={() => navigate('/history')}
            onNavigateAds={() => navigate('/managers/ads')}
            onNavigateCredit={() => navigate('/managers/credit')}
            onOpenEmailSetup={() => setIsEmailSetupOpen(true)}
            onOpenDrivePanel={() => setIsDrivePanelOpen(true)}
            onOpenVipModal={() => setIsVipModalOpen(true)}
            onOpenLayoutManager={() => setIsLayoutManagerOpen(true)}
            refreshTrigger={menuRefreshTrigger}
            pendingStaffCount={dashboardLogic.pendingStaffs?.length || 0}
            vipCount={dashboardLogic.stats?.vipCount || 0}
          />
        </div>

        {/* 👉 ฝั่งขวา: งานที่ต้องอนุมัติ & สถิติ (ปรับเป็น 1/4 ของจอใหญ่) */}
        <div className="w-full lg:w-1/3 xl:w-1/4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-2xl shadow-indigo-500/20 border-2 border-slate-200 dark:border-slate-700 flex flex-col relative overflow-hidden min-h-[400px]">
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

    </div>
  );
}
