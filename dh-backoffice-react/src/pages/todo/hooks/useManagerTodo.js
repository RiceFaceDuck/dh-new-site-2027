/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';

// 🛡️ กำหนด App ID สำหรับการเข้าถึงแบบ Enterprise Sandbox
const appId = typeof window !== "undefined" && typeof window.__app_id !== "undefined" ? window.__app_id : "default-app-id";

/**
 * 🎯 Hook สำหรับจัดการข้อมูล To-do ของผู้จัดการ (Managers / Admins)
 * อัปเกรด: รองรับ Unified Ad Architecture (โฆษณา 3 รูปแบบ) พร้อมระบบ Real-time Stats
 */
export const useManagerTodo = () => {
  const [managerTodos, setManagerTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 📊 สถิติแบบ Real-time สำหรับทำ Badge แจ้งเตือนที่หน้าเมนู
  const [stats, setStats] = useState({
    pendingAds: 0,
    pendingPartners: 0,
    total: 0
  });
  
  // 🛡️ ป้องกันการกดปุ่มซ้ำเมื่อผู้จัดการกำลังกดอนุมัติ
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📥 1. ดึงข้อมูลแบบ Real-time (Optimized)
  useEffect(() => {
    setLoading(true);
    
    // อัปเกรด: ดึงงานจากโครงสร้าง Artifacts และจำกัด 100 รายการล่าสุดเพื่อประหยัดโควต้า Read
    const todosRef = collection(db, 'artifacts', appId, 'public', 'data', 'todos');
    const q = query(todosRef, orderBy('createdAt', 'desc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 🚨 กำหนดประเภทงานที่เป็นสิทธิ์ของผู้จัดการเท่านั้น (รวม 3 ระบบใหม่)
      const managerTypes = [
        'BUSINESS_CARD_AD_APPROVAL', // [NEW] นามบัตร
        'PRODUCT_LINK_AD_APPROVAL',  // [NEW] สินค้า
        'BILLBOARD_AD_APPROVAL',     // [NEW] แผ่นป้าย
        'PARTNER_APPROVAL',          // อนุมัติพาร์ทเนอร์
        'ACCOUNT_APPROVAL',          // อนุมัติบัญชีร้านค้าส่ง/ตัวแทน
        'WHOLESALE_APPROVAL',        // อนุมัติราคาส่ง
        'USER_SKU_APPROVAL',         // Legacy (ระบบเก่า)
        'AD_APPROVAL'                // Legacy (ระบบเก่า)
      ];

      let countAds = 0;
      let countPartners = 0;

      // คัดกรองเฉพาะงานของผู้จัดการ และงานที่ยังค้างอยู่ (PENDING / todo)
      const fetchedTodos = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(todo => {
          // รองรับทั้งฟิลด์ taskType (ระบบใหม่) และ type (ระบบเก่า)
          const taskType = todo.taskType || todo.type;
          const status = (todo.status || '').toUpperCase();
          
          if (!managerTypes.includes(taskType)) return false;
          
          // ซ่อนงานที่ทำเสร็จหรือถูกยกเลิกไปแล้ว
          if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED' || status === 'APPROVED') {
            return false;
          }

          // 📊 วิเคราะห์สถิติเพื่อนำไปใช้แสดงจุดแดงเตือน
          if (taskType.includes('AD_APPROVAL') || taskType.includes('SKU_APPROVAL')) {
            countAds++;
          }
          if (taskType === 'PARTNER_APPROVAL') {
            countPartners++;
          }

          return true;
        });
      
      setStats({
        pendingAds: countAds,
        pendingPartners: countPartners,
        total: fetchedTodos.length
      });
      
      setManagerTodos(fetchedTodos);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("🔥 Error fetching manager todos:", err);
      setError("ไม่สามารถโหลดข้อมูลรายการอนุมัติได้ (ตรวจสอบสิทธิ์ หรือรอการตั้งค่า Firebase)");
      setLoading(false);
    });

    // 🧹 คืนทรัพยากรเมื่อ Component ถูกทำลาย
    return () => unsubscribe();
  }, []);

  // 📝 2. อัปเดตสถานะงาน (Atomic Update)
  const updateTaskStatus = useCallback(async (taskId, newStatus, payload = {}) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId);
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

  // 🔒 3. Helper Functions สำหรับ Lock UI เวลากดอนุมัติผ่าน Service ย่อย
  const startProcessing = useCallback(() => setIsSubmitting(true), []);
  const stopProcessing = useCallback(() => setIsSubmitting(false), []);

  // 📊 4. ส่งออก State และ Actions ไปใช้งาน
  return {
    managerTodos,
    stats, // 🚀 ส่งออก Stats สำหรับ Badge Notification
    loading,
    error,
    isSubmitting,
    
    // Actions
    updateTaskStatus,
    startProcessing,
    stopProcessing
  };
};