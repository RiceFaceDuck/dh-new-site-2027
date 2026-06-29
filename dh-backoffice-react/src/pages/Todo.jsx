import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, deleteDoc } from 'firebase/firestore'; 
import { AlertCircle } from 'lucide-react';

import { todoService } from '../firebase/todoService';
import { claimService } from '../firebase/claimService';

import NewTaskModal from '../components/todo/forms/NewTaskModal'; 
import GuideModal from '../components/common/GuideModal';
import { useCentralTodo } from './todo/hooks/useCentralTodo'; 
import { useWholesalePrices } from './todo/hooks/useWholesalePrices'; 
import TodoPageHeader from './todo/components/TodoPageHeader';
import TodoPageFilterBar from './todo/components/TodoPageFilterBar';
import TodoPageList from './todo/components/TodoPageList';

export default function Todo() {
  const navigate = useNavigate();
  
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);
  
  const { 
    activeTodos, 
    loading, 
    error: fetchError, 
    isSubmitting: isHookSubmitting,
    addManualTodo
  } = useCentralTodo(filterType);
  
  const [showHelp, setShowHelp] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  
  const { fetchedPrices, wholesaleInputs, setWholesaleInputs } = useWholesalePrices(activeTodos);

  const handleAction = async (taskId, action, actionType, payload = {}) => {
    setProcessingId(taskId);
    try {
      const fullTask = activeTodos.find(t => t.id === taskId);
      
      if (action === 'approve') {
        if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType.startsWith('CANCEL_')) {
          if (!fullTask) throw new Error("ไม่พบข้อมูลงานในระบบ กรุณารีเฟรชหน้าจอ");
          await claimService.approveRequest(fullTask, auth.currentUser.uid, auth.currentUser.displayName || 'Admin');
        }
      } else if (action === 'reject') {
        if (actionType === 'WHOLESALE_APPROVAL' || actionType === 'wholesale_request') {
           await todoService.rejectWholesale(taskId, payload.orderId);
        } else if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType.startsWith('CANCEL_')) {
           if (!fullTask) throw new Error("ไม่พบข้อมูลงานในระบบ กรุณารีเฟรชหน้าจอ");
           await claimService.rejectRequest(fullTask, payload.reason || 'ปฏิเสธโดยแอดมิน', auth.currentUser.uid);
        } else {
           await todoService.rejectTask(taskId, payload.reason);
        }
      } else if (action === 'start') {
        await todoService.startTask(taskId);
      } else if (action === 'complete') {
        await todoService.completeTask(taskId);
      } else if (action === 'markArrived') {
        if (actionType === 'CLAIM_APPROVAL' || actionType === 'RETURN_APPROVAL' || actionType.startsWith('CANCEL_')) {
          if (!fullTask) throw new Error("ไม่พบข้อมูลงานในระบบ กรุณารีเฟรชหน้าจอ");
          // Save the tracking number locally and remotely for history/reference
          if (payload.trackingNo) {
            fullTask.payload = { ...fullTask.payload, trackingNo: payload.trackingNo };
            await updateDoc(doc(db, 'todos', taskId), { 'payload.trackingNo': payload.trackingNo });
          }
          await claimService.markArrived(fullTask, auth.currentUser.uid, auth.currentUser.displayName || 'Admin');
        }
      }
    } catch (error) {
      console.error(`Error performing ${action} on task ${taskId}:`, error);
      const errMsg = error.message || '';
      
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

  const handleCreateTask = async (formData) => {
    const success = await addManualTodo(formData);
    if (success) {
      setShowNewTaskModal(false);
    }
  };

  const filteredTodos = activeTodos.filter(todo => {
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

  const displayTodos = filteredTodos.filter(todo => {
    const searchLower = searchQuery.toLowerCase();
    return searchQuery.trim() === '' || 
      todo.id?.toLowerCase().includes(searchLower) ||
      todo.customerName?.toLowerCase().includes(searchLower) ||
      todo.shippingAddress?.fullName?.toLowerCase().includes(searchLower) ||
      todo.orderId?.toLowerCase().includes(searchLower) ||
      todo.title?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="flex flex-col h-full w-full bg-[var(--dh-bg-surface)] relative overflow-hidden font-sans transition-colors duration-300">
      
      <TodoPageHeader 
        navigate={navigate} 
        setShowHelp={setShowHelp} 
        setShowNewTaskModal={setShowNewTaskModal} 
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{fetchError}</p>
          </div>
        )}

        <TodoPageFilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
          displayCount={displayTodos.length}
        />

        <TodoPageList 
          loading={loading}
          displayTodos={displayTodos}
          searchQuery={searchQuery}
          processingId={processingId}
          handleAction={handleAction}
          fetchedPrices={fetchedPrices}
          wholesaleInputs={wholesaleInputs}
          setWholesaleInputs={setWholesaleInputs}
        />

        <NewTaskModal 
          isOpen={showNewTaskModal} 
          onClose={() => setShowNewTaskModal(false)} 
          onSubmit={handleCreateTask}
          isSubmitting={isHookSubmitting}
        />

        <GuideModal 
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          title="คู่มือศูนย์ปฏิบัติการ (Todo Tasks)"
          config={{
            description: "ระบบกระดานงาน (Todo Board) สำหรับจัดการงานต่างๆ แบบรวมศูนย์ ไม่ว่าจะเป็นการอนุมัติเคลม, ตรวจสอบสลิปโอนเงิน หรือคำร้องต่างๆ",
            howTo: [
              "<b>1. ภาพรวมการทำงาน:</b> ดูตัวกรอง (Filter) ด้านบนเพื่อเลือกประเภทงานที่ต้องการจัดการ",
              "<b>2. การเริ่มงาน:</b> กดรับงาน เพื่อแสดงตัวตนว่าใครกำลังดูแลงานนี้อยู่",
              "<b>3. การตรวจสอบสลิปโอนเงิน:</b> คลิกที่ 'การ์ดตรวจสอบยอด' เพื่อดูรายละเอียดที่มาของยอดชำระสุทธิ จากนั้นให้คลิกที่รูปสลิปเพื่อดูรูปขยาย แล้วตรวจสอบยอดเงิน-บัญชี-เวลา ให้ตรงกัน",
              "<b>4. การตัดสินใจ:</b> ตรวจสอบข้อมูลให้ละเอียด ก่อนกด <b>'อนุมัติ'</b> หรือ <b>'ปฏิเสธ'</b>"
            ],
            tips: [
              "งานตรวจสอบสลิป: หากมีข้อสงสัยว่าสลิปนี้ซ้ำหรือไม่ หรือรูปภาพไม่ชัดเจน คุณสามารถนำรูปสลิปส่งตรวจสอบกับทางธนาคารหรือบัญชีได้ก่อนกดอนุมัติ",
              "งานเคลม: จะผูกกับระบบคลังสินค้า หากกดยอมรับ ระบบจะจัดการสต็อกและบันทึกประวัติให้ทันทีโดยอัตโนมัติ"
            ],
            expectedResults: "<b>เมื่ออนุมัติสลิป:</b> ระบบจะสร้างเลขที่บิลรันนิ่งอัตโนมัติ แจ้งเตือนโกดัง และตัดสต็อก\n<b>เมื่อจัดการงานสำเร็จ:</b> งานนั้นจะหายไปจากหน้าจอนี้ และถูกเก็บไว้ในเมนู 'ประวัติ / จัดเก็บ' อย่างถาวร"
          }}
        />
      </div>
    </div>
  );
}