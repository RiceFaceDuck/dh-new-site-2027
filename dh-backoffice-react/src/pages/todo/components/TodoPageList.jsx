import { useState } from 'react';
import { Loader2, CheckCircle2, ChevronDown, ChevronRight, AlertCircle, FileText, Package, Receipt, Truck, Info } from 'lucide-react';
import WholesaleCard from '../../../components/todo/WholesaleCard';
import PaymentCard from '../../../components/todo/PaymentCard'; 
import TaxInvoiceCard from '../../../components/todo/TaxInvoiceCard';
import TodoItem from '../../../components/todo/TodoItem';
import { auth } from '../../../firebase/config';
import { formatDate } from 'dh-shared';


// -------------------------------------------------------------
// Component: Compact Row (Google Drive Style)
// -------------------------------------------------------------
const CompactTodoRow = ({ todo, urgencyLevel, isProcessing, fullCard, formatDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getIcon = (type) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('WHOLESALE')) return <Package className="w-4 h-4 text-orange-500" />;
    if (t.includes('PAYMENT') || t === 'VERIFY_SLIP') return <Receipt className="w-4 h-4 text-blue-500" />;
    if (t.includes('TAX')) return <FileText className="w-4 h-4 text-teal-500" />;
    if (t.includes('CLAIM')) return <AlertCircle className="w-4 h-4 text-rose-500" />;
    if (t.includes('INVENTORY')) return <Truck className="w-4 h-4 text-purple-500" />;
    return <Info className="w-4 h-4 text-slate-500" />;
  };

  const getTitle = (type) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('WHOLESALE')) return 'ขอราคาส่ง';
    if (t === 'VERIFY_SLIP') return 'ตรวจสอบสลิป';
    if (t === 'ISSUE_TAX_INVOICE') return 'ใบกำกับภาษี';
    if (t.includes('CLAIM')) return 'เคลม/คืนสินค้า';
    return todo.title || 'งานทั่วไป';
  };

  const customerName = todo.customerName || todo.payload?.customer?.name || todo.payload?.name || '-';

  const getRowAccent = (level) => {
    if (level === 'high') return 'bg-rose-50/30 hover:bg-rose-100/40';
    if (level === 'medium') return 'bg-amber-50/30 hover:bg-amber-100/40';
    return 'bg-white hover:bg-slate-50/80';
  };

  return (
    <div className={`border-b border-slate-200/60 last:border-0 transition-colors ${getRowAccent(urgencyLevel)} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
      <div 
         className="flex items-center gap-3 p-3 sm:px-4 cursor-pointer select-none"
         onClick={() => setIsExpanded(!isExpanded)}
      >
         {/* Expand Toggle */}
         <div className="shrink-0 text-slate-400">
           {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
         </div>
         
         {/* Icon */}
         <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60">
             {getIcon(todo.type)}
         </div>

         {/* Content Row */}
         <div className="flex-1 min-w-0 flex items-center gap-4">
            
            {/* Type & ID */}
            <div className="w-1/3 min-w-[120px] max-w-[200px]">
               <h4 className={`text-sm font-bold truncate ${urgencyLevel === 'high' ? 'text-red-600' : 'text-slate-800'}`}>
                 {getTitle(todo.type)}
               </h4>
               <p className="text-[10px] text-slate-500 uppercase">#{todo.id?.slice(-6)}</p>
            </div>
            
            {/* Customer (Hidden on very small screens) */}
            <div className="flex-1 min-w-0 hidden sm:block border-l border-slate-200 pl-4">
               <p className="text-xs font-medium text-slate-600 truncate">{customerName}</p>
            </div>
            
            {/* Date */}
            <div className="w-24 shrink-0 text-right">
               <p className="text-[11px] text-slate-500 font-medium">{formatDate(todo.createdAt || todo.requestedAt)}</p>
            </div>
         </div>
      </div>
      
      {/* Expanded Content (The original full card) */}
      {isExpanded && (
         <div className="p-3 sm:p-4 pt-0 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 fade-in duration-200">
            {fullCard}
         </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Component: TodoPageList
// -------------------------------------------------------------
const TodoPageList = ({
  loading,
  displayTodos,
  searchQuery,
  processingId,
  handleAction,
  fetchedPrices,
  wholesaleInputs,
  setWholesaleInputs,
  isLeftZone
}) => {

  const getUrgencyLevel = (createdAt) => {
    if (!createdAt) return 'low';
    const hours = (new Date() - createdAt.toDate()) / (1000 * 60 * 60);
    if (hours > 24) return 'high';
    if (hours > 12) return 'medium';
    return 'low';
  };



  const getStatusBadge = (status) => {
    switch (status) {
      case 'todo': return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-inner">รอเริ่มงาน</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse border border-blue-200 shadow-inner">⏳ กำลังดำเนินการ</span>;
      case 'pending_manager': 
      case 'pending': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-200 shadow-inner">👑 รอผู้จัดการอนุมัติ</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  // แบ่งข้อมูลตาม Zone
  const filteredTodos = displayTodos.filter(todo => {
     const urgency = getUrgencyLevel(todo.createdAt || todo.requestedAt);
     const isUrgent = urgency === 'high' || urgency === 'medium' || todo.priority === 'High';
     
     if (isLeftZone === true) {
       return !isUrgent; // โซนซ้าย: งานใหม่ที่ยังไม่ด่วน
     } else if (isLeftZone === false) {
       return isUrgent; // โซนขวา: งานด่วน หรือ ค้างนาน
     }
     return true; 
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-xs rounded-lg shadow-md ring-1 ring-slate-900/5 border border-slate-200/80 dark:border-slate-700/80 relative z-0">
        <Loader2 className="w-10 h-10 text-(--dh-accent) animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลศูนย์ปฏิบัติการ...</p>
      </div>
    );
  }

  if (filteredTodos.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-md ring-1 ring-slate-900/5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center animate-in fade-in duration-500 relative z-0">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
           {searchQuery ? 'ไม่พบรายการที่ค้นหา' : (isLeftZone ? 'ยอดเยี่ยม! ไม่มีงานใหม่' : 'ไม่มีงานค้างด่วน')}
        </h3>
        <p className="text-slate-500 max-w-sm text-sm font-medium">
          {searchQuery 
             ? `ไม่มีข้อมูลที่ตรงกับคำว่า "${searchQuery}"` 
             : (isLeftZone ? 'คุณไม่มีงานใหม่เข้ามาในขณะนี้' : 'คุณเคลียร์งานที่ค้างนานเสร็จเรียบร้อยแล้ว!')
          }
        </p>
      </div>
    );
  }

  // สำหรับฝั่งขวา (List View)
  if (!isLeftZone) {
    return (
      <div className="w-full mx-auto pb-10 bg-white rounded-xl shadow-xs ring-1 ring-slate-900/5 overflow-hidden">
        {/* List Header */}
        <div className="flex items-center gap-3 p-3 sm:px-4 border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none hidden sm:flex">
           <div className="w-4"></div> {/* padding for chevron */}
           <div className="w-7"></div> {/* padding for icon */}
           <div className="w-1/3 min-w-[120px] max-w-[200px]">ชื่องาน</div>
           <div className="flex-1 min-w-0 border-l border-transparent pl-4">ลูกค้า / ผู้ขอ</div>
           <div className="w-24 shrink-0 text-right">วันที่สร้าง</div>
        </div>

        {/* List Body */}
        <div className="flex flex-col">
          {filteredTodos.map((todo, index) => {
            const isProcessing = processingId === todo.id;
            const urgencyLevel = getUrgencyLevel(todo.createdAt || todo.requestedAt);
            
            // Build the original full card to pass into the row
            let cardContent = null;
            if (todo.type === 'WHOLESALE_APPROVAL' || todo.type === 'wholesale_request') {
              cardContent = <WholesaleCard todo={todo} isProcessing={isProcessing} urgencyLevel={urgencyLevel} handleAction={handleAction} formatDate={formatDate} getStatusBadge={getStatusBadge} />;
            } else if (todo.type === 'verify_slip') {
              cardContent = <PaymentCard task={todo} currentUser={auth.currentUser} urgencyLevel={urgencyLevel} />;
            } else if (todo.type === 'issue_tax_invoice') {
              cardContent = <TaxInvoiceCard task={todo} currentUser={auth.currentUser} urgencyLevel={urgencyLevel} />;
            } else {
              cardContent = <TodoItem todo={todo} isProcessing={isProcessing} isManagerTab={false} urgencyLevel={urgencyLevel} handleAction={handleAction} />;
            }

            return (
              <CompactTodoRow 
                key={todo.id} 
                todo={todo} 
                urgencyLevel={urgencyLevel} 
                isProcessing={isProcessing} 
                fullCard={cardContent} 
                formatDate={formatDate}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // สำหรับฝั่งซ้าย (Card View) แถวละ 2
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 w-full mx-auto pb-10">
      {filteredTodos.map((todo, index) => {
        const isProcessing = processingId === todo.id;
        const urgencyLevel = getUrgencyLevel(todo.createdAt || todo.requestedAt);
        
        let cardContent = null;

        if (todo.type === 'WHOLESALE_APPROVAL' || todo.type === 'wholesale_request') {
          cardContent = (
              <WholesaleCard 
                todo={todo} 
                isProcessing={isProcessing}
                urgencyLevel={urgencyLevel}
                handleAction={handleAction}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
              />
          );
        } else if (todo.type === 'verify_slip') {
          cardContent = <PaymentCard task={todo} currentUser={auth.currentUser} urgencyLevel={urgencyLevel} />;
        } else if (todo.type === 'issue_tax_invoice') {
          cardContent = <TaxInvoiceCard task={todo} currentUser={auth.currentUser} urgencyLevel={urgencyLevel} />;
        } else {
          cardContent = (
            <TodoItem 
              todo={todo}
              isProcessing={isProcessing}
              isManagerTab={false} 
              urgencyLevel={urgencyLevel}
              handleAction={handleAction}
            />
          );
        }
        
        return (
          <div 
            key={todo.id} 
            className="h-full animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both" 
            style={{ animationDelay: `${index * 50}ms` }}
          >
             {cardContent}
          </div>
        );
      })}
    </div>
  );
};

export default TodoPageList;
