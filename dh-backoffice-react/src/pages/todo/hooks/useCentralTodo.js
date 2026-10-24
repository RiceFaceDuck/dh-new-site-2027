import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, limit, where, getDocs } from 'firebase/firestore';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';
import { historyService } from '../../../firebase/historyService';

/**
 * 🎯 Hook สำหรับจัดการข้อมูล To-do ส่วนกลาง (Operations, CS, Sales)
 * ทำหน้าที่ดึงข้อมูล Real-time, เพิ่ม, ลบ, แก้ไขสถานะ และจัดหมวดหมู่ข้อมูลให้พร้อมใช้งาน
 */
export const useCentralTodo = (filterType = 'PENDING') => {
  const [activeTodos, setActiveTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 🛡️ ป้องกันการกดปุ่มซ้ำ (Double Submission Prevention)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDocTime = (docItem) => {
    if (!docItem) return 0;
    const ts = docItem.completedAt || docItem.createdAt || docItem.requestedAt;
    if (!ts) return 0;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    return new Date(ts).getTime() || 0;
  };

  // 📥 1. ดึงเฉพาะงานค้างจริงแบบ Real-time ตอนเปิดหน้าจอ (ประหยัด Reads สูงสุด)
  useEffect(() => {
    setLoading(true);
    
    const todosRef = collection(db, getCollectionPath('todos'));
    const qTodos = query(
      todosRef,
      where('status', 'in', ['todo', 'in_progress', 'pending', 'pending_manager', 'waiting_item', 'processing']),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const claimsRef = collection(db, getCollectionPath('claims'));
    const qClaims = query(
      claimsRef,
      where('status', 'in', ['pending_manager', 'waiting_item', 'processing']),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    let currentTodos = [];
    let currentClaims = [];

    const emitActive = () => {
      const taskMap = new Map();

      // 1. เพิ่ม Todos ทั่วไป (งานค้าง)
      currentTodos.forEach(todo => {
        taskMap.set(todo.id, todo);
      });

      // 2. ผสาน Claims จากคอลเลกชัน claims โดยตรง (Single Source of Truth)
      currentClaims.forEach(claim => {
        const typeToCheck = claim.type || claim.taskType || 'CLAIM_APPROVAL';
        taskMap.set(claim.id, {
          ...claim,
          type: typeToCheck,
          customerName: claim.customerName || claim.customer?.accountName || claim.customer?.name || 'ลูกค้าทั่วไป',
          orderId: claim.orderId || claim.payload?.orderId || claim.id
        });
      });

      const merged = Array.from(taskMap.values());
      merged.sort((a, b) => getDocTime(b) - getDocTime(a));

      setActiveTodos(merged);
      setError(null);
      setLoading(false);
    };

    const unsubscribeTodos = onSnapshot(qTodos, (snapshot) => {
      currentTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      emitActive();
    }, (err) => {
      console.error("🔥 Error fetching central todos:", err);
      setError("ไม่สามารถโหลดข้อมูลระบบ To-do ได้ กรุณาตรวจสอบการเชื่อมต่อ");
      setLoading(false);
    });

    const unsubscribeClaims = onSnapshot(qClaims, (snapshot) => {
      currentClaims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      emitActive();
    }, (err) => {
      console.error("🔥 Error fetching claims for todos:", err);
    });

    // 🧹 คืนทรัพยากรเมื่อ Component ถูกทำลาย (Prevent Memory Leak)
    return () => {
      if (typeof unsubscribeTodos === 'function') unsubscribeTodos();
      if (typeof unsubscribeClaims === 'function') unsubscribeClaims();
    };
  }, []);

  // 📥 2. ดึงงานที่เสร็จแล้วแบบ On-Demand (Lazy-load เฉพาะเมื่อผู้ใช้คลิกเลือกแท็บ 'เสร็จแล้ว' หรือ 'ทั้งหมด')
  useEffect(() => {
    // 🚀 หากอยู่แท็บ 'ยังไม่ดำเนินการ' จะไม่มีการอ่านหรือดึงข้อมูลงานเก่าเด็ดขาด (ประหยัด Reads 100%)
    if (filterType !== 'COMPLETED' && filterType !== 'ALL') {
      return;
    }

    if (completedTodos.length > 0) return; // โหลดครั้งเดียวในเซสชัน

    let isMounted = true;
    setCompletedLoading(true);

    const fetchCompleted = async () => {
      try {
        const todosRef = collection(db, getCollectionPath('todos'));
        const qCompleted = query(
          todosRef,
          where('status', 'in', ['completed', 'rejected', 'cancelled', 'done']),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snap = await getDocs(qCompleted);
        if (isMounted) {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCompletedTodos(list);
        }
      } catch (err) {
        console.warn("⚠️ Warning fetching completed todos on demand:", err);
      } finally {
        if (isMounted) setCompletedLoading(false);
      }
    };

    fetchCompleted();

    return () => {
      isMounted = false;
    };
  }, [filterType, completedTodos.length]);

  // 📝 3. อัปเดตสถานะงาน (Optimistic UI Ready)
  const updateTodoStatus = useCallback(async (todoId, newStatus) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const todoRef = doc(db, getCollectionPath('todos'), todoId);
      await updateDoc(todoRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        completedAt: ['completed', 'rejected', 'cancelled', 'done'].includes(newStatus?.toLowerCase()) ? serverTimestamp() : null
      });
      return true; // สำเร็จ
    } catch (err) {
      console.error("🔥 Error updating todo status:", err);
      setError("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      return false; // ล้มเหลว
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  // 🗑️ 4. ลบงาน (Delete Task)
  const removeTodo = useCallback(async (todoId) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const todoRef = doc(db, getCollectionPath('todos'), todoId);
      await deleteDoc(todoRef);
      return true;
    } catch (err) {
      console.error("🔥 Error deleting todo:", err);
      setError("เกิดข้อผิดพลาดในการลบข้อมูล");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  // ➕ 5. สร้างงานใหม่แบบ Manual (Add Manual Task)
  const addManualTodo = useCallback(async (taskData) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const docRef = await addDoc(collection(db, getCollectionPath('todos')), {
        ...taskData,
        type: 'MANUAL', // บังคับว่าเป็นงานที่สร้างเอง
        status: 'pending', // แก้บั๊ก: ต้องพิมพ์เล็กตาม query
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 📝 บันทึก History Log ว่ามีการสร้างงานใหม่
      historyService.addLog('TODO', 'CREATE_TASK', docRef.id, `สร้างงานใหม่ (Manual): ${taskData.title}`);
      
      return true;
    } catch (err) {
      console.error("🔥 Error adding manual todo:", err);
      setError("ไม่สามารถสร้างงานใหม่ได้ กรุณาลองอีกครั้ง");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  // 📊 6. ส่งออกข้อมูลพร้อมหมวดหมู่ที่จัดเตรียมไว้ให้ UI ใช้งานได้ทันที
  const taskMap = new Map();
  activeTodos.forEach(t => taskMap.set(t.id, t));
  completedTodos.forEach(t => taskMap.set(t.id, t));
  const allMerged = Array.from(taskMap.values());
  allMerged.sort((a, b) => getDocTime(b) - getDocTime(a));

  return {
    todos: allMerged,
    activeTodos,
    completedTodos,
    
    // Status
    loading: loading || (completedLoading && (filterType === 'COMPLETED' || filterType === 'ALL') && completedTodos.length === 0),
    error,
    isSubmitting,
    
    // Actions
    updateTodoStatus,
    removeTodo,
    addManualTodo
  };
};
