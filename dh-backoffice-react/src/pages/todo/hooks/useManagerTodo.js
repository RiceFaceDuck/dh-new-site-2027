import { useState, useEffect, useCallback } from 'react';
// 🚀 THE FIX [Clean Architecture]: 
// เปลี่ยนจาก todoService มาใช้ managerTodoService ที่แยกไว้เฉพาะสำหรับผู้จัดการ
import { managerTodoService } from '../../../firebase/managerTodoService';

export const useManagerTodo = () => {
  const [managerTodos, setManagerTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✨ UX UPGRADE: เพิ่ม pendingStaff เข้าไปใน Stats เพื่อทำ Badge แจ้งเตือนพนักงานใหม่
  const [stats, setStats] = useState({ 
      pendingAds: 0, 
      pendingPartners: 0, 
      pendingStaff: 0, 
      total: 0 
  });
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // 🚀 THE FIX [ลด Reads & แก้บั๊กข้อมูลไม่ตรง]: 
    // เรียกใช้ Service สำหรับ Manager โดยเฉพาะ
    const unsubscribe = managerTodoService.subscribeManagerApprovals(
      (fetchedTodos) => {
          let countAds = 0;
          let countPartners = 0;
          let countStaff = 0;

          // 🚀 [ประสิทธิภาพ]: ทำการนับเฉพาะงานผู้จัดการ (ส่วนที่ 3) 
          fetchedTodos.forEach(todo => {
              const type = todo.type || todo.taskType;
              if (['AD_APPROVAL', 'USER_SKU_APPROVAL', 'BILLBOARD_APPROVAL'].includes(type)) {
                  countAds++;
              } else if (type === 'PARTNER_APPROVAL') {
                  countPartners++;
              } else if (type === 'STAFF_APPROVAL') {
                  countStaff++;
              }
          });

          setStats({
              pendingAds: countAds,
              pendingPartners: countPartners,
              pendingStaff: countStaff,
              total: fetchedTodos.length
          });

          setManagerTodos(fetchedTodos);
          setLoading(false);
      }
    );

    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, []);

  // ----------------------------------------------------------------------
  // 📝 แก้บั๊ค "บันทึก/เปลี่ยนสถานะงานไม่ได้" 
  // โดยผูกการทำงานเข้ากับ Service ใหม่
  // ----------------------------------------------------------------------
  const updateTaskStatus = useCallback(async (taskId, newStatus, payload = {}) => {
    if (processingId) return false;
    setProcessingId(taskId);
    
    try {
      await managerTodoService.updateTaskStatus(taskId, newStatus, payload);
      return true;
    } catch (err) {
      console.error("🔥 Error updating manager task:", err);
      setError("การบันทึกสถานะล้มเหลว โปรดลองใหม่อีกครั้ง");
      return false;
    } finally {
      setProcessingId(null);
    }
  }, [processingId]);

  // ----------------------------------------------------------------------
  // 🗑️ แก้บั๊ค "ลบงานไม่ได้"
  // ส่งให้ Service ยิงคำสั่ง Delete ตรงๆ ไม่ผ่าน Transaction ที่ซับซ้อน
  // ----------------------------------------------------------------------
  const deleteManagerTask = useCallback(async (taskId) => {
    if (processingId) return false;
    setProcessingId(taskId);

    try {
      await managerTodoService.deleteManagerTask(taskId);
      return true;
    } catch (err) {
      console.error("🔥 Error deleting manager task:", err);
      setError("ไม่สามารถลบรายการได้ โปรดลองใหม่อีกครั้ง");
      return false;
    } finally {
      setProcessingId(null);
    }
  }, [processingId]);

  return {
    managerTodos,
    loading,
    error,
    stats,
    updateTaskStatus,
    deleteManagerTask,
    processingId
  };
};