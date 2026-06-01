import React from 'react';
import { 
  X, CheckCircle2, Search, UserPlus, 
  Mail, Briefcase, Calendar, ShieldCheck, User 
} from 'lucide-react';

/**
 * 👥 หน้าต่างอนุมัติพนักงาน (Staff Approval Modal) [Enterprise Edition]
 * รับ Props ข้อมูล `pendingStaffs` และฟังก์ชัน `onApprove` มาจาก useManagerDashboard
 */
const StaffApprovalModal = ({ isOpen, onClose, pendingStaffs, isLoading, onApprove }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Deep Blur Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-slate-200/50 dark:border-slate-700/50 flex flex-col max-h-[85vh] overflow-hidden relative z-10 scale-in-95 animate-in zoom-in-95 duration-300">
        
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500"></div>

        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ระบบตรวจสอบและอนุมัติพนักงาน</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                มีพนักงานใหม่รอการยืนยันตัวตน {pendingStaffs?.length || 0} รายการ
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="ปิดหน้าต่าง"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30 dark:bg-slate-900/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
               <Search size={40} className="animate-spin mb-4 text-indigo-500"/>
               <p className="font-bold text-slate-500 dark:text-slate-400 text-sm tracking-wide">กำลังสแกนฐานข้อมูลพนักงาน...</p>
            </div>
          ) : pendingStaffs && pendingStaffs.length > 0 ? (
            <div className="grid gap-4">
              {pendingStaffs.map((staff) => {
                // รองรับข้อมูลทั้งแบบเก่า (firstName) และแบบใหม่ (displayName จาก Onboarding)
                const staffName = staff.displayName || staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
                const requestedRole = staff.requestedRole || staff.role || 'staff';
                
                return (
                  <div 
                    key={staff.id} 
                    className="p-5 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition-all bg-white dark:bg-slate-800 shadow-sm hover:shadow-md group gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-md shrink-0 overflow-hidden">
                        {staff.photoURL ? (
                          <img src={staff.photoURL} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-slate-400 dark:text-slate-500">{staffName.charAt(0)}</span>
                        )}
                      </div>
                      
                      {/* Staff Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{staffName}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            รออนุมัติ
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                            <Mail size={12} className="text-slate-400" />
                            {staff.email}
                          </span>
                          
                          <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                            <Briefcase size={12} className="text-indigo-500" />
                            ตำแหน่ง: <span className="capitalize">{requestedRole}</span>
                          </span>
                        </div>

                        {/* Additional Metadata (ถ้ามีจากการสมัครผ่าน Form ใหม่) */}
                        {(staff.gender || staff.startDate) && (
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {staff.gender && (
                              <span className="flex items-center gap-1">
                                <User size={12} /> 
                                {staff.gender === 'male' ? 'ชาย' : staff.gender === 'female' ? 'หญิง' : 'ไม่ระบุ'}
                              </span>
                            )}
                            {staff.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={12} /> เริ่มงาน: {staff.startDate}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={() => onApprove(staff.id)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0 group-hover:ring-2 group-hover:ring-emerald-500/30"
                    >
                      <CheckCircle2 size={18} strokeWidth={2.5} /> อนุมัติสิทธิ์
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-80">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-5 border border-emerald-100 dark:border-emerald-800/50 shadow-inner">
                <ShieldCheck size={40} className="text-emerald-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">ไม่มีพนักงานค้างอนุมัติ</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">เยี่ยมมาก! ระบบความปลอดภัยและสิทธิ์การเข้าถึงได้รับการอัปเดตเรียบร้อยแล้ว</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffApprovalModal;