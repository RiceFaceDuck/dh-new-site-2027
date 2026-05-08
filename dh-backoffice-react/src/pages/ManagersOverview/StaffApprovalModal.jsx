import React from 'react';
import { X, CheckCircle2, Search } from 'lucide-react';

/**
 * 👥 หน้าต่างอนุมัติพนักงาน (Staff Approval Modal)
 * รับ Props ข้อมูล `pendingStaffs` และฟังก์ชัน `approveStaff` มาจาก useManagerDashboard
 */
const StaffApprovalModal = ({ isOpen, onClose, pendingStaffs, isLoading, onApprove }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[var(--dh-bg-surface)] w-full max-w-3xl rounded-2xl shadow-2xl border border-[var(--dh-border)] flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--dh-border)] flex justify-between items-center bg-orange-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-[16px] font-black text-[var(--dh-text-main)]">พนักงานใหม่รออนุมัติ</h2>
              <p className="text-[12px] font-medium text-[var(--dh-text-muted)]">ตรวจสอบและยืนยันตัวตนพนักงานใหม่</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--dh-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
               <Search size={32} className="animate-spin mb-4 text-[var(--dh-text-muted)]"/>
               <p className="font-bold text-[var(--dh-text-muted)] text-[12px]">กำลังดึงข้อมูล...</p>
            </div>
          ) : pendingStaffs.length > 0 ? (
            <div className="grid gap-3">
              {pendingStaffs.map((staff) => (
                <div key={staff.id} className="p-4 border border-[var(--dh-border)] rounded-xl flex items-center justify-between hover:border-orange-300 transition-colors bg-[var(--dh-bg-base)]">
                  <div className="flex items-center gap-4">
                    <img 
                      src={staff.photoURL || `https://ui-avatars.com/api/?name=${staff.firstName}&background=random`} 
                      alt="profile" 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    />
                    <div>
                      <h4 className="text-[14px] font-black text-[var(--dh-text-main)]">{staff.firstName} {staff.lastName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-[var(--dh-text-muted)] bg-white px-2 py-0.5 rounded-md border border-[var(--dh-border)]">
                          {staff.email}
                        </span>
                        <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">
                          ตำแหน่งที่ต้องการ: {staff.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onApprove(staff.id)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-black rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> อนุมัติการเข้าใช้งาน
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
              <div className="w-16 h-16 bg-[var(--dh-bg-base)] rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-[15px] font-black text-[var(--dh-text-main)] mb-1">ไม่มีพนักงานค้างอนุมัติ</h3>
              <p className="text-[12px] font-medium text-[var(--dh-text-muted)]">เยี่ยมมาก! คุณจัดการเอกสารครบหมดแล้ว</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffApprovalModal;