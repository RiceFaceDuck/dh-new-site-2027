import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 🎯 Hook สำหรับจัดการข้อมูล To-do ของผู้จัดการ (Managers / Admins)
 * ทำหน้าที่ดึงข้อมูล Real-time เฉพาะรายการที่รอการอนุมัติระดับสูง 
 * เช่น アนุมัติ Partner, โฆษณา, ลงทะเบียนร้านค้า
 */
export const useManagerTodo = () => {
  const [managerTodos, setManagerTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🛡️ ป้องกันการกดปุ่มซ้ำเมื่อผู้จัดการกำลังกดอนุมัติ
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📥 1. ดึงข้อมูลแบบ Real-time
  useEffect(() => {
    setLoading(true);
    
    // ดึงงานทั้งหมดโดยเรียงตามเวลา (การ Filter สิทธิ์จะทำที่ Client เพื่อลดภาระการสร้าง Composite Index บน Firestore)
    const q = query(
      collection(db, 'todos'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 🚨 กำหนดประเภทงานที่เป็นสิทธิ์ของผู้จัดการเท่านั้น
      const managerTypes = [
        'USER_SKU_APPROVAL',   // อนุมัติโฆษณาสินค้า
        'BILLBOARD_APPROVAL',  // อนุมัติป้ายโฆษณา
        'PARTNER_APPROVAL',    // อนุมัติพาร์ทเนอร์
        'ACCOUNT_APPROVAL',    // อนุมัติบัญชีร้านค้าส่ง/ตัวแทน
        'AD_APPROVAL',         // ขอลงโฆษณาทั่วไป
        'WHOLESALE_APPROVAL'   // อนุมัติราคาส่ง (กรณีที่ผู้จัดการต้องเป็นคนเคาะ)
      ];

      // คัดกรองเฉพาะงานของผู้จัดการ และงานที่ยังไม่เสร็จ (ไม่เอา COMPLETED / CANCELLED)
      const fetchedTodos = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(todo => 
            managerTypes.includes(todo.type) && 
            todo.status !== 'COMPLETED' && 
            todo.status !== 'CANCELLED'
        );
      
      setManagerTodos(fetchedTodos);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("🔥 Error fetching manager todos:", err);
      setError("ไม่สามารถโหลดข้อมูลรายการอนุมัติของผู้จัดการได้");
      setLoading(false);
    });

    // 🧹 คืนทรัพยากรเมื่อ Component ถูกทำลาย (Prevent Memory Leak)
    return () => unsubscribe();
  }, []);

  // 📝 2. อัปเดตสถานะงานทั่วไป (ถ้าจำเป็นต้องอัปเดตสถานะตรงๆ โดยไม่ผ่าน Service พิเศษ)
  const updateTaskStatus = useCallback(async (taskId, newStatus, payload = {}) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const taskRef = doc(db, 'todos', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        ...payload,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error("🔥 Error updating manager task:", err);
      setError("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  // 🔒 3. Helper Functions สำหรับ Lock UI เวลากดอนุมัติผ่าน Service อื่นๆ
  const startProcessing = useCallback(() => setIsSubmitting(true), []);
  const stopProcessing = useCallback(() => setIsSubmitting(false), []);

  // 📊 4. ส่งออก State และ Actions ไปใช้งาน
  return {
    managerTodos,
    loading,
    error,
    isSubmitting,
    
    // Actions
    updateTaskStatus,
    startProcessing,
    stopProcessing
  };
};