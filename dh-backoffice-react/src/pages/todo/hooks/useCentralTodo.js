import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 🎯 Hook สำหรับจัดการข้อมูล To-do ส่วนกลาง (Operations, CS, Sales)
 * ทำหน้าที่ดึงข้อมูล Real-time, เพิ่ม, ลบ, แก้ไขสถานะ และจัดหมวดหมู่ข้อมูลให้พร้อมใช้งาน
 */
export const useCentralTodo = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🛡️ ป้องกันการกดปุ่มซ้ำ (Double Submission Prevention)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📥 1. ดึงข้อมูลแบบ Real-time (Read Optimization)
  useEffect(() => {
    setLoading(true);
    
    // ดึงงานทั้งหมดในส่วนกลาง (ไม่ต้อง Query where status เพื่อลด Indexing แต่ใช้วิธี Filter ฝั่ง Client แทน ทำให้สลับ Tab ได้โดยไม่ต้องโหลดใหม่)
    const q = query(
      collection(db, 'todos'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTodos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTodos(fetchedTodos);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("🔥 Error fetching central todos:", err);
      setError("ไม่สามารถโหลดข้อมูลระบบ To-do ได้ กรุณาตรวจสอบการเชื่อมต่อ");
      setLoading(false);
    });

    // 🧹 คืนทรัพยากรเมื่อ Component ถูกทำลาย (Prevent Memory Leak)
    return () => unsubscribe();
  }, []);

  // 📝 2. อัปเดตสถานะงาน (Optimistic UI Ready)
  const updateTodoStatus = useCallback(async (todoId, newStatus) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const todoRef = doc(db, 'todos', todoId);
      await updateDoc(todoRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
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

  // 🗑️ 3. ลบงาน (Delete Task)
  const removeTodo = useCallback(async (todoId) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const todoRef = doc(db, 'todos', todoId);
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

  // ➕ 4. สร้างงานใหม่แบบ Manual (Add Manual Task)
  const addManualTodo = useCallback(async (taskData) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'todos'), {
        ...taskData,
        type: 'MANUAL', // บังคับว่าเป็นงานที่สร้างเอง
        status: 'PENDING',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error("🔥 Error adding manual todo:", err);
      setError("ไม่สามารถสร้างงานใหม่ได้ กรุณาลองอีกครั้ง");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  // 📊 5. ส่งออกข้อมูลพร้อมหมวดหมู่ที่จัดเตรียมไว้ให้ UI ใช้งานได้ทันที
  return {
    todos,
    // คัดกรองข้อมูลให้ UI ใช้ได้เลย (ไม่ต้องไปเขียน filter ซ้ำใน Todo.jsx)
    activeTodos: todos.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'),
    completedTodos: todos.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED'),
    
    // Status
    loading,
    error,
    isSubmitting,
    
    // Actions
    updateTodoStatus,
    removeTodo,
    addManualTodo
  };
};