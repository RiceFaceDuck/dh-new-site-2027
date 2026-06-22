import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import WholesaleCard from '../../../components/todo/WholesaleCard';
import PaymentCard from '../../../components/todo/PaymentCard'; 
import TaxInvoiceCard from '../../../components/todo/TaxInvoiceCard';
import TodoItem from '../../../components/todo/TodoItem';
import { auth } from '../../../firebase/config';

const TodoPageList = ({
  loading,
  displayTodos,
  searchQuery,
  processingId,
  handleAction,
  fetchedPrices,
  wholesaleInputs,
  setWholesaleInputs
}) => {

  const getUrgencyColor = (createdAt) => {
    if (!createdAt) return 'bg-slate-100 text-slate-500';
    const hours = (new Date() - createdAt.toDate()) / (1000 * 60 * 60);
    if (hours > 24) return 'bg-red-100 text-red-700 border border-red-200';
    if (hours > 12) return 'bg-orange-100 text-orange-700 border border-orange-200';
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-sm rounded-lg shadow-md ring-1 ring-slate-900/5 border border-slate-200/80 dark:border-slate-700/80 relative z-0">
        <Loader2 className="w-10 h-10 text-[var(--dh-accent)] animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลศูนย์ปฏิบัติการ...</p>
      </div>
    );
  }

  if (displayTodos.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-lg shadow-md ring-1 ring-slate-900/5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center animate-in fade-in duration-500 relative z-0">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
           {searchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ยอดเยี่ยม! ไม่มีงานปฏิบัติการค้าง'}
        </h3>
        <p className="text-slate-500 max-w-sm text-sm font-medium">
          {searchQuery 
             ? `ไม่มีข้อมูลที่ตรงกับคำว่า "${searchQuery}"` 
             : 'คุณจัดการเอกสารและรายการทั้งหมดเรียบร้อยแล้ว พักผ่อนได้เลย!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-5xl mx-auto">
      {displayTodos.map(todo => {
        const isProcessing = processingId === todo.id;
        const urgencyClass = getUrgencyColor(todo.createdAt || todo.requestedAt);

        if (todo.type === 'WHOLESALE_APPROVAL' || todo.type === 'wholesale_request') {
          return (
            <div key={todo.id} className="h-full">
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

        if (todo.type === 'verify_slip') {
          return (
            <div key={todo.id} className="h-full">
              <PaymentCard task={todo} currentUser={auth.currentUser} />
            </div>
          );
        }

        if (todo.type === 'issue_tax_invoice') {
           return (
              <div key={todo.id} className="h-full">
                 <TaxInvoiceCard task={todo} currentUser={auth.currentUser} />
              </div>
           )
        }

        return (
          <TodoItem 
            key={todo.id}
            todo={todo}
            isProcessing={isProcessing}
            isManagerTab={false} 
            urgencyClass={urgencyClass}
            handleAction={handleAction}
          />
        );
      })}
    </div>
  );
};

export default TodoPageList;
