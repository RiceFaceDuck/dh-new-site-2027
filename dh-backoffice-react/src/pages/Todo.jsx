import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { collection, doc, getDocs, query, where, documentId, deleteDoc } from 'firebase/firestore'; 
import { 
  CheckCircle2, Inbox, History, Plus, HelpCircle, AlertCircle, 
  PackageSearch, Filter, Loader2, Receipt, ReceiptText, ShieldAlert,
  Tags, LayoutList
} from 'lucide-react';

// 📦 Services
import { todoService } from '../firebase/todoService';
import { claimService } from '../firebase/claimService';

// 🧩 Components
import TodoItem from '../components/todo/TodoItem';
import HistoryPanel from '../components/todo/HistoryPanel';
import WholesaleCard from '../components/todo/WholesaleCard';
import PaymentCard from '../components/todo/PaymentCard'; 
import TaxInvoiceCard from '../components/todo/TaxInvoiceCard';
import NewTaskModal from '../components/todo/forms/NewTaskModal'; // 🌟 นำเข้า Modal แบบใหม่
import { useCentralTodo } from './todo/hooks/useCentralTodo'; // 🌟 นำเข้า Custom Hook

export default function Todo() {
  const navigate = useNavigate();
  
  // 🌟 1. เรียกใช้งานข้อมูลจาก Custom Hook (Data Layer)
  const { 
    activeTodos, 
    completedTodos: hookCompletedTodos, 
    loading, 
    error: fetchError, 
    isSubmitting: isHookSubmitting,
    addManualTodo
  } = useCentralTodo();

  // 📝 2. Local UI States
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  
  // States สำหรับ Components ย่อย
  const [showHelp, setShowHelp] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showCompletedPanel, setShowCompletedPanel] = useState(false);
  
  // States สำหรับจัดการราคาส่งแบบ Batch (Performance Optimization)
  const [wholesaleInputs, setWholesaleInputs] = useState({});
  const [fetchedPrices, setFetchedPrices] = useState({}); 

  // 🔄 3. ระบบดึงราคาส่งแบบ Batch (ป้องกัน N+1 Query)
  useEffect(() => {
    const fetchPricesForWholesale = async () => {
      const wholesaleTasks = activeTodos.filter(t => ['WHOLESALE_APPROVAL', 'wholesale_request'].includes(t.type) && t.items);
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

      if (hasChanges) setFetchedPrices(newFetchedPrices);
    };

    if (activeTodos.length > 0) fetchPricesForWholesale();
  }, [activeTodos, fetchedPrices]);


  // ⚡ 4. Action Handler (จัดการเมื่อมีการกดปุ่มทำรายการ)
  const handleAction = async (taskId, action, actionType, payload = {}) => {
    setProcessingId(taskId);
    try {
      if (action === 'approve') {
        if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType.startsWith('CANCEL_')) {
          await claimService.approveRequest(payload, auth.currentUser.uid, auth.currentUser.displayName || 'Admin');
        }
      } else if (action === 'reject') {
        if (actionType === 'WHOLESALE_APPROVAL' || actionType === 'wholesale_request') {
           await todoService.rejectWholesale(taskId, payload.orderId);
        } else if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType.startsWith('CANCEL_')) {
           await claimService.rejectRequest(payload, payload.reason || 'ปฏิเสธโดยแอดมิน', auth.currentUser.uid);
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
      
      // 💡 ระบบกำจัด Ghost Task
      if (errMsg.includes('ไม่พบออเดอร์') || errMsg.includes('ไม่พบข้อมูล') || errMsg.includes('not found')) {
        if (window.confirm(`⚠️ เกิดข้อผิดพลาด: ออเดอร์หลักอาจถูกลบไปแล้ว\n\nรหัสงาน: ${taskId.slice(-6).toUpperCase()}\n\nต้องการลบงานค้างนี้ทิ้งถาวรหรือไม่?`)) {
           try {
             await deleteDoc(doc(db, 'todos', taskId));
             alert('🗑️ ลบงานที่ค้างออกจากระบบเรียบร้อยแล้ว');
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

  // 📝 5. จัดการรับค่าจาก Modal สร้างงานใหม่
  const handleCreateTask = async (formData) => {
    const success = await addManualTodo(formData);
    if (success) {
      setShowNewTaskModal(false);
    }
  };

  // 🔍 6. ระบบ Filter สำหรับศูนย์ปฏิบัติการ
  const filteredTodos = activeTodos.filter(todo => {
    // 🛡️ [ความปลอดภัย] กรองงานของผู้จัดการออก เพื่อไม่ให้แสดงในหน้านี้โดยเด็ดขาด
    const managerTypes = ['USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL', 'PARTNER_APPROVAL', 'ACCOUNT_APPROVAL', 'AD_APPROVAL'];
    if (managerTypes.includes(todo.type)) return false;

    if (filterType === 'ALL') return true;
    if (filterType === 'TAX_INVOICE') return todo.type === 'issue_tax_invoice';
    if (filterType === 'PAYMENT') return todo.type === 'verify_slip';
    if (filterType === 'CLAIM') return ['CLAIM_APPROVAL', 'RETURN_APPROVAL'].includes(todo.type) || todo.type?.startsWith('CANCEL_');
    if (filterType === 'WHOLESALE') return ['WHOLESALE_APPROVAL', 'wholesale_request'].includes(todo.type);
    if (filterType === 'MANUAL') return todo.type === 'MANUAL';
    
    return true;
  });

  // 🔍 7. ระบบค้นหาอัจฉริยะ (Smart Search)
  const displayTodos = filteredTodos.filter(todo => {
    const searchLower = searchQuery.toLowerCase();
    return searchQuery.trim() === '' || 
      todo.id?.toLowerCase().includes(searchLower) ||
      todo.customerName?.toLowerCase().includes(searchLower) ||
      todo.shippingAddress?.fullName?.toLowerCase().includes(searchLower) ||
      todo.orderId?.toLowerCase().includes(searchLower) ||
      todo.title?.toLowerCase().includes(searchLower);
  });

  // 🎨 Helper: สีกำหนดความด่วน
  const getUrgencyColor = (createdAt) => {
    if (!createdAt) return 'bg-slate-100 text-slate-500';
    const hours = (new Date() - createdAt.toDate()) / (1000 * 60 * 60);
    if (hours > 24) return 'bg-red-100 text-red-700 border border-red-200';
    if (hours > 12) return 'bg-orange-100 text-orange-700 border border-orange-200';
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* --- 🌟 Header Section --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Inbox className="w-8 h-8 text-blue-600" />
            ศูนย์ปฏิบัติการ (Operations)
          </h1>
          <p className="text-slate-500 mt-1 font-medium flex items-center gap-2 text-sm">
            จัดการงานเอกสาร, เคลมสินค้า, บัญชี และงานประจำวัน
            <button onClick={() => setShowHelp(true)} className="text-blue-500 hover:bg-blue-50 p-1 rounded-full transition-colors" title="คู่มือ">
              <HelpCircle className="w-4 h-4" />
            </button>
          </p>
        </div>
        <div className="flex gap-3 relative z-10 w-full sm:w-auto">
          <button 
            onClick={() => setShowCompletedPanel(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <History className="w-4 h-4" /> ประวัติ
          </button>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> สร้างงาน
          </button>
        </div>
      </div>

      {/* --- 🚨 Error Alert --- */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{fetchError}</p>
        </div>
      )}

      {/* --- 🎛️ Navigation & Filters --- */}
      <div className="bg-white dark:bg-slate-800 p-2 sm:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
        
        {/* แถบค้นหา */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <div className="relative w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PackageSearch className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                    type="text" 
                    placeholder="ค้นหา (ชื่อลูกค้า, Order ID, หัวข้องาน)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 transition-all"
                />
            </div>
            {searchQuery && (
                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg whitespace-nowrap self-end sm:self-auto">
                    พบ {displayTodos.length} รายการ
                </span>
            )}
        </div>

        {/* หมวดหมู่งาน (Operations Specific) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar w-full">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-1 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" /> จัดกลุ่ม:
            </div>
            
            <button onClick={() => setFilterType('ALL')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterType === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <LayoutList size={14} className="inline mr-1" /> ทั้งหมด
            </button>
            <button onClick={() => setFilterType('PAYMENT')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterType === 'PAYMENT' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
              <Receipt size={14} className="inline mr-1" /> ตรวจสลิป
            </button>
            <button onClick={() => setFilterType('TAX_INVOICE')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterType === 'TAX_INVOICE' ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'}`}>
              <ReceiptText size={14} className="inline mr-1" /> ใบกำกับภาษี
            </button>
            <button onClick={() => setFilterType('CLAIM')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterType === 'CLAIM' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}>
              <ShieldAlert size={14} className="inline mr-1" /> เคลม/คืน
            </button>
            <button onClick={() => setFilterType('WHOLESALE')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterType === 'WHOLESALE' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'}`}>
              <Tags size={14} className="inline mr-1" /> ขอราคาส่ง
            </button>
        </div>
      </div>

      {/* --- 📋 Data Display --- */}
      {loading ? (
        // Loading Skeleton
        <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลศูนย์ปฏิบัติการ...</p>
        </div>
      ) : displayTodos.length === 0 ? (
        // Empty State
        <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
             {searchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ยอดเยี่ยม! ไม่มีงานปฏิบัติการค้าง'}
          </h3>
          <p className="text-slate-500 max-w-sm text-sm">
            {searchQuery 
               ? `ไม่มีข้อมูลที่ตรงกับคำว่า "${searchQuery}"` 
               : 'คุณจัดการเอกสารและรายการทั้งหมดเรียบร้อยแล้ว พักผ่อนได้เลย!'
            }
          </p>
        </div>
      ) : (
        // Task Grid
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayTodos.map(todo => {
            const isProcessing = processingId === todo.id;
            const urgencyClass = getUrgencyColor(todo.createdAt || todo.requestedAt);

            // 🟡 1. การขอราคาส่ง
            if (todo.type === 'WHOLESALE_APPROVAL' || todo.type === 'wholesale_request') {
              return (
                <div key={todo.id} className="md:col-span-2 xl:col-span-3">
                  <WholesaleCard 
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
                </div>
              );
            }

            // 🟡 2. การตรวจสลิปโอนเงิน
            if (todo.type === 'verify_slip') {
              return (
                <div key={todo.id} className="md:col-span-2 xl:col-span-3">
                  <PaymentCard task={todo} currentUser={auth.currentUser} />
                </div>
              );
            }

            // 🟡 3. การออกใบกำกับภาษี
            if (todo.type === 'issue_tax_invoice') {
               return (
                  <div key={todo.id} className="md:col-span-2 xl:col-span-3">
                     <TaxInvoiceCard task={todo} currentUser={auth.currentUser} />
                  </div>
               )
            }

            // 🟡 4. Fallback สำหรับงานเคลมและงาน Manual ทั่วไป
            return (
              <TodoItem 
                key={todo.id}
                todo={todo}
                isProcessing={isProcessing}
                isManagerTab={false} // บังคับเป็น false เพราะหน้านี้ลบระบบผู้จัดการออกแล้ว
                urgencyClass={urgencyClass}
                handleAction={handleAction}
              />
            );
          })}
        </div>
      )}

      {/* --- 🧩 Modals & Panels --- */}
      
      {/* Modal สร้างงานใหม่ ที่ถูกแยก Component ออกไปใน Step 2 */}
      <NewTaskModal 
        isOpen={showNewTaskModal} 
        onClose={() => setShowNewTaskModal(false)} 
        onSubmit={handleCreateTask}
        isSubmitting={isHookSubmitting}
      />

      {/* Panel ประวัติการทำงาน */}
      <HistoryPanel 
        showCompletedPanel={showCompletedPanel} 
        setShowCompletedPanel={setShowCompletedPanel} 
        loadingCompleted={loading} // ใช้ loading จาก hook ได้เลย (หรือจะสร้าง function ย่อยใน hook สำหรับ history ก็ได้)
        completedTodos={hookCompletedTodos} 
      />

    </div>
  );
}