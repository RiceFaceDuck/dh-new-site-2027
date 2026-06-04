import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
// 🚀 THE FIX: นำเข้า todoService เพื่อเรียกใช้ Query หลัก และหลีกเลี่ยงการสร้าง Query ซ้ำซ้อน
import { todoService } from '../../../firebase/todoService';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // 🚀 THE FIX [ลด Reads & แก้บั๊กข้อมูลไม่ตรง]: 
    // ใช้ subscribeManagerApprovals จาก Service แทนการสร้าง Query ใหม่ที่ชี้ไปผิด Collection
    // Service จะทำหน้าที่ดึงข้อมูลจาก Root Collection 'todos' ให้ถูกต้อง
    const unsubscribe = todoService.subscribeManagerApprovals(
      (fetchedTodos) => {
          let countAds = 0;
          let countPartners = 0;
          let countStaff = 0; // ✅ ตัวนับคำขอพนักงานใหม่

          // ข้อมูลถูกกรอง MANAGER_TASK_TYPES และ Sort มาแล้วจาก Service ชั้นแรก
          // กรองข้อมูล Status ขยะ หรือที่ทำเสร็จแล้วออกไป (Double Check)
          const activeTodos = fetchedTodos.filter(todo => {
              const status = (todo.status || '').toUpperCase();
              if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED' || status === 'APPROVED') return false;
              
              const taskType = todo.taskType || todo.type || '';
              // จัดกลุ่มสถิติ
              if (taskType.includes('AD_APPROVAL') || taskType.includes('SKU_APPROVAL') || taskType.includes('BILLBOARD')) countAds++;
              if (taskType.includes('PARTNER_APPROVAL')) countPartners++;
              if (taskType === 'STAFF_APPROVAL') countStaff++; // ✅ นับจำนวนพนักงานที่รออนุมัติ

              return true;
          });

          setStats({ 
              pendingAds: countAds, 
              pendingPartners: countPartners, 
              pendingStaff: countStaff, // ✅ อัปเดต State
              total: activeTodos.length 
          });
          setManagerTodos(activeTodos);
          setLoading(false);
      },
      (err) => {
          console.error("🔥 Error fetching manager todos:", err);
          // 🛡️ THE FIX [Error Handling]: ข้อความที่อ่านรู้เรื่องสำหรับผู้จัดการ
          setError("เกิดปัญหาเชื่อมต่อกับเซิร์ฟเวอร์ ไม่สามารถโหลดรายการแจ้งเตือนได้");
          setLoading(false);
      }
    );

    return () => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    };
  }, []);

  const updateTaskStatus = useCallback(async (taskId, newStatus, payload = {}) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const actionData = { status: newStatus, ...payload, updatedAt: serverTimestamp() };
      
      // 🚀 THE FIX [ลด Writes จาก 3 เหลือ 1]: 
      // เลิกใช้ writeBatch อัปเดตแฟ้มงานผิดปกติ 3 ตำแหน่ง 
      // ปรับมาเป็นการเขียนข้อมูลตรงเข้า Collection 'todos' อย่างถูกต้องแค่ที่เดียว
      const taskRef = doc(db, 'todos', taskId);
      await updateDoc(taskRef, actionData);
      
      return true;
    } catch (err) {
      console.error("🔥 Error updating manager task:", err);
      // 🛡️ THE FIX [Error Handling]
      setError("การบันทึกสถานะล้มเหลว โปรดลองใหม่อีกครั้ง");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const startProcessing = useCallback(() => setIsSubmitting(true), []);
  const stopProcessing = useCallback(() => setIsSubmitting(false), []);

  return { managerTodos, stats, loading, error, isSubmitting, updateTaskStatus, startProcessing, stopProcessing };
};