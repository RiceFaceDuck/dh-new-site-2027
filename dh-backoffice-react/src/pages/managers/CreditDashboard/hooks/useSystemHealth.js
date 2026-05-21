import { useState, useCallback } from 'react';

export default function useSystemHealth() {
  // State สำหรับเก็บสถานะเซิร์ฟเวอร์
  const [healthStatus, setHealthStatus] = useState('healthy'); // 'healthy' | 'warning' | 'critical'
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  
  // State สำหรับเก็บประวัติการทำงาน (Logs) เริ่มต้นด้วย Mock Data
  const [healthLogs, setHealthLogs] = useState([
    { time: new Date().toLocaleTimeString(), msg: "DH-Core: Authentication successful.", type: "success" },
    { time: new Date().toLocaleTimeString(), msg: "Credit Engine: Standing by.", type: "info" }
  ]);

  // ฟังก์ชันอเนกประสงค์สำหรับเพิ่ม Log ใหม่ (จำกัดไว้ที่ 50 รายการเพื่อไม่ให้กิน RAM)
  const addLog = useCallback((msg, type = 'info') => {
    setHealthLogs(prev => {
      const newLogs = [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev];
      return newLogs.slice(0, 50); // เก็บแค่ 50 รายการล่าสุด
    });
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