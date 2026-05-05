import React, { useState, useEffect } from 'react';
import { todoService } from '../firebase/todoService';
import { auth, db } from '../firebase/config';
import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore'; 
import NonExistingProducts from './todo/NonExistingProducts';
import { 
  Check, X, Clock, UserPlus, Tag, Info, AlertCircle, 
  Inbox, ListFilter, HelpCircle, Plus, History, XCircle, 
  RotateCcw, Calendar, Receipt, ChevronRight, Calculator, Loader2, PackageSearch, CheckCircle2, Filter
} from 'lucide-react';

import TodoItem from '../components/todo/TodoItem';
import HistoryPanel from '../components/todo/HistoryPanel';
import WholesaleCard from '../components/todo/WholesaleCard';

export default function Todo() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(''); // 🚨 ตัวแปรใหม่สำหรับเก็บ Error
  const [activeTab, setActiveTab] = useState('approvals'); 
  const [filterType, setFilterType] = useState('ALL');
  
  const [processingId, setProcessingId] = useState(null);
  const [wholesaleInputs, setWholesaleInputs] = useState({});
  const [fetchedPrices, setFetchedPrices] = useState({}); 

  const [showHelp, setShowHelp] = useState(false);
  const [helpPage, setHelpPage] = useState(1); 
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCompletedPanel, setShowCompletedPanel] = useState(false);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'Medium', dueDate: '', syncGcal: false
  });

  useEffect(() => {
    setLoading(true);
    setFetchError('');
    
    const unsubscribe = todoService.subscribePendingTodos(
      (data) => {
        const cleanData = data.map(item => ({
          ...item,
          title: item.title || 'คำร้องขอไม่มีชื่อ (System Data)',
          description: item.description || 'ไม่มีรายละเอียดเพิ่มเติม'
        }));
        setTodos(cleanData);
        setLoading(false);
        setFetchError('');
      },
      (error) => {
        setLoading(false);
        // แสดงข้อความ Error ออกมาที่หน้าจอ จะได้ไม่ค้างสถานะ Loading
        if (error.message.includes('index')) {
          setFetchError('⚠️ ระบบต้องการสร้าง Index ใน Firebase กรุณากดลิงก์สีแดงใน Console (F12) เพื่อสร้าง');
        } else {
          setFetchError('⚠️ ไม่สามารถดึงข้อมูลได้: ' + error.message);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProductPrices = async () => {
      const b2bTodos = todos.filter(t => t.type === 'WHOLESALE_APPROVAL' && (t.payload?.itemsSnapshot || t.payload?.items));
      if(b2bTodos.length === 0) return;

      // ✨ ดึงกฎเกณฑ์ค่าขนส่งอัตโนมัติ
      let shippingRules = [];
      try {
        const rulesSnap = await getDocs(collection(db, 'shipping_rules'));
        shippingRules = rulesSnap.docs.map(d => d.data()).filter(r => r.isActive !== false);
      } catch (e) { console.warn("Failed to fetch shipping rules"); }

      // 🚀 Batch Fetch Strategy: รวบรวม ID ที่ต้องดึงทั้งหมด
      const orderIdsToFetch = new Set();
      const productIdsToFetch = new Set();
      const pendingTodos = b2bTodos.filter(t => !fetchedPrices[t.id]);

      pendingTodos.forEach(todo => {
        if (todo.payload?.orderId) orderIdsToFetch.add(todo.payload.orderId);
        const items = todo.payload.itemsSnapshot || todo.payload.items || [];
        items.forEach(item => {
          const id = item.id || item.sku;
          if (id) productIdsToFetch.add(id);
        });
      });

      const ordersMap = {};
      const productsMap = {};

      // Helper for batching 'in' queries (max 30 ids per query)
      const fetchInBatches = async (collectionName, ids, map) => {
        const idList = Array.from(ids);
        for (let i = 0; i < idList.length; i += 30) {
          const batch = idList.slice(i, i + 30);
          try {
            const q = query(collection(db, collectionName), where(documentId(), 'in', batch));
            const snap = await getDocs(q);
            snap.forEach(d => { map[d.id] = d.data(); });
          } catch (err) { console.warn(`Batch fetch error for ${collectionName}:`, err); }
        }
      };

      if (orderIdsToFetch.size > 0) await fetchInBatches('orders', orderIdsToFetch, ordersMap);
      if (productIdsToFetch.size > 0) await fetchInBatches('products', productIdsToFetch, productsMap);
      
      for (const todo of b2bTodos) {
        if (fetchedPrices[todo.id]) continue; 

        setFetchedPrices(prev => ({ ...prev, [todo.id]: 'loading' }));

        try {
          let promoDiscount = 0;
          let shippingFee = 0;
          let freebies = '';
          
          const orderData = todo.payload?.orderId ? ordersMap[todo.payload.orderId] : null;
          if (orderData) {
            promoDiscount = Number(orderData.summary?.promoDiscount || orderData.promoDiscount) || 0;
            shippingFee = Number(orderData.summary?.shippingFee || orderData.shippingFee) || 0;
            freebies = orderData.freebies || orderData.summary?.freebies || '';
          }

          const targetItems = todo.payload.itemsSnapshot || todo.payload.items || [];
          let totalQty = 0;

          const itemsWithPricing = targetItems.map((item) => {
            let dbCost = 0; 
            let dbRetail = Number(item.price) - Number(item.discount || 0) || 0; 
            let dbWholesalePrice = 0;
            totalQty += (Number(item.qty) || 1);

            const itemIdentifier = item.id || item.sku;
            const data = itemIdentifier ? productsMap[itemIdentifier] : null;
            if (data) {
              dbWholesalePrice = Number(data.Price) || Number(data.wholesalePrice) || 0; 
              dbCost = Number(data.cost) || 0; 
              dbRetail = Number(data.retailPrice) || dbRetail;
            }
            
            const computedWsPrice = dbWholesalePrice > 0 ? dbWholesalePrice : dbRetail;
            return { ...item, retailPrice: dbRetail, computedWsPrice, dbCost };
          });

          let calculatedShipping = shippingFee;
          if (shippingRules.length > 0) {
             const matchedRule = shippingRules.find(r => totalQty >= Number(r.minQty||0) && totalQty <= Number(r.maxQty||9999));
             if (matchedRule) {
               calculatedShipping = Number(matchedRule.shippingFee || 0);
             }
          }

          if (isMounted) {
            setFetchedPrices(prev => ({ 
              ...prev, 
              [todo.id]: { items: itemsWithPricing, promoDiscount, shippingFee: calculatedShipping, freebies } 
            }));
            
            setWholesaleInputs(prev => {
              if (prev[todo.id]) return prev;
              const initialPrices = {};
              itemsWithPricing.forEach((it, idx) => {
                initialPrices[idx] = it.computedWsPrice || 0;
              });
              return { 
                ...prev, 
                [todo.id]: { 
                  itemPrices: initialPrices,
                  shipping: calculatedShipping,
                  manualPromo: promoDiscount,
                  freebies: freebies
                } 
              };
            });
          }
        } catch (error) {
          if (isMounted) setFetchedPrices(prev => ({ ...prev, [todo.id]: 'error' }));
        }
      }
    };

    if (todos.length > 0) fetchProductPrices();
    return () => { isMounted = false; };
  }, [todos]); 

  const handleApprove = async (todo) => {
    if (processingId) return;
    setProcessingId(todo.id);
    try {
      let resolutionData = {};
      
      if (todo.type === 'WHOLESALE_APPROVAL') {
        const fetchedData = fetchedPrices[todo.id];
        const rawItems = todo.payload.itemsSnapshot || todo.payload.items || [];
        const itemsList = fetchedData?.items || rawItems;
        const inputs = wholesaleInputs[todo.id] || {};
        
        let approvedPrice = 0;
        let finalItemPrices = {};

        if (itemsList.length > 0) {
          itemsList.forEach((item, idx) => {
            const wsPrice = inputs.itemPrices?.[idx] !== undefined && inputs.itemPrices[idx] !== ''
                            ? Number(inputs.itemPrices[idx])
                            : Number(item.computedWsPrice || 0);
            
            approvedPrice += wsPrice * Number(item.qty || 0);
            finalItemPrices[idx] = wsPrice; 
          });
        } else {
          approvedPrice = Number(inputs.price || 0);
        }

        const approvedShipping = inputs.shipping !== undefined && inputs.shipping !== '' 
                                ? Number(inputs.shipping) 
                                : Number(fetchedData?.shippingFee || 0);
                                
        const manualPromo = inputs.manualPromo !== undefined ? Number(inputs.manualPromo) : Number(fetchedData?.promoDiscount || 0);
        const manualFreebies = inputs.freebies !== undefined ? inputs.freebies : (fetchedData?.freebies || '');
        
        if (approvedPrice <= 0 && itemsList.length > 0) {
          alert('เกิดข้อผิดพลาด: ราคาสินค้ารวมเป็น 0');
          setProcessingId(null);
          return;
        }

        resolutionData = { 
          approvedPrice: approvedPrice, 
          approvedShipping: approvedShipping,
          itemWholesalePrices: finalItemPrices,
          manualPromo: manualPromo,
          freebies: manualFreebies
        };
      }

      await todoService.resolveTodo(todo, resolutionData, auth.currentUser);
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (todoId) => {
    if (processingId) return;
    const reason = window.prompt('เหตุผลที่ไม่อนุมัติ (เว้นว่างได้):');
    if (reason === null) return; 
    setProcessingId(todoId);
    try {
      await todoService.rejectTodo(todoId, reason || 'ปฏิเสธโดยพนักงาน', auth.currentUser);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการปฏิเสธ");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return alert('กรุณาระบุหัวข้องาน');
    try {
      await todoService.createManualTodo(taskForm, auth.currentUser);
      setShowCreateTask(false);
      setTaskForm({ title: '', description: '', priority: 'Medium', dueDate: '', syncGcal: false });
    } catch (error) { alert("ไม่สามารถสร้างงานได้"); }
  };

  const loadCompletedTodos = async () => {
    setShowCompletedPanel(true);
    setLoadingCompleted(true);
    const data = await todoService.getCompletedTodos(30);
    setCompletedTodos(data);
    setLoadingCompleted(false);
  };

  const handleRecallTodo = async (todo) => {
    if (!window.confirm(`ต้องการดึงงาน "${todo.title}" กลับมาแก้ไขหรือไม่?`)) return;
    try {
      await todoService.recallTodo(todo, auth.currentUser);
      setCompletedTodos(prev => prev.filter(t => t.id !== todo.id));
    } catch (error) { alert("ดึงงานกลับไม่สำเร็จ"); }
  };

  const filteredTodos = todos.filter(todo => filterType === 'ALL' || todo.type === filterType);

  // 🚀 UX Gimmick Component: Smart Filter Buttons
  const FilterButton = ({ type, label, icon: Icon, colorClass }) => {
    const isActive = filterType === type;
    return (
      <button
        onClick={() => setFilterType(type)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
          isActive 
            ? `${colorClass} shadow-md ring-2 ring-offset-1 ring-opacity-60` 
            : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
        {label}
        {isActive && filteredTodos.length > 0 && (
           <span className="ml-1 flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
           </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto relative p-4 md:p-6">
      
      {/* 🚀 Header Section (Premium Update) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-dh-border mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-dh-main tracking-tight">To-do ส่วนกลาง (Central Workflow)</h2>
          </div>
          <p className="text-sm text-dh-muted ml-11">พื้นที่ปฏิบัติงานของพนักงานทุกคน ประเมินราคาส่ง และ ยืนยันรับยอดโอน</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 ml-11 md:ml-0">
          <button onClick={() => setShowHelp(true)} className="text-slate-400 hover:text-dh-accent transition-colors p-2" title="คู่มือการใช้งาน">
            <HelpCircle size={20} />
          </button>
          <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-dh-accent text-white text-sm font-bold rounded-xl hover:bg-orange-500 transition-colors shadow-sm">
            <Plus size={16} /> สั่งงานใหม่
          </button>
          <button onClick={loadCompletedTodos} className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-dh-border text-dh-muted hover:text-dh-main text-sm font-bold rounded-xl transition-colors shadow-sm">
            <History size={16} /> ประวัติงาน
          </button>
        </div>
      </div>

      {/* 🚨 แจ้งเตือน Error ขาด Index หรือดึงข้อมูลไม่ได้ */}
      {fetchError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">เชื่อมต่อฐานข้อมูลไม่สมบูรณ์</p>
            <p className="text-sm mt-1">{fetchError}</p>
          </div>
        </div>
      )}

      <div className="flex gap-6 border-b border-dh-border px-2">
        <button onClick={() => setActiveTab('approvals')} className={`relative pb-3 text-sm font-bold transition-colors ${activeTab === 'approvals' ? 'text-dh-accent border-b-2 border-dh-accent' : 'text-dh-muted hover:text-dh-main'}`}>
          Inbox ของฉัน {todos.length > 0 && `(${todos.length})`}
        </button>
        <button onClick={() => setActiveTab('sourcing')} className={`relative pb-3 text-sm font-bold transition-colors ${activeTab === 'sourcing' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-dh-muted hover:text-dh-main'}`}>
          สินค้ายังไม่มีจำหน่าย
        </button>
      </div>

      {activeTab === 'approvals' && (
        <div className="bg-dh-surface border border-dh-border rounded-xl shadow-sm overflow-hidden">
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-dh-border flex items-center gap-3 overflow-x-auto custom-scrollbar">
            <ListFilter size={16} className="text-dh-muted ml-1" />
            <span className="text-xs font-bold text-dh-muted uppercase mr-2">ตัวกรอง:</span>
            
            <FilterButton type="ALL" label="งานทั้งหมด" icon={Inbox} colorClass="bg-slate-800 text-white ring-slate-800" />
            <FilterButton type="WHOLESALE_APPROVAL" label="ขอราคาส่ง (เก่า)" icon={Tag} colorClass="bg-orange-500 text-white ring-orange-500" />
            <FilterButton type="wholesale_request" label="ขอราคาส่ง (ระบบใหม่)" icon={Calculator} colorClass="bg-amber-500 text-white ring-amber-500" />
            <FilterButton type="PAYMENT_VERIFICATION" label="ตรวจสอบสลิปโอน" icon={Receipt} colorClass="bg-blue-600 text-white ring-blue-600" />
            <FilterButton type="MANUAL_TASK" label="สั่งงาน Manual" icon={CheckCircle2} colorClass="bg-emerald-500 text-white ring-emerald-500" />
          </div>

          <div className="divide-y divide-dh-border">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-dh-muted">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                <p className="font-medium animate-pulse text-sm">กำลังซิงค์ข้อมูล...</p>
              </div>
            ) : filteredTodos.length === 0 && !fetchError ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-b-xl">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">ไม่มีงานค้างในหมวดหมู่นี้</h3>
                <p className="text-slate-500 text-sm">ยอดเยี่ยมมาก! คุณจัดการงานในระบบครบหมดแล้ว</p>
              </div>
            ) : (
              filteredTodos.map((todo) => {
                // แทรก UI ระบบใหม่ เข้าไปร่วมกับของเก่า
                if (todo.type === 'wholesale_request') {
                  return (
                    <div className="p-4" key={todo.id}>
                      <WholesaleCard task={todo} onComplete={() => {}} />
                    </div>
                  );
                }
                // ระบบเก่า
                return (
                  <TodoItem 
                    key={todo.id}
                    todo={todo}
                    processingId={processingId}
                    handleApprove={handleApprove}
                    handleReject={handleReject}
                    fetchedPrices={fetchedPrices}
                    wholesaleInputs={wholesaleInputs}
                    setWholesaleInputs={setWholesaleInputs}
                  />
                )
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'sourcing' && <NonExistingProducts />}

      {/* --- MODALS & PANELS --- */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dh-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-dh-border flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-dh-main flex items-center gap-2">
                <HelpCircle size={20} className="text-dh-accent"/> คู่มือการใช้งาน To-do
              </h3>
              <button onClick={() => { setShowHelp(false); setHelpPage(1); }} className="text-slate-400 hover:text-red-500">
                <XCircle size={20}/>
              </button>
            </div>
            <div className="p-6 text-sm text-dh-muted">
               <p className="font-bold text-dh-main border-b border-dh-border pb-2">⚙️ ขีดจำกัด และ ความสามารถระบบ</p>
               <ul className="space-y-3 mt-4">
                 <li className="flex gap-2"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5"/> <b>Real-time Auto Update:</b> เมื่อกด "อนุมัติ" ระบบจะวิ่งไปอัปเดตข้อมูลให้ทันที</li>
                 <li className="flex gap-2"><History size={16} className="text-blue-500 shrink-0 mt-0.5"/> <b>ตัวดูงานที่เสร็จแล้ว:</b> กดปุ่มประวัติงาน แถบข้อมูลจะสไลด์ออกมาโดยไม่กวนหน้าจอหลัก</li>
                 <li className="flex gap-2"><AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5"/> <b>ขีดจำกัดประหยัดทรัพยากร:</b> ดึงงานแสดงสูงสุด 100 รายการ เพื่อไม่ให้เปลืองโควต้าโหลดข้อมูล</li>
               </ul>
            </div>
          </div>
        </div>
      )}

      {showCreateTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dh-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-dh-border flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-dh-main flex items-center gap-2"><Plus size={20} className="text-dh-accent"/> สั่งงานใหม่ (Manual Task)</h3>
              <button onClick={() => setShowCreateTask(false)} className="text-slate-400 hover:text-red-500"><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-dh-muted mb-1">หัวข้องาน <span className="text-red-500">*</span></label>
                <input required type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-3 py-2 text-sm text-dh-main outline-none focus:border-dh-accent" placeholder="เช่น ตรวจเช็คสต็อกโซน A" />
              </div>
              <div>
                <label className="block text-xs font-bold text-dh-muted mb-1">รายละเอียด</label>
                <textarea rows="3" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-3 py-2 text-sm text-dh-main outline-none focus:border-dh-accent resize-none" placeholder="อธิบายเพิ่มเติม..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dh-muted mb-1">ระดับความสำคัญ</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-3 py-2 text-sm text-dh-main outline-none focus:border-dh-accent">
                    <option value="Low">Low (ทั่วไป)</option>
                    <option value="Medium">Medium (ปานกลาง)</option>
                    <option value="High">High (ด่วนมาก)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-dh-muted mb-1">กำหนดส่ง (Due Date)</label>
                  <input type="datetime-local" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-dh-border rounded-lg px-3 py-2 text-sm text-dh-main outline-none focus:border-dh-accent" />
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <button type="submit" className="flex-1 bg-dh-accent hover:bg-orange-500 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">บันทึกงาน</button>
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
        handleRecallTodo={handleRecallTodo} 
      />

    </div>
  );
}