import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const LineBrowserWarning = () => {
  const [isLineBrowser, setIsLineBrowser] = useState(false);

  useEffect(() => {
    // 🧠 ตรวจจับการใช้งานผ่าน LINE In-App Browser
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/Line/i.test(userAgent)) {
      setIsLineBrowser(true);
    }
  }, []);

  if (!isLineBrowser) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 p-3 shadow-[0_4px_15px_rgba(245,158,11,0.15)] relative z-[100] w-full animate-in slide-in-from-top-full duration-500">
      <div className="flex flex-col items-center justify-center text-center space-y-1.5 max-w-lg mx-auto">
        <div className="flex items-center text-amber-700 font-black text-sm tracking-tight gap-1.5">
          <AlertTriangle size={18} className="text-amber-500 animate-pulse" />
          พบการใช้งานผ่านแอป LINE 
        </div>
        <p className="text-amber-800/80 text-[11px] md:text-xs font-semibold">
          ระบบ <span className="font-bold text-amber-900">ไม่สามารถล็อกอิน</span> ผ่านเบราว์เซอร์ของ LINE ได้ <br />
          กรุณากดเมนูมุมขวาบน <strong>⋮</strong> แล้วเลือก <strong className="text-amber-900 bg-amber-200/50 px-1 py-0.5 rounded-sm border border-amber-300 mx-1 flex-inline items-center gap-1"> <ExternalLink size={10} className="inline" /> "เปิดในเบราว์เซอร์"</strong> (Chrome / Safari)
        </p>
      </div>
    </div>
  );
};

export default LineBrowserWarning;
