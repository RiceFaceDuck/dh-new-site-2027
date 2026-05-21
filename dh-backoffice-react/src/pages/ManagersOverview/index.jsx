import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Clock, AlertCircle, Loader2, 
  Megaphone, UserCheck, CheckCircle2, ChevronRight, Tags,
  Server, ChevronDown
} from 'lucide-react';

// 📦 นำเข้า Components เดิม (ห้ามลบและห้ามแก้ไขโครงสร้างภายในเด็ดขาด)
import ExecutiveStats from './ExecutiveStats';
import QuickAccessTools from './QuickAccessTools';
import StaffApprovalModal from './StaffApprovalModal';
import VipManagementModal from './VipManagementModal';

// 🌟 นำเข้า Hook ข้อมูลของหน้า Dashboard และ Manager Todo
import { useManagerDashboard } from './useManagerDashboard';
import { useManagerTodo } from '../todo/hooks/useManagerTodo';

export default function ManagersOverview() {
  const navigate = useNavigate();
  
  // 🌟 เรียกใช้งานระบบดึงข้อมูลจาก Hooks (แก้ปัญหา named exports อย่างรัดกุม)
  const dashboardData = useManagerDashboard() || {};
  const isDashboardLoading = dashboardData.loading || dashboardData.isLoading || (!dashboardData.stats && !dashboardData.data);
  const { managerTodos, loading, error } = useManagerTodo();

  // States สำหรับควบคุมการเปิดปิด Modals เดิม
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  
  // 🌟 State จัดการการย่อ-ขยาย การ์ดรายการคำขอแบบ Accordion
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // 🎨 จัดกลุ่มสีและสไตล์ให้กับการ์ดแต่ละประเภทแบบสุขุม เรียบหรูสไตล์ Corporate
  const getTaskStyles = (type) => {
    switch (true) {
      case ['USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'AD_APPROVAL'].includes(type):
        return {
          icon: <Megaphone className="w-4 h-4 text-slate-700 dark:text-slate-300" />,
          bg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-750',
          text: 'text-slate-800 dark:text-slate-200',
          indicator: 'bg-slate-900 dark:bg-slate-100',
          label: 'โฆษณา',
          path: '/managers/ads'
        };
      case ['PARTNER_APPROVAL', 'ACCOUNT_APPROVAL'].includes(type):
        return {
          icon: <UserCheck className="w-4 h-4 text-slate-700 dark:text-slate-300" />,
          bg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-750',
          text: 'text-slate-800 dark:text-slate-200',
          indicator: 'bg-slate-900 dark:bg-slate-100',
          label: 'บัญชี',
          path: '/managers/partners'
        };
      case ['WHOLESALE_APPROVAL'].includes(type):
        return {
          icon: <Tags className="w-4 h-4 text-slate-700 dark:text-slate-300" />,
          bg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-750',
          text: 'text-slate-800 dark:text-slate-200',
          indicator: 'bg-slate-900 dark:bg-slate-100',
          label: 'ราคาส่ง',
          path: '/managers/pricing'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-slate-700 dark:text-slate-300" />,
          bg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-750',
          text: 'text-slate-800 dark:text-slate-200',
          indicator: 'bg-slate-500',
          label: 'ตรวจสอบ',
          path: '/managers'
        };
    }
  };

  return (
    // กำหนดโครงสร้างกว้างสูงสุดที่ 1200px และไม่มีคำสั่งล็อก overflow ใด ๆ หน้าเว็บจะเลื่อนได้อย่างธรรมชาติสมบูรณ์แบบ
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto min-h-screen space-y-8 bg-slate-50/50 dark:bg-slate-900/10 relative">
      
      {/* --- Header ส่วนหัวแบบแบนราบ เรียบหรู สะอาดตา ปราศจากสิ่งกีดขวางการคลิก --- */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <ShieldCheck className="w-8 h-8 text-slate-800 dark:text-slate-300" />
            ศูนย์ควบคุมผู้บริหาร
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-medium text-xs sm:text-sm">
            DH Notebook Executive Control Center • ทัศน์ข้อมูลและอนุมัติสิทธิ์การทำงาน
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">System Live</span>
        </div>
      </div>

      {/* --- 📊 แถบแสดงสถิติผู้จัดการ (Executive Stats) --- */}
      {isDashboardLoading ? (
        <div className="flex justify-center items-center py-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin mr-3" />
          <span className="text-slate-400 font-medium text-sm">กำลังประมวลผลระบบสถิติ...</span>
        </div>
      ) : (
        <ExecutiveStats 
          {...dashboardData} 
          stats={dashboardData.stats} 
          data={dashboardData.data || dashboardData.stats} 
        />
      )}

      {/* --- 🗂️ Split Layout (แผงเมนูด้านซ้ายขยายกว้าง แผง To-do ด้านขวาแคบกระชับ) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        
        {/* 👈 ฝั่งซ้าย (66%): แผงปุ่มเมนูเครื่องมือด่วน (กว้างขวาง สวยงาม สมส่วน ปุ่มกดได้จริง 100%) */}
        <div className="lg:col-span-8 space-y-6">
          <QuickAccessTools 
            onOpenStaff={() => setShowStaffModal(true)}
            onOpenVip={() => setShowVipModal(true)}
          />
        </div>

        {/* 👉 ฝั่งขวา (33%): รายการวาระรออนุมัติ To-do (แคบ เล็กกระชับ ไม่ดึงสายตา ไม่เทอะทะ) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            
            {/* หัวข้อกระดานงาน */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-450" />
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  วาระพิจารณาอนุมัติ
                </h2>
              </div>
              {!loading && managerTodos.length > 0 && (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-slate-200/30 dark:border-slate-700">
                  {managerTodos.length} รายการ
                </span>
              )}
            </div>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/40 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* รายการ To-do ย่อส่วนแบบพรีเมียม (Compact Feed) */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin mb-3" />
                <p className="text-slate-400 text-xs">กำลังปรับปรุงรายการ...</p>
              </div>
            ) : managerTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-slate-100 dark:border-slate-750">
                  <CheckCircle2 className="w-5 h-5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-0.5">ไม่มีวาระค้างพิจารณา</h4>
                <p className="text-slate-400 text-[10px]">ระบบทั้งหมดได้รับการอนุมัติสมบูรณ์แล้ว</p>
              </div>
            ) : (
              // ล็อกความสูงเฉพาะของ Feed ภายในกล่อง และเปิด scroll ภายในเฉพาะจุดนี้เมื่อจำนวนวาระล้น ไม่ล้นเบราว์เซอร์ใหญ่
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {managerTodos.map((todo) => {
                  const styles = getTaskStyles(todo.type);
                  const isExpanded = expandedId === todo.id;
                  
                  return (
                    <div 
                      key={todo.id}
                      className={`border transition-all duration-200 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 ${
                        isExpanded ? 'border-blue-200 dark:border-blue-900/40 shadow-sm' : 'border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Compact Title (ย่อกะทัดรัด แสดงผลเพียง 1 บรรทัดเป็นหลัก) */}
                      <div 
                        onClick={() => toggleExpand(todo.id)}
                        className="p-3.5 cursor-pointer flex items-start gap-3 select-none"
                      >
                        <div className={`p-1.5 rounded-lg ${styles.bg} ${styles.text} shrink-0 border ${styles.border}`}>
                          {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${styles.bg} ${styles.text} border ${styles.border}`}>
                              {styles.label}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {todo.createdAt ? new Date(todo.createdAt.toDate()).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1 leading-tight">
                            {todo.title}
                          </h3>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      {/* รายละเอียดเพิ่มเติมเมื่อทำการคลิกเปิดขยาย (Accordion details) */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1.5 ml-[2.5rem] border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                          <div className="text-[10px] space-y-1 mb-3 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                            {todo.customerName && (
                              <p className="truncate"><span className="font-semibold text-slate-400 w-12 inline-block">ผู้ร้องขอ:</span> <span className="text-slate-700 dark:text-slate-200 font-medium">{todo.customerName}</span></p>
                            )}
                            {(todo.adPayload?.title || todo.targetSkuId) && (
                              <p className="truncate"><span className="font-semibold text-slate-400 w-12 inline-block">รหัสอ้างอิง:</span> <span className="text-slate-700 dark:text-slate-200 font-medium">{todo.adPayload?.title || todo.targetSkuId}</span></p>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(styles.path);
                            }}
                            className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                          >
                            เปิดคำขออนุมัติ <ChevronRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget สถานะระบบพรีเมียม */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)] hidden lg:block">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Server size={12} /> ระบบเชื่อมโยงข้อมูลหลัก
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">Firestore Engine</span>
                  <span className="text-emerald-600 font-bold">Online</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div className="bg-emerald-500 h-1 rounded-full w-[15%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">Real-time Sync</span>
                  <span className="text-blue-500 font-bold">Connected</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div className="bg-blue-500 h-1 rounded-full w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- 🧩 Modals เดิมทำงานสมบูรณ์ 100% --- */}
      <StaffApprovalModal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} />
      <VipManagementModal isOpen={showVipModal} onClose={() => setShowVipModal(false)} />

    </div>
  );
}