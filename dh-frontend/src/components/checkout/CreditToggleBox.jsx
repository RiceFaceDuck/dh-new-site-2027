import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { formatCredit } from '../../firebase/creditService';

export default function CreditToggleBox({
  user,
  creditLoading,
  creditBalance,
  useCreditToggle,
  setUseCreditToggle,
  useWallet
}) {
  if (!user || creditLoading || creditBalance <= 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-5 border border-indigo-100 shadow-sm animate-fade-in relative overflow-hidden transition-all duration-300 mb-6">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors ${useCreditToggle ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">ใช้ยอดค้างในระบบ (Wallet)</h4>
            <p className="text-xs text-gray-500 font-medium mt-0.5">มียอดคงเหลือ: <span className="text-indigo-600 font-bold">฿{formatCredit(creditBalance)}</span></p>
          </div>
        </div>
        
        {/* Tailwind Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={useCreditToggle} 
            onChange={(e) => setUseCreditToggle(e.target.checked)} 
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {/* ข้อความยืนยันเมื่อเปิดใช้งาน */}
      {useCreditToggle && useWallet > 0 && (
        <div className="mt-4 text-xs text-indigo-700 bg-indigo-50 p-2.5 rounded-lg flex items-center gap-2 font-medium animate-fade-in border border-indigo-100">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> 
          ใช้ยอดเงินในระบบ <strong>฿{formatCredit(useWallet)}</strong> ในออเดอร์นี้
        </div>
      )}
    </div>
  );
}
