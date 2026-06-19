import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, AlertCircle, CheckCircle2, UserPlus, Eye, EyeOff, ArrowLeft, Briefcase } from 'lucide-react';
import { ROLES } from '../../firebase/userService';
import StaffTable from './components/staff/StaffTable';
import StaffAddModal from './components/staff/StaffAddModal';
import StaffEditModal from './components/staff/StaffEditModal';
import StaffDetailModal from './components/staff/StaffDetailModal';
import { useStaffManagement } from './hooks/useStaffManagement';
import GuideModal from '../../components/common/GuideModal';

// Ensure ROLES is available, or redefine it here if not exported from userService
const DISPLAY_ROLES = ['Admin', 'Manager', 'Staff', 'Packer', 'Developer'];

export default function StaffManagement() {
  const navigate = useNavigate();
  const {
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    showSuspended,
    setShowSuspended,
    toast,
    modalConfig,
    closeModal,
    editingStaff,
    setEditingStaff,
    viewingStaff,
    setViewingStaff,
    showAddModal,
    setShowAddModal,
    filteredStaff,
    handleRoleChange,
    handleToggleStatus,
    handleDeleteStaff,
    fetchStaff,
    showToast
  } = useStaffManagement();

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 relative h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/managers')} 
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors w-fit group"
        >
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          ย้อนกลับไปหน้าผู้จัดการ (Overview)
        </button>
        <button onClick={() => setIsGuideOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 shadow-sm dh-active-press">
          <AlertCircle size={16} /> คู่มือการใช้งาน
        </button>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-fade-in-down border backdrop-blur-md ${
          toast.type === 'success' 
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-900/80 dark:border-emerald-700/50 dark:text-emerald-300' 
            : 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/80 dark:border-red-700/50 dark:text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {modalConfig && modalConfig.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 border border-slate-100 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-8">
              <div className={`p-4 rounded-2xl shrink-0 shadow-inner ${
                modalConfig.type === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
              }`}>
                <AlertCircle size={28} strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">{modalConfig.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{modalConfig.desc}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => { modalConfig.action(); closeModal(); }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all active:scale-95 ${
                  modalConfig.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                }`}
              >
                ยืนยันดำเนินการ
              </button>
            </div>
          </div>
        </div>
      )}

      <StaffAddModal 
        showAddModal={showAddModal} 
        setShowAddModal={setShowAddModal} 
        showToast={showToast} 
        fetchStaff={fetchStaff} 
      />

      <StaffEditModal 
        editingStaff={editingStaff} 
        setEditingStaff={setEditingStaff} 
        showToast={showToast} 
        fetchStaff={fetchStaff} 
      />

      <StaffDetailModal 
        viewingStaff={viewingStaff} 
        setViewingStaff={setViewingStaff} 
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
               <Users size={24} />
            </div>
            ทะเบียนเจ้าหน้าที่ (Staff Management)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
            เพิ่มพนักงานใหม่, ดูประวัติและข้อมูลการทำงาน, อัปเดตตำแหน่ง และจัดการสถานะบัญชีอย่างครบวงจร
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 shrink-0"
        >
          <UserPlus size={18} strokeWidth={2.5} /> แต่งตั้งพนักงานใหม่
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาด้วยชื่อ หรือ อีเมลพนักงาน..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:w-56 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Briefcase className="text-indigo-500 shrink-0" size={16} />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-1.5 bg-transparent text-sm font-bold focus:outline-none dark:text-white cursor-pointer"
            >
              <option value="all">ทุกตำแหน่ง (All Roles)</option>
              <option value="owner">Owner (เจ้าของ)</option>
              {DISPLAY_ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
            </select>
          </div>
          
          <button
            onClick={() => setShowSuspended(!showSuspended)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shrink-0 w-full sm:w-auto ${
              showSuspended 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shadow-sm' 
                : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {showSuspended ? <Eye size={18} strokeWidth={2.5} /> : <EyeOff size={18} strokeWidth={2.5} />}
            <span>บัญชีที่ถูกแบน</span>
          </button>
        </div>
      </div>

      <StaffTable 
        loading={loading}
        filteredStaff={filteredStaff}
        setViewingStaff={setViewingStaff}
        setEditingStaff={setEditingStaff}
        handleRoleChange={handleRoleChange}
        handleToggleStatus={handleToggleStatus}
        handleDeleteStaff={handleDeleteStaff}
      />

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="คู่มือ: ทะเบียนเจ้าหน้าที่ (Staff Management)"
        config={{
          description: "ระบบสำหรับบริหารจัดการพนักงานทั้งหมดในระบบ คุณสามารถแต่งตั้งพนักงานใหม่ กำหนดสิทธิ์การเข้าถึง (Roles) และระงับบัญชีเมื่อพนักงานลาออกหรือทำผิดกฎ",
          howTo: [
            "<strong>การเพิ่มพนักงานใหม่:</strong> คลิกปุ่ม <code>แต่งตั้งพนักงานใหม่</code> กรอกข้อมูล ชื่อ, อีเมล และเลือกระดับสิทธิ์ที่เหมาะสม",
            "<strong>การค้นหาและกรอง:</strong> ใช้ช่องค้นหาเพื่อหาชื่อ/อีเมล และใช้ Dropdown <code>ทุกตำแหน่ง</code> เพื่อกรองพนักงานตามแผนก",
            "<strong>การระงับบัญชี (Suspend):</strong> หากพนักงานพ้นสภาพ ให้กดไอคอนรูปลูกกุญแจ/แบน เพื่อระงับการเข้าถึงระบบชั่วคราวหรือถาวร",
            "<strong>การลบบัญชี:</strong> ควรกระทำเมื่อมั่นใจว่าไม่มีความเกี่ยวข้องกับเอกสารสำคัญ เนื่องจากอาจมีผลกับ History Log ของพนักงานคนนั้น"
          ],
          tips: [
            "แนะนำให้ <strong>ระงับบัญชี (Suspend)</strong> แทนการ <strong>ลบ (Delete)</strong> เพื่อให้ระบบสามารถอ้างอิงชื่อพนักงานกับบิลการขายเดิมได้",
            "คุณสามารถตรวจสอบบัญชีที่ถูกแบนไปแล้วได้โดยคลิกปุ่ม <code>บัญชีที่ถูกแบน (ไอคอนดวงตา)</code>"
          ],
          expectedResults: "เมื่อคุณปรับเปลี่ยนสถานะหรือระดับสิทธิ์พนักงาน ระบบจะบันทึกประวัติการกระทำของคุณ (Audit Log) และมีผลบังคับใช้กับการเข้าสู่ระบบของพนักงานคนนั้นทันที"
        }}
      />
      
    </div>
  );
}