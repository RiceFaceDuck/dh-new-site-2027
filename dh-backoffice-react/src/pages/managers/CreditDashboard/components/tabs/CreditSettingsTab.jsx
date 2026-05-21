import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { 
  ShieldAlert, Settings2, Save, Bell, 
  AlertTriangle, Lock, Loader2, CheckCircle2
} from 'lucide-react';

export default function CreditSettingsTab() {
  const [settings, setSettings] = useState({
    requireTwoFactor: true,
    autoSuspendNegative: true,
    maxTransactionLimit: 50000,
    notifyLargeTransactions: true,
    largeTransactionThreshold: 20000,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ดึงค่า Setting จาก Firebase มาแสดง
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'credit_config'));
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error("Fetch Settings Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaveSuccess(false);
  };

  const handleChange = (e, key) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setSettings(prev => ({ ...prev, [key]: parseInt(val || '0', 10) }));
    setSaveSuccess(false);
  };

  // บันทึกกลับลง Firebase
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await setDoc(doc(db, 'settings', 'credit_config'), settings, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button type="button" onClick={onChange} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  if (isLoading) return <div className="p-12 text-center text-slate-400"><Loader2 size={32} className="animate-spin mx-auto text-slate-300" /></div>;

  return (
    // นำ h-full ออก
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Settings2 size={18} className="text-slate-600" /> System & Security Settings
        </h3>
        <p className="text-xs text-slate-500 mt-1">บันทึกค่าและซิงค์กับ Database แบบเรียลไทม์</p>
      </div>

      <div className="p-6 overflow-y-auto space-y-8 max-h-[60vh]">
        <section>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Lock size={16} className="text-amber-500" /> Security Rules
          </h4>
          <div className="space-y-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-700">บังคับใช้อนุมัติ 2 ขั้นตอน (Maker/Checker)</div>
              </div>
              <ToggleSwitch checked={settings.requireTwoFactor} onChange={() => handleToggle('requireTwoFactor')} />
            </div>
            <div className="w-full h-px bg-slate-200/60"></div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-700">ระงับบัญชีอัตโนมัติหากยอดติดลบ</div>
              </div>
              <ToggleSwitch checked={settings.autoSuspendNegative} onChange={() => handleToggle('autoSuspendNegative')} />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <ShieldAlert size={16} className="text-rose-500" /> Transaction Limits
          </h4>
          <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl">
            <label className="block text-sm font-bold text-slate-700 mb-1">ขีดจำกัดยอดเงินสูงสุดต่อ 1 รายการ (Maximum per TXN)</label>
            <div className="relative w-full sm:w-1/2 mt-2">
              <input type="text" value={settings.maxTransactionLimit.toLocaleString('th-TH')} onChange={(e) => handleChange(e, 'maxTransactionLimit')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none" />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-slate-400 font-bold">฿</span></div>
            </div>
          </div>
        </section>
      </div>

      <div className="p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-4">
        {saveSuccess ? (
          <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm animate-pulse">
            <CheckCircle2 size={16} /> บันทึกการตั้งค่าระบบเรียบร้อย
          </div>
        ) : <div />}
        <button onClick={handleSaveSettings} disabled={isSaving} className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 text-white ${isSaving ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-900'}`}>
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}