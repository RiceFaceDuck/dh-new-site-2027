import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase/config';
import { collection, onSnapshot, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "default-app-id";

export const useManagerTodo = () => {
  const [managerTodos, setManagerTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ pendingAds: 0, pendingPartners: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // ดึงงานจากแหล่งรวมศูนย์
    const todosRef = collection(db, 'artifacts', appId, 'public', 'data', 'todos');

    const unsubscribe = onSnapshot(todosRef, (snapshot) => {
      const managerTypes = ['BUSINESS_CARD_AD_APPROVAL', 'PRODUCT_LINK_AD_APPROVAL', 'BILLBOARD_AD_APPROVAL', 'PARTNER_APPROVAL', 'ACCOUNT_APPROVAL', 'WHOLESALE_APPROVAL', 'USER_SKU_APPROVAL', 'AD_APPROVAL'];
      
      let countAds = 0;
      let countPartners = 0;

      const fetchedTodos = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(todo => {
          const taskType = todo.taskType || todo.type || '';
          const status = (todo.status || '').toUpperCase();
          
          if (!managerTypes.some(t => taskType.includes(t))) return false;
          if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED' || status === 'APPROVED') return false;

          if (taskType.includes('AD_APPROVAL') || taskType.includes('SKU_APPROVAL')) countAds++;
          if (taskType.includes('PARTNER_APPROVAL')) countPartners++;
          return true;
        })
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setStats({ pendingAds: countAds, pendingPartners: countPartners, total: fetchedTodos.length });
      setManagerTodos(fetchedTodos);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("🔥 Error fetching manager todos:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateTaskStatus = useCallback(async (taskId, newStatus, payload = {}) => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    
    try {
      const batch = writeBatch(db);
      const actionData = { status: newStatus, ...payload, updatedAt: serverTimestamp() };
      
      // 🚀 The Bulletproof Fix: ใช้ set() แบบ merge: true เขียนทุกกระดาน ป้องกัน Error หาไฟล์ไม่เจอ 100%
      batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'todos', taskId), actionData, { merge: true });
      batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'manager_todos', taskId), actionData, { merge: true });
      batch.set(doc(db, 'todos', taskId), actionData, { merge: true });
      
      await batch.commit();
      return true;
    } catch (err) {
      console.error("🔥 Error updating manager task:", err);
      setError("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const startProcessing = useCallback(() => setIsSubmitting(true), []);
  const stopProcessing = useCallback(() => setIsSubmitting(false), []);

  return { managerTodos, stats, loading, error, isSubmitting, updateTaskStatus, startProcessing, stopProcessing };
};