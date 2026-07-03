import { useState, useEffect } from 'react';

/**
 * 🌐 Custom Hook สำหรับตรวจสอบประสิทธิภาพเครือข่ายของลูกค้า
 * คืนค่าสถานะ isSlowConnection เป็น true หากเบราว์เซอร์ตรวจจับว่าใช้เน็ต 3G/2G หรือเปิด Data Saver
 */
export const useNetworkStatus = () => {
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState(null);

  useEffect(() => {
    const updateConnectionStatus = () => {
      // ตรวจสอบ Network Information API
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (conn) {
        setConnectionDetails({
          effectiveType: conn.effectiveType, // '2g', '3g', '4g'
          saveData: conn.saveData,           // true/false (โหมดประหยัดอินเทอร์เน็ต)
          rtt: conn.rtt,                     // Round-trip time (ms)
          downlink: conn.downlink            // Downlink speed (Mbps)
        });

        // ⚠️ เงื่อนไขเน็ตช้า: เชื่อมต่อด้วย 2G, 3G หรือผู้ใช้งานเปิดโหมดเซฟเน็ต (saveData)
        const isSlow = conn.effectiveType === '2g' || 
                       conn.effectiveType === '3g' || 
                       conn.saveData === true;
        
        setIsSlowConnection(isSlow);
      }
    };

    updateConnectionStatus();

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', updateConnectionStatus);
    }

    return () => {
      if (conn) {
        conn.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  return { isSlowConnection, connectionDetails };
};
