import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { Settings, Save, ShieldAlert, Lock, Loader2, Check, Bell } from 'lucide-react';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 👇 FIX: แก้ Path ให้เป็น 6 ระดับ (เลขคู่)
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.config) {
            setSettings(prev => ({ ...prev, ...data.config }));
          }
        }
      } catch (err) {
        console.error("🔥 DH-Core System Error [Fetch Settings]:", err);
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // 👇 FIX: แก้ Path ให้เป็น 6 ระดับ (เลขคู่)
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
      
      await setDoc(docRef, { 
        config: settings,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("🔥 DH-Core System Error [Save Settings]:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const FlatToggle = ({ checked, onChange, label, description }) => (
    <div className="flex items-start justify-between py-3 border-b border-slate-200 last:border-0 px-3 hover:bg-slate-50 transition-none">
      <div className="pr-4">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">{label}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-sm border-2 transition-none focus:outline-none 
          ${checked ? 'bg-slate-800 border-slate-800' : 'bg-slate-200 border-slate-200'}`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform bg-white shadow-sm transition-transform duration-100 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col bg-white border border-slate-300 rounded-sm min-h-[500px]">
      
      <div className="p-3 border-b border-slate-300 bg-slate-50 flex items-center gap-2">
        <Settings size={16} className="text-slate-600" />
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">System Configuration</h3>
          <p className="text-[10px] text-slate-500">Core Engine rules & operational limits</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
            <Loader2 size={24} className="animate-spin text-slate-400" />
            <span className="text-xs font-mono uppercase tracking-widest">Loading Configurations...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
            
            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-300 pb-2 mb-3 flex items-center gap-2">
                  <Lock size={14} className="text-slate-500" /> Security Rules
                </h4>
                <div className="bg-white border border-slate-300 rounded-sm">
                  <FlatToggle 
                    label="Require 2-Step Approval" 
                    description="บังคับใช้การอนุมัติ 2 ขั้นตอน (Maker/Checker) สำหรับการปรับเครดิต"
                    checked={settings.requireTwoFactor} 
                    onChange={() => handleToggle('requireTwoFactor')} 
                  />
                  <FlatToggle 
                    label="Auto-Suspend on Negative" 
                    description="ระงับบัญชีพาร์ทเนอร์อัตโนมัติหากยอดเครดิตคงเหลือต่ำกว่าศูนย์ (ติดลบ)"
                    checked={settings.autoSuspendNegative} 
                    onChange={() => handleToggle('autoSuspendNegative')} 
                  />
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-300 pb-2 mb-3 flex items-center gap-2">
                  <Bell size={14} className="text-slate-500" /> Audit & Notifications
                </h4>
                <div className="bg-white border border-slate-300 rounded-sm">
                  <FlatToggle 
                    label="Notify Large Transactions" 
                    description="ส่งแจ้งเตือนพิเศษเมื่อมีการทำรายการจำนวนเงินสูงกว่าเกณฑ์ที่กำหนด"
                    checked={settings.notifyLargeTransactions} 
                    onChange={() => handleToggle('notifyLargeTransactions')} 
                  />
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-300 pb-2 mb-3 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-slate-500" /> Operational Limits
                </h4>
                
                <div className="bg-white border border-slate-300 rounded-sm p-4 space-y-5">
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Max Transaction Limit (THB)
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">ขีดจำกัดยอดเงินสูงสุดที่อนุญาตให้เติม/ตัดได้ต่อ 1 ครั้ง</p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono text-xs font-bold">฿</span>
                      </div>
                      <input 
                        type="text" 
                        value={settings.maxTransactionLimit.toLocaleString('th-TH')}
                        onChange={(e) => handleChange(e, 'maxTransactionLimit')}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-none transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div className={!settings.notifyLargeTransactions ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Large Transaction Threshold (THB)
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">เกณฑ์ยอดเงินขั้นต่ำที่จะถือว่าเป็นรายการขนาดใหญ่ (Large TXN)</p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono text-xs font-bold">฿</span>
                      </div>
                      <input 
                        type="text" 
                        value={settings.largeTransactionThreshold.toLocaleString('th-TH')}
                        onChange={(e) => handleChange(e, 'largeTransactionThreshold')}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-none transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                </div>
              </section>
            </div>

          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-300 bg-slate-100 flex items-center justify-between">
        <div className="text-xs font-bold font-mono">
          {saveSuccess ? (
            <span className="text-emerald-600 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
              <Check size={14} strokeWidth={3} /> CONFIGURATION SAVED
            </span>
          ) : (
            <span className="text-slate-400">WAITING FOR CHANGES...</span>
          )}
        </div>
        
        <button 
          onClick={handleSaveSettings} 
          disabled={isSaving || isLoading} 
          className={`px-6 py-2 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-none
            ${isSaving || isLoading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

    </div>
  );
}