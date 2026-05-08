import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { auth } from '../../firebase/config';
import { userService } from '../../firebase/userService';

// นำเข้า Components ที่เราแยกชิ้นส่วนมา
import { useManagerDashboard } from './useManagerDashboard';
import ExecutiveStats from './ExecutiveStats';
import QuickAccessTools from './QuickAccessTools';
import StaffApprovalModal from './StaffApprovalModal';
import VipManagementModal from './VipManagementModal';
import GlobalSettingsPanel from '../../components/managers/GlobalSettingsPanel';

/**
 * 🏢 ศูนย์บัญชาการผู้จัดการ (Managers Overview)
 * หน้าที่หลัก: ประกอบร่าง (Orchestrator) ระหว่าง Logic และ UI Components เข้าด้วยกัน
 */
const ManagersOverview = () => {
  const navigate = useNavigate();
  
  // 1. Auth Guard States
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // 2. Modals Control States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);

  // 3. เรียกใช้งานสมองกล (The Brain)
  const dashboardLogic = useManagerDashboard();

  // ==========================================
  // Auth Guard: ตรวจสอบสิทธิ์ก่อนแสดงผล
  // ==========================================
  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      try {
        const profile = await userService.getUserProfile(user.uid);
        if (!profile || (profile.role !== 'Owner' && profile.role !== 'Manager' && profile.role !== 'เจ้าของ' && profile.role !== 'ผู้จัดการ')) {
          navigate('/'); // ดีดกลับถ้าไม่ใช่ผู้บริหาร
        } else {
          setCurrentUserRole(profile.role);
        }
      } catch (error) {
        console.error("Auth Check Error:", error);
        navigate('/');
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoadingAuth) {
    return <div className="p-6 text-center text-[var(--dh-text-muted)] font-bold">กำลังตรวจสอบสิทธิ์...</div>;
  }

  // ==========================================
  // Action Handlers
  // ==========================================
  const handleApproveStaff = async (userId) => {
    const result = await dashboardLogic.approveStaff(userId);
    if (result.success) {
      alert('อนุมัติพนักงานเรียบร้อยแล้ว');
      // หากต้องการปิด Modal ทันทีเมื่ออนุมัติคนสุดท้ายเสร็จ สามารถใส่ Logic ตรวจสอบความยาว Array ได้
      if (dashboardLogic.pendingStaffs.length <= 1) {
          setIsStaffModalOpen(false);
      }
    } else {
      alert('เกิดข้อผิดพลาดในการอนุมัติพนักงาน');
    }
  };

  const handleRevokeVip = async (userId) => {
     const result = await dashboardLogic.revokeVipStatus(userId);
     if(result.success) {
         // UI จะอัปเดตอัตโนมัติจาก Local State ใน Hook
     } else {
         alert('เกิดข้อผิดพลาดในการปลดสิทธิ์ VIP');
     }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* 🟢 Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--dh-text-main)] tracking-tight flex items-center gap-3">
            <ShieldCheck size={28} className="text-[var(--dh-accent)]" />
            ภาพรวมการบริหารจัดการ
          </h1>
          <p className="text-[13px] font-medium text-[var(--dh-text-muted)] mt-1">
            ศูนย์บัญชาการสำหรับตั้งค่าและตรวจสอบภาพรวมระบบทั้งหมด
          </p>
        </div>
      </div>

      {/* 📊 Executive Stats Section */}
      <ExecutiveStats 
        stats={dashboardLogic.stats} 
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenVipModal={() => setIsVipModalOpen(true)}
        onNavigateTodo={() => navigate('/todo')}
      />

      {/* 🛠️ Quick Access Tools Section */}
      <QuickAccessTools 
        onOpenGlobalSettings={() => setIsGlobalSettingsOpen(true)}
        onNavigatePricing={() => navigate('/managers/pricing')}
        onNavigateStaff={() => navigate('/managers/staff')}
        onNavigateTodo={() => navigate('/todo')}
        onNavigateHistory={() => navigate('/history')}
        pendingStaffCount={dashboardLogic.stats.pendingStaffCount}
        pendingTasksCount={dashboardLogic.stats.pendingTasksCount}
      />

      {/* ========================================== */}
      {/* 🧩 Modals Container (ถูกซ่อนไว้ รอการกดเรียก) */}
      {/* ========================================== */}
      
      {/* 1. หน้าต่างอนุมัติพนักงาน */}
      <StaffApprovalModal 
        isOpen={isStaffModalOpen} 
        onClose={() => setIsStaffModalOpen(false)} 
        pendingStaffs={dashboardLogic.pendingStaffs}
        isLoading={dashboardLogic.isLoadingStaffs}
        onApprove={handleApproveStaff}
      />

      {/* 2. หน้าต่างจัดการ VIP */}
      <VipManagementModal 
        isOpen={isVipModalOpen} 
        onClose={() => setIsVipModalOpen(false)} 
        vipUsers={dashboardLogic.vipUsers}
        isLoading={dashboardLogic.isLoadingVips}
        onFetchVips={dashboardLogic.fetchVipUsers}
        onRevokeVip={handleRevokeVip}
      />

      {/* 3. แผงตั้งค่า Global Settings (ของเดิม) */}
      {isGlobalSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-transparent w-full max-w-5xl flex flex-col items-end gap-2">
            <button 
              onClick={() => setIsGlobalSettingsOpen(false)} 
              className="bg-[var(--dh-bg-surface)] text-[var(--dh-text-main)] px-3 py-1.5 rounded-lg border border-[var(--dh-border)] font-black text-[12px] shadow-sm hover:bg-[var(--dh-bg-base)] flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <X size={14}/> ปิดหน้าต่างการตั้งค่า
            </button>
            <div className="w-full h-[85vh] overflow-hidden rounded-xl shadow-2xl border border-[var(--dh-border)]">
               <GlobalSettingsPanel />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagersOverview;