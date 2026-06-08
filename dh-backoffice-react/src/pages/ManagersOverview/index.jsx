import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

// 📦 นำเข้า Components ดั้งเดิม
import ExecutiveStats from './ExecutiveStats';
import QuickAccessTools from './QuickAccessTools';
import StaffApprovalModal from './StaffApprovalModal';
import VipManagementModal from './VipManagementModal';
import GlobalSettingsPanel from '../../components/managers/GlobalSettingsPanel';

// 🌟 THE FIX [Clean Architecture]: นำเข้า Component To-do ที่แยกส่วนไว้
import ManagerTaskSection from './components/ManagerTaskSection';

// 🌟 นำเข้า Hook ของ Dashboard
import { useManagerDashboard } from './useManagerDashboard';

export default function ManagersOverview() {
  const navigate = useNavigate();
  
  // 🌟 เรียกใช้งานข้อมูล Dashboard ดั้งเดิม
  const dashboardLogic = useManagerDashboard() || {};
  
  // 🌟 States สำหรับ Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);

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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* --- Header --- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            แผงควบคุมระดับผู้บริหาร
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            จัดการและอนุมัติรายการสำคัญ, ตรวจสอบสถิติองค์กร
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">System Live</span>
        </div>
      </div>

      {/* --- 📊 สถิติภาพรวม --- */}
      <ExecutiveStats 
        stats={dashboardLogic.stats || {}} 
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenVipModal={() => setIsVipModalOpen(true)}
        onNavigateTodo={() => navigate('/todo')}
      />

      {/* --- 🗂️ Grid Layout: ซ้ายเครื่องมือ (2/3) ขวา To-do (1/3) --- */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* 👈 ฝั่งซ้าย: เมนูเครื่องมือด่วน */}
        <div className="w-full lg:w-2/3 space-y-6">
          <QuickAccessTools 
            onOpenGlobalSettings={() => setIsGlobalSettingsOpen(true)}
            onNavigatePricing={() => navigate('/managers/pricing')}
            onNavigateStaff={() => navigate('/managers/staff')}
            onNavigateTodo={() => navigate('/todo')}
            onNavigateHistory={() => navigate('/history')}
            pendingStaffCount={dashboardLogic.pendingStaffs?.length || 0}
            pendingTasksCount={dashboardLogic.stats?.pendingTasksCount || 0}
          />
        </div>

        {/* 👉 ฝั่งขวา: แผงควบคุมวงกลมที่ 3 */}
        <div className="w-full lg:w-1/3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/10 border border-white/60 dark:border-slate-700/60 flex flex-col relative overflow-hidden min-h-[400px]">
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

      {/* --- 🧩 แผงตั้งค่า Global Settings --- */}
      {isGlobalSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-transparent w-full max-w-5xl flex flex-col items-end gap-2">
            <button 
              onClick={() => setIsGlobalSettingsOpen(false)} 
              className="bg-white text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-[12px] shadow-sm hover:bg-slate-50 flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <X size={14}/> ปิดหน้าต่าง
            </button>
            <div className="w-full bg-white rounded-2xl overflow-hidden shadow-xl max-h-[85vh] overflow-y-auto">
              <GlobalSettingsPanel />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
