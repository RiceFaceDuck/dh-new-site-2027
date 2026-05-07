import React, { useState, useEffect } from 'react';
import { todoService } from '../firebase/todoService';
import { auth, db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore'; 
import NonExistingProducts from './todo/NonExistingProducts';
import { 
  Check, X, Clock, UserPlus, Tag, Info, AlertCircle, 
  Inbox, ListFilter, HelpCircle, Plus, History, XCircle, 
  RotateCcw, Calendar, Receipt, ChevronRight, Calculator, Loader2, PackageSearch, CheckCircle2, Filter, FileText
} from 'lucide-react';

import TodoItem from '../components/todo/TodoItem';
import HistoryPanel from '../components/todo/HistoryPanel';
import WholesaleCard from '../components/todo/WholesaleCard';
import PaymentCard from '../components/todo/PaymentCard'; 
import TaxInvoiceCard from '../components/todo/TaxInvoiceCard'; // 🟡 เพิ่ม TaxInvoiceCard

export default function Todo() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(''); 
  const [activeTab, setActiveTab] = useState('approvals'); 
  const [filterType, setFilterType] = useState('ALL');
  
  const [processingId, setProcessingId] = useState(null);
  const [wholesaleInputs, setWholesaleInputs] = useState({});
  const [fetchedPrices, setFetchedPrices] = useState({}); 

  const [showHelp, setShowHelp] = useState(false);
  const [helpPage, setHelpPage] = useState(1);

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'Medium', type: 'GENERAL', dueDate: ''
  });

  const [showCompletedPanel, setShowCompletedPanel] = useState(false);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);

  useEffect(() => {
    let unsubscribeApprovals;
    let unsubscribeTasks;
  
    setLoading(true);
    setFetchError('');
  
    try {
      if (activeTab === 'approvals') {
        unsubscribeApprovals = todoService.subscribeManagerApprovals(
          (data) => {
            setTodos(data);
            setLoading(false);
            setFetchError('');
          },
          (error) => {
            console.error("Subscription Error (Approvals):", error);
            setFetchError('ไม่สามารถดึงข้อมูลรายการอนุมัติได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง หรือดัชนีฐานข้อมูล (Index)');
            setLoading(false);
          }
        );
      } else {
        unsubscribeTasks = todoService.subscribePendingTodos(
          (data) => {
            // กรองงาน WHOLESALE ออก ให้ไปอยู่แท็บ approvals ให้หมด
            const tasks = data.filter(t => !['WHOLESALE_APPROVAL', 'wholesale_request'].includes(t.type));
            setTodos(tasks);
            setLoading(false);
            setFetchError('');
          },
          (error) => {
            console.error("Subscription Error (Tasks):", error);
            setFetchError('ไม่สามารถดึงข้อมูลรายการปฏิบัติงานได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง');
            setLoading(false);
          }
        );
      }
    } catch (err) {
      console.error("Try-Catch Error:", err);
      setFetchError('เกิดข้อผิดพลาดร้ายแรงในการเชื่อมต่อฐานข้อมูล');
      setLoading(false);
    }
  
    return () => {
      if (unsubscribeApprovals) unsubscribeApprovals();
      if (unsubscribeTasks) unsubscribeTasks();
    };
  }, [activeTab]);

  useEffect(() => {
    const fetchPricesForWholesale = async () => {
      const wholesaleTasks = todos.filter(t => t.type === 'WHOLESALE_APPROVAL' && t.items);
      
      const newFetchedPrices = { ...fetchedPrices };
      let hasChanges = false;

      for (const task of wholesaleTasks) {
        if (!newFetchedPrices[task.id]) {
          newFetchedPrices[task.id] = {};
        }

        const productIds = task.items.map(item => item.productId).filter(Boolean);
        
        if (productIds.length > 0) {
           for(let i=0; i < productIds.length; i+=10) {
              const batchIds = productIds.slice(i, i+10);
              try {
                const q = query(collection(db, 'products'), where(documentId(), 'in', batchIds));
                const snapshot = await getDocs(q);
                
                snapshot.forEach(doc => {
                  const data = doc.data();
                  if (data.wholesalePrice) {
                    newFetchedPrices[task.id][doc.id] = data.wholesalePrice;
                    hasChanges = true;
                  }
                });
              } catch (err) {
                console.error("Error fetching wholesale prices for task", task.id, err);
              }
           }
        }
      }

      if (hasChanges) {
        setFetchedPrices(newFetchedPrices);
      }
    };

    if (todos.length > 0) {
      fetchPricesForWholesale();
    }
  }, [todos]);

  const loadCompletedTodos = async () => {
    setLoadingCompleted(true);
    try {
      const data = await todoService.getCompletedTodos(50);
      setCompletedTodos(data);
    } catch (error) {
      console.error("Error loading history", error);
    }
    setLoadingCompleted(false);
  };

  useEffect(() => {
    if (showCompletedPanel) {
      loadCompletedTodos();
    }
  }, [showCompletedPanel]);

  const handleAction = async (taskId, action, actionType, payload = {}) => {
    setProcessingId(taskId);
    try {
      if (action === 'approve') {
        if (actionType === 'VERIFY_DEALER') {
          await todoService.approveDealer(taskId, payload.userId);
        } else if (actionType === 'CREDIT_APPROVAL') {
          await todoService.approveCredit(taskId, payload.userId, payload.amount, payload.points);
        }
      } else if (action === 'reject') {
        if (actionType === 'WHOLESALE_APPROVAL' || actionType === 'wholesale_request') {
           await todoService.rejectWholesale(taskId, payload.orderId);
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
      alert(`ทำรายการไม่สำเร็จ: ${error.message}`);
    }
    setProcessingId(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if(!taskForm.title) return alert('กรุณาระบุหัวข้องาน');
    
    try {
      await todoService.createManualTask(taskForm, auth.currentUser);
      setShowNewTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'Medium', type: 'GENERAL', dueDate: '' });
      alert('สร้างงานสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('สร้างงานไม่สำเร็จ');
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filterType === 'ALL') return true;
    if (filterType === 'RETAIL') return todo.customerType === 'retail';
    if (filterType === 'DEALER') return todo.customerType === 'dealer';
    // กรองประเภทงานใน Tab งานปฏิบัติการ
    if (filterType === 'TAX_INVOICE' && activeTab === 'tasks') return todo.type === 'issue_tax_invoice';
    if (filterType === 'PAYMENT' && activeTab === 'tasks') return todo.type === 'verify_slip';
    return true;
  });

  const getUrgencyColor = (createdAt) => {
    if (!createdAt) return 'bg-gray-100 text-gray-500';
    const hours = (new Date() - createdAt.toDate()) / (1000 * 60 * 60);
    if (hours > 24) return 'bg-red-100 text-red-700 border border-red-200';
    if (hours > 12) return 'bg-orange-100 text-orange-700 border border-orange-200';
    return 'bg-green-100 text-green-700 border border-green-200';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-dh-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-dh-accent opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-dh-main flex items-center gap-3">
            <Inbox className="w-8 h-8 text-dh-accent" />
            ศูนย์ปฏิบัติการ (To-Do & Approvals)
          </h1>
          <p className="text-dh-muted mt-1 font-medium flex items-center gap-2">
            จัดการคำขออนุมัติ, ตรวจสอบการชำระเงิน และเอกสารภาษี
            <button onClick={() => setShowHelp(true)} className="text-dh-accent hover:bg-orange-50 p-1 rounded-full transition-colors" title="คู่มือการใช้งาน">
              <HelpCircle className="w-4 h-4" />
            </button>
          </p>
        </div>
        <div className="flex gap-2 relative z-10 w-full sm:w-auto">
          <button 
            onClick={() => setShowCompletedPanel(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-dh-border text-dh-main font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <History className="w-4 h-4 text-slate-500" />
            ประวัติการทำงาน
          </button>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-dh-main text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            สร้างงาน
          </button>
        </div>
      </div>

      {/* 🚨 แสดง Error ถ้ามี */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm animate-pulse">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{fetchError}</p>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-full md:w-auto border border-dh-border">
          <button 
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'approvals' ? 'bg-white text-dh-accent shadow-sm' : 'text-dh-muted hover:text-dh-main'}`}
            onClick={() => { setActiveTab('approvals'); setFilterType('ALL'); }}
          >
            <CheckCircle2 className="w-4 h-4" />
            รอการอนุมัติ 
            {activeTab === 'approvals' && todos.length > 0 && <span className="bg-orange-100 text-dh-accent px-2 py-0.5 rounded-full text-xs ml-1">{todos.length}</span>}
          </button>
          <button 
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'tasks' ? 'bg-white text-dh-main shadow-sm' : 'text-dh-muted hover:text-dh-main'}`}
            onClick={() => { setActiveTab('tasks'); setFilterType('ALL'); }}
          >
            <PackageSearch className="w-4 h-4" />
            งานปฏิบัติการ
            {activeTab === 'tasks' && todos.length > 0 && <span className="bg-slate-100 text-dh-main px-2 py-0.5 rounded-full text-xs ml-1">{todos.length}</span>}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="flex items-center gap-2 text-sm font-medium text-dh-muted mr-2">
            <Filter className="w-4 h-4" /> กรอง:
          </div>
          
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${
              filterType === 'ALL' ? 'bg-dh-main text-white border-dh-main' : 'bg-white text-dh-muted border-dh-border hover:bg-slate-50'
            }`}
          >
            ทั้งหมด
          </button>

          {activeTab === 'tasks' ? (
             // ตัวกรองเฉพาะของ "งานปฏิบัติการ"
             <>
               <button
                  onClick={() => setFilterType('PAYMENT')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${
                    filterType === 'PAYMENT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  ตรวจสลิป
                </button>
                <button
                  onClick={() => setFilterType('TAX_INVOICE')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${
                    filterType === 'TAX_INVOICE' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'
                  }`}
                >
                  ออกใบกำกับภาษี
                </button>
             </>
          ) : (
            // ตัวกรองเฉพาะของ "รอการอนุมัติ"
            <>
               <button
                onClick={() => setFilterType('RETAIL')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${
                  filterType === 'RETAIL' ? 'bg-dh-main text-white border-dh-main' : 'bg-white text-dh-muted border-dh-border hover:bg-slate-50'
                }`}
              >
                ลูกค้าปลีก
              </button>
              <button
                onClick={() => setFilterType('DEALER')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${
                  filterType === 'DEALER' ? 'bg-dh-main text-white border-dh-main' : 'bg-white text-dh-muted border-dh-border hover:bg-slate-50'
                }`}
              >
                ลูกค้าส่ง (Dealer)
              </button>
            </>
          )}
          
        </div>
      </div>

      {/* Todo List Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dh-border/50">
          <Loader2 className="w-10 h-10 text-dh-accent animate-spin mb-4" />
          <p className="text-dh-muted font-medium animate-pulse">กำลังโหลดรายการงาน...</p>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-dh-border shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-dh-main mb-2">ยอดเยี่ยม! เคลียร์งานหมดแล้ว</h3>
          <p className="text-dh-muted max-w-sm">
            {activeTab === 'approvals' ? 'ไม่มีรายการรอพิจารณาอนุมัติในขณะนี้' : 'ไม่มีงานปฏิบัติการค้างในระบบ'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTodos.map(todo => {
            const isProcessing = processingId === todo.id;
            const isManagerTab = activeTab === 'approvals';
            const urgencyClass = getUrgencyColor(todo.createdAt || todo.requestedAt);

            // 🟡 1. การอนุมัติราคาส่ง
            if (todo.type === 'WHOLESALE_APPROVAL' || todo.type === 'wholesale_request') {
              return (
                <div key={todo.id} className="md:col-span-2 xl:col-span-3">
                  <WholesaleCard 
                    task={todo} 
                    currentUser={auth.currentUser}
                    onReject={() => handleAction(todo.id, 'reject', todo.type, { orderId: todo.orderId || todo.payload?.orderId })}
                  />
                </div>
              );
            }

            // 🟡 2. การตรวจสลิปโอนเงิน
            if (todo.type === 'verify_slip') {
              return (
                <div key={todo.id} className="md:col-span-2 xl:col-span-3">
                  <PaymentCard 
                    task={todo} 
                    currentUser={auth.currentUser} 
                  />
                </div>
              );
            }

            // 🟡 3. การออกใบกำกับภาษี (ใหม่)
            if (todo.type === 'issue_tax_invoice') {
               return (
                  <div key={todo.id} className="md:col-span-2 xl:col-span-3">
                     <TaxInvoiceCard
                        task={todo}
                        currentUser={auth.currentUser}
                     />
                  </div>
               )
            }

            // 🟡 4. Fallback สำหรับงานประเภทอื่นๆ
            return (
              <TodoItem 
                key={todo.id}
                todo={todo}
                isProcessing={isProcessing}
                isManagerTab={isManagerTab}
                urgencyClass={urgencyClass}
                handleAction={handleAction}
              />
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-dh-border bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-dh-main flex items-center gap-2">
                <Plus className="w-5 h-5 text-dh-accent" />
                สร้างงานใหม่ (Manual Task)
              </h3>
              <button onClick={() => setShowNewTaskModal(false)} className="text-dh-muted hover:text-dh-main transition-colors bg-white p-1 rounded-full shadow-sm border border-dh-border">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-dh-muted mb-1 uppercase tracking-wide">หัวข้องาน <span className="text-red-500">*</span></label>
                <input required type="text" placeholder="เช่น ติดต่อลูกค้าคุณเอ, ตรวจสอบสต็อก" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-4 py-2.5 text-sm text-dh-main outline-none focus:border-dh-accent focus:ring-1 focus:ring-dh-accent/30 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dh-muted mb-1 uppercase tracking-wide">รายละเอียดเพิ่มเติม</label>
                <textarea rows="3" placeholder="ใส่ข้อมูลที่จำเป็นสำหรับการทำงานนี้..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-4 py-3 text-sm text-dh-main outline-none focus:border-dh-accent focus:ring-1 focus:ring-dh-accent/30 transition-all resize-none"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dh-muted mb-1 uppercase tracking-wide">ความสำคัญ</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-3 py-2.5 text-sm text-dh-main outline-none focus:border-dh-accent font-medium">
                    <option value="Low">Low (ทั่วไป)</option>
                    <option value="Medium">Medium (ปานกลาง)</option>
                    <option value="High" className="text-red-500 font-bold">High (ด่วนมาก)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-dh-muted mb-1 uppercase tracking-wide">ประเภทงาน</label>
                  <select value={taskForm.type} onChange={e => setTaskForm({...taskForm, type: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-3 py-2.5 text-sm text-dh-main outline-none focus:border-dh-accent font-medium">
                    <option value="GENERAL">งานทั่วไป</option>
                    <option value="FOLLOW_UP">ติดตามลูกค้า</option>
                    <option value="INVENTORY">ตรวจสอบสต็อก</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-dh-muted mb-1 uppercase tracking-wide">กำหนดส่ง (Due Date)</label>
                <input type="datetime-local" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-4 py-2.5 text-sm text-dh-main outline-none focus:border-dh-accent focus:ring-1 focus:ring-dh-accent/30 transition-all font-medium" />
              </div>
              <div className="pt-5 border-t border-dh-border flex gap-3">
                <button type="button" onClick={() => setShowNewTaskModal(false)} className="px-5 py-2.5 text-sm font-bold text-dh-muted hover:text-dh-main bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">ยกเลิก</button>
                <button type="submit" className="flex-1 bg-dh-main hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-md">บันทึกและสร้างงาน</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <HistoryPanel 
        showCompletedPanel={showCompletedPanel} 
        setShowCompletedPanel={setShowCompletedPanel} 
        loadingCompleted={loadingCompleted} 
        completedTodos={completedTodos} 
      />

    </div>
  );
}