import React, { useState } from 'react';
import { 
  ShieldAlert, Settings2, Save, Bell, 
  AlertTriangle, Lock, Loader2, CheckCircle2
} from 'lucide-react';

export default function CreditSettingsTab() {
  // ==========================================
  // States สำหรับเก็บค่าการตั้งค่าต่างๆ
  // ==========================================
  const [settings, setSettings] = useState({
    requireTwoFactor: true,
    autoSuspendNegative: true,
    maxTransactionLimit: 50000,
    notifyLargeTransactions: true,
    largeTransactionThreshold: 20000,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ==========================================
  // Handlers
  // ==========================================
  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaveSuccess(false); // รีเซ็ตสถานะปุ่มเซฟ
  };

  const handleChange = (e, key) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setSettings(prev => ({ ...prev, [key]: parseInt(val || '0', 10) }));
    setSaveSuccess(false);
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // จำลองการบันทึกข้อมูลลง Database
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // ให้ข้อความ "บันทึกสำเร็จ" หายไปหลัง 3 วินาที
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  // ==========================================
  // Custom Components ภายใน
  // ==========================================
  // คอมโพเนนต์สวิตช์เปิด-ปิด
  const ToggleSwitch = ({ checked, onChange }) => (
    <button 
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}`} 
      />
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Settings2 size={18} className="text-slate-600" />
            System & Security Settings
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ตั้งค่าเงื่อนไขความปลอดภัยและข้อจำกัดของระบบเครดิต (Core Rules)
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="p-6 flex-1 overflow-auto space-y-8">
        
        {/* Section 1: Security Rules */}
        <section>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Lock size={16} className="text-amber-500" />
            กฎความปลอดภัย (Security Rules)
          </h4>
          <div className="space-y-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
            
            {/* Setting Item */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-700">บังคับใช้อนุมัติ 2 ขั้นตอน (Maker/Checker)</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  รายการที่มียอดสูงเกินกำหนด ต้องได้รับการอนุมัติจากผู้จัดการอีกท่านหนึ่งก่อนระบบจะดำเนินการ
                </div>
              </div>
              <ToggleSwitch checked={settings.requireTwoFactor} onChange={() => handleToggle('requireTwoFactor')} />
            </div>

            <div className="w-full h-px bg-slate-200/60"></div>

            {/* Setting Item */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-700">ระงับบัญชีอัตโนมัติหากยอดติดลบ (Auto-Suspend)</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  หากพบว่าเครดิตของพาร์ทเนอร์ติดลบ ระบบจะทำการระงับการสั่งซื้อทันทีเพื่อป้องกันความเสี่ยง
                </div>
              </div>
              <ToggleSwitch checked={settings.autoSuspendNegative} onChange={() => handleToggle('autoSuspendNegative')} />
            </div>

          </div>
        </section>

        {/* Section 2: Transaction Limits */}
        <section>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <ShieldAlert size={16} className="text-rose-500" />
            ข้อจำกัดการทำรายการ (Transaction Limits)
          </h4>
          <div className="space-y-5 bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
            
            {/* Input Item */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                ขีดจำกัดยอดเงินสูงสุดต่อ 1 รายการ (Maximum per TXN)
              </label>
              <div className="text-[11px] text-slate-500 mb-2">ป้องกันการคีย์ตัวเลขผิดพลาด (Human Error) โดยจำกัดยอดเติม/ลดสูงสุดที่ทำได้ในครั้งเดียว</div>
              <div className="relative w-full sm:w-1/2">
                <input 
                  type="text" 
                  value={settings.maxTransactionLimit.toLocaleString('th-TH')}
                  onChange={(e) => handleChange(e, 'maxTransactionLimit')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold">฿</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 3: Notifications */}
        <section>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Bell size={16} className="text-indigo-500" />
            การแจ้งเตือน (Alerts & Notifications)
          </h4>
          <div className="space-y-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
            
            {/* Setting Item */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-sm font-bold text-slate-700">แจ้งเตือนรายการผิดปกติ / ยอดสูง (Large TXN Alert)</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  ส่งการแจ้งเตือนไปยังผู้ดูแลระบบผ่านช่องทางที่ตั้งไว้ เมื่อมีการทำรายการเครดิตที่มียอดสูงกว่ากำหนด
                </div>
              </div>
              <ToggleSwitch checked={settings.notifyLargeTransactions} onChange={() => handleToggle('notifyLargeTransactions')} />
            </div>

            {/* Sub-Input Item (แสดงเมื่อเปิด Toggle ด้านบน) */}
            <div className={`transition-all duration-300 overflow-hidden ${settings.notifyLargeTransactions ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pl-0 sm:pl-4 border-l-2 border-indigo-200 pt-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  แจ้งเตือนเมื่อยอดรายการสูงกว่า (บาท)
                </label>
                <div className="relative w-full sm:w-1/3">
                  <input 
                    type="text" 
                    value={settings.largeTransactionThreshold.toLocaleString('th-TH')}
                    onChange={(e) => handleChange(e, 'largeTransactionThreshold')}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-xs">฿</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
        
        {/* Danger Zone Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-amber-800">คำเตือนผู้ดูแลระบบ</h5>
            <p className="text-[11px] text-amber-700/80 mt-1">การเปลี่ยนแปลงการตั้งค่าในหน้านี้จะมีผลบังคับใช้กับทุกรายการของพาร์ทเนอร์ทันที โปรดตรวจสอบตัวเลขให้ถูกต้องก่อนกดบันทึก</p>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-4">
        {saveSuccess ? (
          <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm animate-pulse">
            <CheckCircle2 size={16} />
            บันทึกการตั้งค่าระบบเรียบร้อยแล้ว
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            ระบบจัดเก็บประวัติการแก้ไขการตั้งค่าโดยอัตโนมัติ
          </div>
        )}

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm
            ${isSaving 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-800 hover:bg-slate-900 text-white hover:shadow-md'
            }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>

    </div>
  );
}