import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Clock, AlertCircle, Loader2, 
  Megaphone, UserCheck, CheckCircle2, ChevronRight, Tags, ChevronDown, X 
} from 'lucide-react';

// 📦 นำเข้า Components ดั้งเดิม
import ExecutiveStats from './ExecutiveStats';
import QuickAccessTools from './QuickAccessTools';
import StaffApprovalModal from './StaffApprovalModal';
import VipManagementModal from './VipManagementModal';
import GlobalSettingsPanel from '../../components/managers/GlobalSettingsPanel'; // 🌟 กู้คืนกลับมา

// 📦 นำเข้า Components ของระบบ To-do
import TodoItem from '../../components/todo/TodoItem';
import WholesaleCard from '../../components/todo/WholesaleCard';

// 🌟 นำเข้า Hooks และ Firebase Services
import { useManagerDashboard } from './useManagerDashboard';
import { useManagerTodo } from '../todo/hooks/useManagerTodo';
import { todoService } from '../../firebase/todoService';
import { claimService } from '../../firebase/claimService';
import { auth, db } from '../../firebase/config';
import { collection, doc, getDocs, query, where, documentId, deleteDoc } from 'firebase/firestore';

export default function ManagersOverview() {
  const navigate = useNavigate();
  
  // 🌟 เรียกใช้งานข้อมูล Dashboard ดั้งเดิม (กู้คืน Logic เก่าทั้งหมด 100%)
  const dashboardLogic = useManagerDashboard() || {};
  
  // 🌟 เรียกใช้งานรายการ To-do ของผู้จัดการ
  const { managerTodos, loading, error } = useManagerTodo();

  // 🌟 States สำหรับ Modals (ดั้งเดิม)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);

  // 🌟 State จัดการ To-do และราคาส่ง
  const [expandedId, setExpandedId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [wholesaleInputs, setWholesaleInputs] = useState({});
  const [fetchedPrices, setFetchedPrices] = useState({}); 

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  // ดึงข้อมูลราคาส่งแบบ Batch
  useEffect(() => {
    const fetchPricesForWholesale = async () => {
      const wholesaleTasks = managerTodos.filter(t => ['WHOLESALE_APPROVAL', 'wholesale_request'].includes(t.type) && t.items);
      if (wholesaleTasks.length === 0) return;
      
      let newFetchedPrices = { ...fetchedPrices };
      let hasChanges = false;
      const productIdsToFetch = new Set();
      const taskProductMap = {};

      wholesaleTasks.forEach(task => {
        if (!newFetchedPrices[task.id]) {
          newFetchedPrices[task.id] = {};
          hasChanges = true; 
        }
        const productIds = task.items.map(item => item.productId).filter(Boolean);
        productIds.forEach(pId => {
           if (newFetchedPrices[task.id][pId] === undefined) {
               productIdsToFetch.add(pId);
               if (!taskProductMap[pId]) taskProductMap[pId] = [];
               taskProductMap[pId].push(task.id);
           }
        });
      });

      const uniqueIds = Array.from(productIdsToFetch);
      if (uniqueIds.length > 0) {
          for(let i=0; i < uniqueIds.length; i+=10) {
              const batchIds = uniqueIds.slice(i, i+10);
              try {
                  const q = query(collection(db, 'products'), where(documentId(), 'in', batchIds));
                  const snapshot = await getDocs(q);
                  const foundPrices = {};
                  snapshot.forEach(doc => { foundPrices[doc.id] = doc.data().wholesalePrice || null; });

                  batchIds.forEach(pId => {
                     const taskIds = taskProductMap[pId] || [];
                     const price = foundPrices[pId] !== undefined ? foundPrices[pId] : null; 
                     taskIds.forEach(tId => {
                         newFetchedPrices[tId][pId] = price;
                         hasChanges = true;
                     });
                  });
              } catch (err) {
                  console.error("Error fetching wholesale prices batch", err);
              }
          }
      }
      if (hasChanges) {
        setFetchedPrices(newFetchedPrices);
      }
    };

    if (managerTodos.length > 0) fetchPricesForWholesale();
  }, [managerTodos]);

  // 🌟 ฟังก์ชันจัดการอนุมัติ/ปฏิเสธงาน To-do
  const handleAction = async (taskId, action, actionType, payload = {}) => {
    setProcessingId(taskId);
    try {
      if (action === 'approve') {
        if (actionType === 'VERIFY_DEALER') {
          await todoService.approveDealer(taskId, payload.userId);
        } else if (actionType === 'CREDIT_APPROVAL') {
          await todoService.approveCredit(taskId, payload.userId, payload.amount, payload.points);
        } else if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType.startsWith('CANCEL_')) {
          await claimService.approveRequest(payload, auth.currentUser.uid, auth.currentUser.displayName || 'Admin');
        } else {
          await todoService.completeTask(taskId);
        }
      } else if (action === 'reject') {
        if (actionType === 'WHOLESALE_APPROVAL' || actionType === 'wholesale_request') {
           await todoService.rejectWholesale(taskId, payload.orderId);
        } else if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType.startsWith('CANCEL_')) {
           await claimService.rejectRequest(payload, payload.reason || 'ปฏิเสธโดยผู้จัดการ', auth.currentUser.uid);
        } else {
           await todoService.rejectTask(taskId, payload.reason);
        }
      } else if (action === 'start') {
        await todoService.startTask(taskId);
      } else if (action === 'complete') {
        await todoService.completeTask(taskId);
      }
    } catch (error) {
      console.error(`Error performing ${action} on task ${taskId}:`, error);
      const errMsg = error.message || '';
      
      if (errMsg.includes('ไม่พบออเดอร์') || errMsg.includes('ไม่พบข้อมูล') || errMsg.includes('not found')) {
        const confirmClear = window.confirm(`⚠️ ระบบแจ้งว่า: "${errMsg}"\n\nต้องการลบงานนี้ทิ้งถาวรหรือไม่?`);
        if (confirmClear) {
           try {
             await deleteDoc(doc(db, 'todos', taskId));
             alert('🗑️ ลบงานที่ค้างออกจากระบบเรียบร้อยแล้วครับ');
           } catch (deleteError) {
             alert(`ลบงานไม่สำเร็จ: ${deleteError.message}`);
           }
        }
      } else {
        alert(`ทำรายการไม่สำเร็จ: ${errMsg}`);
      }
    } finally {
      setProcessingId(null);
    }
  };

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

  const getUrgencyColor = (createdAt) => {
    if (!createdAt) return 'bg-slate-100 text-slate-500 border-slate-200';
    const hours = (new Date() - createdAt.toDate()) / (1000 * 60 * 60);
    if (hours > 24) return 'bg-red-50 text-red-700 border-red-200';
    if (hours > 12) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  // 🎨 [Color-Coding Upgrade]: ปรับชุดสีให้มีความพรีเมียม เพิ่ม ring บางๆ ให้เหมือนป้ายชื่อที่ดูมีราคา
  const getTaskStyles = (type) => {
    switch (true) {
      case ['USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'AD_APPROVAL'].includes(type):
        return { icon: <Megaphone className="w-5 h-5 text-emerald-600"/>, label: 'โฆษณา', path: '/managers/ads', bg: 'bg-emerald-50/80', text: 'text-emerald-700', ring: 'ring-1 ring-emerald-600/20' };
      case ['PARTNER_APPROVAL', 'ACCOUNT_APPROVAL'].includes(type):
        return { icon: <UserCheck className="w-5 h-5 text-purple-600"/>, label: 'บัญชี', path: '/managers/partners', bg: 'bg-purple-50/80', text: 'text-purple-700', ring: 'ring-1 ring-purple-600/20' };
      case ['WHOLESALE_APPROVAL', 'wholesale_request'].includes(type):
        return { icon: <Tags className="w-5 h-5 text-orange-600"/>, label: 'ราคาส่ง', path: '/managers/pricing', bg: 'bg-orange-50/80', text: 'text-orange-700', ring: 'ring-1 ring-orange-600/20' };
      default:
        return { icon: <AlertCircle className="w-5 h-5 text-blue-600"/>, label: 'ตรวจสอบ', path: '/managers', bg: 'bg-blue-50/80', text: 'text-blue-700', ring: 'ring-1 ring-blue-600/20' };
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

      {/* --- 📊 สถิติภาพรวม (อัด Props กลับเข้าไปเหมือนเดิม 100%) --- */}
      <ExecutiveStats 
        stats={dashboardLogic.stats || {}} 
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenVipModal={() => setIsVipModalOpen(true)}
        onNavigateTodo={() => navigate('/todo')}
      />

      {/* --- 🗂️ Grid Layout: ซ้ายเครื่องมือ (2/3) ขวา To-do (1/3) --- */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* 👈 ฝั่งซ้าย: เมนูเครื่องมือด่วน (คืนชีพ Props ทั้งหมดให้คลิกได้) */}
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

        {/* 👉 ฝั่งขวา: กล่องข้อความรอพิจารณา ✨ [Enterprise Upgrade: แผงควบคุมวงกลมที่ 3] */}
        <div className="w-full lg:w-1/3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/10 border border-white/60 dark:border-slate-700/60 flex flex-col relative overflow-hidden">
          
          {/* พื้นหลังตกแต่ง (Glow Effect) */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="p-5 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/50 rounded-t-3xl shrink-0 z-10 relative">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              วาระพิจารณาอนุมัติ
            </h2>
            {!loading && managerTodos.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-3 py-1 rounded-full text-[11px] tracking-wide font-bold border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                {managerTodos.length} รายการ
              </span>
            )}
          </div>

          {error && (
            <div className="m-4 bg-red-50/80 backdrop-blur-md border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium shrink-0 relative z-10">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* 📋 พื้นที่รายการ เลื่อน scroll พร้อมตกแต่ง Scrollbar */}
          <div className="overflow-y-auto p-4 space-y-3.5 max-h-[500px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:rounded-full relative z-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
                <p className="text-slate-500 text-sm font-medium tracking-wide">กำลังซิงค์ข้อมูล...</p>
              </div>
            ) : managerTodos.length === 0 ? (
              
              /* ✨ [Empty State Upgrade]: ออกแบบให้ดูพรีเมียมและเป็นมืออาชีพ */
              <div className="flex flex-col items-center justify-center py-12 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-200/60 dark:border-slate-700 shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 drop-shadow-sm" />
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">ไม่มีรายการค้างพิจารณา</h3>
                <p className="text-slate-400 text-xs mt-1.5 max-w-[200px] leading-relaxed">งานทุกรายการถูกจัดการเรียบร้อยแล้ว ยอดเยี่ยมมากครับ!</p>
              </div>

            ) : (
              managerTodos.map((todo) => {
                const isProcessing = processingId === todo.id;
                const urgencyClass = getUrgencyColor(todo.createdAt || todo.requestedAt);
                const styles = getTaskStyles(todo.type);
                const isExpanded = expandedId === todo.id;

                // 🟡 1. การอนุมัติราคาส่ง 
                if (todo.type === 'WHOLESALE_APPROVAL' || todo.type === 'wholesale_request') {
                  return (
                    <WholesaleCard 
                      key={todo.id}
                      task={todo} 
                      currentUser={auth.currentUser}
                      fetchedData={fetchedPrices[todo.id] || {}}
                      inputs={wholesaleInputs[todo.id] || {}}
                      setWholesaleInputs={setWholesaleInputs}
                      onReject={() => {
                          if (window.confirm(`ยืนยันการปฏิเสธคำขอราคาส่ง #${todo.orderId || ''} ใช่หรือไม่?`)) {
                             handleAction(todo.id, 'reject', todo.type, { orderId: todo.orderId || todo.payload?.orderId });
                          }
                      }}
                    />
                  );
                }

                // 🌟 2. การจัดการคำขอโฆษณา / พาร์ทเนอร์
                if (['USER_SKU_APPROVAL', 'AD_APPROVAL', 'BILLBOARD_APPROVAL', 'PARTNER_APPROVAL', 'ACCOUNT_APPROVAL'].includes(todo.type)) {
                  return (
                    /* ✨ [Hover Effect Upgrade]: การ์ดยกตัวและสว่างขึ้น */
                    <div key={todo.id} className="group border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden bg-white/60 dark:bg-slate-800/40 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 relative z-10">
                      <div 
                        onClick={() => toggleExpand(todo.id)} 
                        className="p-4 cursor-pointer flex items-start gap-3 select-none"
                      >
                        <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.text} ${styles.ring} shrink-0 transition-transform group-hover:scale-105`}>
                          {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${styles.bg} ${styles.text} ${styles.ring}`}>
                              {styles.label}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {todo.createdAt ? new Date(todo.createdAt.toDate()).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-1 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{todo.title}</h3>
                        </div>
                        {/* หมุนลูกศรนุ่มนวลเวลาคลิก */}
                        <div className={`p-1.5 rounded-full text-slate-400 mt-1 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-indigo-50 text-indigo-500' : 'bg-slate-50 dark:bg-slate-800 group-hover:bg-slate-100 group-hover:text-slate-600'}`}>
                          <ChevronDown className="w-4 h-4 shrink-0" />
                        </div>
                      </div>
                      
                      {/* ✨ [Smooth Dropdown]: ใช้ grid-rows ปรับความสูง เพื่อให้ Animation กางออกอย่างนุ่มนวล */}
                      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <div className="p-4 border-t border-slate-100/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="text-xs space-y-2 mb-4 text-slate-600 dark:text-slate-300">
                              {todo.customerName && <p className="flex justify-between"><span className="text-slate-400">ผู้ขอ:</span> <span className="font-medium">{todo.customerName}</span></p>}
                              {(todo.adPayload?.title || todo.targetSkuId) && <p className="flex justify-between"><span className="text-slate-400">อ้างอิง:</span> <span className="font-medium truncate ml-4 text-right">{todo.adPayload?.title || todo.targetSkuId}</span></p>}
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(styles.path); }} 
                              className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
                            >
                              เปิดดูรายละเอียด <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // 🟡 3. งานอื่นๆ (Fallback)
                return (
                  <TodoItem 
                    key={todo.id}
                    todo={todo}
                    isProcessing={isProcessing}
                    isManagerTab={true}
                    urgencyClass={urgencyClass}
                    handleAction={handleAction}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* --- 🧩 Modals เดิมทำงานสมบูรณ์ 100% กู้คืน Props คืนทั้งหมด --- */}
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

      {/* --- 🧩 แผงตั้งค่า Global Settings กู้คืน --- */}
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