import { useState, useCallback, useRef } from 'react';
import { collection, doc, query, orderBy, limit, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// 🌐 พจนานุกรมแปลข้อความบันทึกเหตุการณ์ระบบให้เป็นภาษาไทยแบบมืออาชีพ
export const translateLogMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return msg || '';
  const trimmed = msg.trim();
  
  if (trimmed.includes('Initiating real system diagnostics & DB ping') || trimmed.includes('Initiating system diagnostics')) {
    return 'เริ่มต้นการตรวจวิเคราะห์สถานะระบบและการตอบสนองของฐานข้อมูล';
  }
  if (trimmed.includes('System health check OK')) {
    const latencyMatch = trimmed.match(/DB Latency:\s*([\d.]+ms)/);
    const latency = latencyMatch ? latencyMatch[1] : '';
    const statusMatch = trimmed.match(/\(([^)]+)\)/);
    const status = statusMatch ? statusMatch[1] : 'healthy';
    const statusTh = status === 'healthy' ? 'ปกติ' : status;
    return `การตรวจเช็กความสมบูรณ์ของระบบเสร็จสิ้น: สถานะเสถียร ${latency ? `ความหน่วงฐานข้อมูล ${latency}` : ''} (${statusTh})`;
  }
  if (trimmed.includes('Objects are not valid as a React child')) {
    return 'ข้อผิดพลาดระบบ: พบการส่งคืนวัตถุผิดประเภทในคอมโพเนนต์การแสดงผล (ต้องใช้ Array ในการจัดกลุ่ม)';
  }
  if (trimmed.startsWith('Transaction completed:')) {
    return `การประมวลผลรายการสำเร็จ: ${trimmed.replace('Transaction completed:', '').trim()}`;
  }
  if (trimmed.startsWith('Transaction failed:')) {
    return `การประมวลผลรายการล้มเหลว: ${trimmed.replace('Transaction failed:', '').trim()}`;
  }
  if (trimmed.startsWith('ERR: Database check failed')) {
    return trimmed.replace('ERR: Database check failed', 'ข้อผิดพลาดระดับวิกฤต: การตรวจสอบฐานข้อมูลล้มเหลว');
  }
  if (trimmed.startsWith('ERR: Failed to connect to core services')) {
    return 'ข้อผิดพลาดระดับวิกฤต: ไม่สามารถเชื่อมต่อกับบริการหลักของระบบได้';
  }
  if (trimmed.startsWith('ERR:')) {
    return trimmed.replace(/^ERR:\s*/, 'ข้อผิดพลาดระดับวิกฤต: ');
  }
  if (trimmed.startsWith('Error:')) {
    return trimmed.replace(/^Error:\s*/, 'ข้อผิดพลาดระบบ: ');
  }
  return trimmed;
};

export default function useSystemHealth() {
  const [healthStatus, setHealthStatus] = useState('healthy');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const isCheckingRef = useRef(false);

  // 🛡️ เริ่มต้นด้วย Log มาตรฐานใน Memory ป้องกันการยิงเขียน DB พร่ำเพรื่อ
  const [healthLogs, setHealthLogs] = useState([{
    id: 'live-init',
    msg: 'ระบบการเงินกองกลางพร้อมใช้งาน (Standing by)',
    type: 'info',
    time: new Date().toLocaleTimeString('th-TH')
  }]);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('th-TH');
    setHealthLogs(prev => [{
      id: `live-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      msg: translateLogMessage(msg),
      type,
      time
    }, ...prev.slice(0, 49)]);
  }, []);

  const fetchHistoricalLogs = useCallback(async () => {
    try {
      const logsRef = collection(db, getCollectionPath('system_logs'));
      const q = query(logsRef, orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(docSnap => {
        const d = docSnap.data();
        let time = new Date().toLocaleTimeString('th-TH');
        if (d.createdAt && d.createdAt.toDate) {
          time = d.createdAt.toDate().toLocaleTimeString('th-TH');
        }
        const rawMsg = d.msg || d.message || d.details?.errorMessage || 'บันทึกเหตุการณ์ระบบ';
        return {
          id: docSnap.id,
          msg: translateLogMessage(rawMsg),
          type: d.type || (d.category === 'ERROR' ? 'error' : 'info'),
          time
        };
      });
      setHealthLogs(prev => [...prev.filter(l => l.id.startsWith('live-')), ...fetched].slice(0, 50));
    } catch (err) {
      console.warn('useSystemHealth: Failed to fetch historical logs:', err);
    }
  }, []);

  // 🚀 ฟังก์ชันตรวจสอบระบบแบบ Zero-Write (วัด Latency ด้วยการอ่าน ไม่สร้างขยะใน Firestore)
  const checkHealth = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsCheckingHealth(true);
    addLog('เริ่มต้นการตรวจวิเคราะห์สถานะระบบและการตอบสนองของฐานข้อมูล', 'info');

    try {
      await fetchHistoricalLogs();
      const startTime = performance.now();
      const pingRef = doc(db, getCollectionPath('settings'), 'credit_config');
      await getDoc(pingRef);
      const latencyMs = Math.round(performance.now() - startTime);

      setHealthStatus('healthy');
      addLog(`การตรวจเช็กความสมบูรณ์ของระบบเสร็จสิ้น: สถานะเสถียร ความหน่วงฐานข้อมูล ${latencyMs}ms (ปกติ)`, 'success');
    } catch (err) {
      console.error('useSystemHealth: Health check failed:', err);
      setHealthStatus('critical');
      addLog('ข้อผิดพลาดระดับวิกฤต: ไม่สามารถเชื่อมต่อกับบริการหลักของระบบได้', 'error');
    } finally {
      isCheckingRef.current = false;
      setIsCheckingHealth(false);
    }
  }, [addLog, fetchHistoricalLogs]);

  return {
    healthStatus,
    isCheckingHealth,
    healthLogs,
    checkHealth,
    addLog,
    setHealthStatus
  };
}