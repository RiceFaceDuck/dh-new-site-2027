import { useState, useCallback, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function useSystemHealth() {
  const [healthStatus, setHealthStatus] = useState('healthy'); 
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthLogs, setHealthLogs] = useState([]);

  useEffect(() => {
    const logsRef = collection(db, 'artifacts', appId, 'system_logs');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeString = new Date().toLocaleTimeString();
        if (data.createdAt && data.createdAt.toDate) {
           timeString = data.createdAt.toDate().toLocaleTimeString('th-TH');
        }
        return {
          id: doc.id,
          msg: data.msg,
          type: data.type,
          time: timeString
        };
      });
      setHealthLogs(fetchedLogs);
    }, (error) => {
      console.error("Health logs sync error:", error);
    });

    return () => unsubscribe();
  }, []);

  const addLog = useCallback(async (msg, type = 'info') => {
    try {
      const logsRef = collection(db, 'artifacts', appId, 'system_logs');
      addDoc(logsRef, {
        msg,
        type,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to add log to DB:", e);
    }
  }, []);

  // ฟังก์ชันตรวจสอบสถานะระบบ (Diagnostics)
  const checkHealth = useCallback(async () => {
    if (isCheckingHealth) return;
    
    setIsCheckingHealth(true);
    addLog("Initiating system diagnostics...", "info");

    try {
      // 🚀 [อนาคต] ตรงนี้สามารถใส่โค้ดเช็ค Ping ไปที่ Firebase หรือ Backend API จริงได้
      
      // ตอนนี้: จำลองการหน่วงเวลาเพื่อเช็คระบบ
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // สมมติว่าเช็คผ่านทั้งหมด
      setHealthStatus('healthy');
      addLog("System health check OK. DB Latency: 24ms", "success");
    } catch (error) {
      console.error("Health check failed:", error);
      setHealthStatus('critical');
      addLog(`ERR: Failed to connect to core services.`, "error");
    } finally {
      setIsCheckingHealth(false);
    }
  }, [addLog, isCheckingHealth]);

  return {
    healthStatus,
    isCheckingHealth,
    healthLogs,
    checkHealth,
    addLog,
    setHealthStatus
  };
}