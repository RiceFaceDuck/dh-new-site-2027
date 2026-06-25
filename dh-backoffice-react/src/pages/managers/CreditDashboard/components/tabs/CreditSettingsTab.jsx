import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../../firebase/config';
import { Settings, Save, ShieldAlert, Lock, Loader2, Check, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function CreditSettingsTab() {
  const [settings, setSettings] = useState({
    requireTwoFactor: true,
    autoSuspendNegative: true,
    maxTransactionLimit: 50000,
    notifyLargeTransactions: true,
    largeTransactionThreshold: 20000,
    pointsEarningRate: 100,
    adImpressionCost: 5,
    adClickCost: 2,
    partnerRankingCost: 50,
    skuBonusRules: '',
  });

  const [showGuide, setShowGuide] = useState(false);

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
    try {
      // 👇 FIX: แก้ Path ให้เป็น 6 ระดับ (เลขคู่)
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'credit_config');
      
      await setDoc(docRef, { 
        config: settings,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      toast.success('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    } catch (err) {
      console.error("🔥 DH-Core System Error [Save Settings]:", err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
      
      <div className="p-3 border-b border-slate-300 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-slate-600" />
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">System Configuration</h3>
            <p className="text-[10px] text-slate-500">Core Engine rules & operational limits</p>
          </div>
        </div>
        <button 
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors"
        >
          <Bell size={14} /> คู่มือการตั้งค่า (Guide)
        </button>
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
                <div className="bg-white border border-slate-300 rounded-sm p-4 space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Points Earning Rate (THB)
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">ยอดสั่งซื้อกี่บาท ต่อการได้รับ 1 Point</p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono text-xs font-bold">฿</span>
                      </div>
                      <input 
                        type="text" 
                        value={settings.pointsEarningRate?.toLocaleString('th-TH') || '100'}
                        onChange={(e) => handleChange(e, 'pointsEarningRate')}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-none transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Ad Impression Cost (Points)
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">แต้มที่หัก ต่อการแสดงโฆษณา 100 ครั้ง</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={settings.adImpressionCost?.toLocaleString('th-TH') || '5'}
                        onChange={(e) => handleChange(e, 'adImpressionCost')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-none transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <hr className="border-slate-200" />

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Ad Click Cost (Points)
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">แต้มที่หัก ต่อการคลิกเข้าชมโปรไฟล์ 1 ครั้ง</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={settings.adClickCost?.toLocaleString('th-TH') || '2'}
                        onChange={(e) => handleChange(e, 'adClickCost')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-none transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Partner Ranking Cost (Points)
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">แต้มที่หัก ต่อวัน สำหรับการเป็น Partner แนะนำ</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={settings.partnerRankingCost?.toLocaleString('th-TH') || '50'}
                        onChange={(e) => handleChange(e, 'partnerRankingCost')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-none transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      SKU Bonus Rules (Format: SKU:Points)
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">กติกาแต้มพิเศษเมื่อซื้อสินค้ารหัสที่กำหนด (1 บรรทัดต่อ 1 กติกา เช่น NB-001:500)</p>
                    <div className="relative">
                      <textarea 
                        value={settings.skuBonusRules || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, skuBonusRules: e.target.value }))}
                        placeholder="NB-001:500&#10;RAM-16GB:100"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-sm text-sm font-mono text-slate-800 focus:border-slate-800 focus:bg-white outline-none transition-none min-h-[80px]"
                      />
                    </div>
                  </div>
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

      {/* IN-APP DOCUMENTATION MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="text-blue-600" /> คู่มือการตั้งค่ากฎการใช้งานเครดิต (Credit Rules)
              </h2>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 bg-blue-50 p-2 rounded border border-blue-100">📖 ตำรา / คำอธิบาย (Overview)</h3>
                <p className="text-sm text-slate-600 leading-relaxed pl-2">
                  หน้านี้ใช้สำหรับตั้งค่า <b>กลไกหลักของระบบ Credit Point (Core Engine)</b> ซึ่งจะมีผลทันทีต่อระบบการเงินและเครดิตทั้งหมดในแพลตฟอร์ม ทั้งฝั่งผู้ใช้งาน (Front-end) และผู้ดูแล (Backoffice)
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 bg-emerald-50 p-2 rounded border border-emerald-100">⚙️ วิธีการใช้งาน (How-to)</h3>
                <ul className="text-sm text-slate-600 space-y-2 list-decimal pl-6">
                  <li><b>Security Rules:</b> เปิด/ปิด การบังคับใช้รหัสผ่าน 2 ขั้นตอนเวลาแจกพอยต์ หรือการระงับพาร์ทเนอร์อัตโนมัติหากพอยต์ติดลบ</li>
                  <li><b>Credit Valuation:</b> กำหนดอัตราส่วนการได้รับพอยต์จากการซื้อของ เช่น 100 บาท ได้รับ 1 พอยต์ (Points Earning Rate)</li>
                  <li><b>Ad Costing:</b> กำหนดพอยต์ที่จะถูกหักออกเมื่อโฆษณาแสดงผล (Ad Impression Cost) หรือเวลาซื้อตำแหน่ง Partner</li>
                  <li>เมื่อปรับเปลี่ยนตัวเลขแล้ว ให้กดปุ่ม <b>"Save Configuration"</b> ที่ด้านล่างขวา เพื่อบันทึกลงระบบ (มีผลทันที)</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 bg-amber-50 p-2 rounded border border-amber-100">💡 เทคนิคการใช้งาน (Tips & Tricks)</h3>
                <ul className="text-sm text-slate-600 space-y-2 list-disc pl-6">
                  <li>คุณสามารถใช้หน้า <b>"Smart Calculator"</b> เพื่อจำลองอัตราการเบิร์น (Burn Rate) ก่อนที่จะมาปรับลด/เพิ่มค่าต่างๆ ในหน้านี้</li>
                  <li>หากตั้งค่า <b>Max Transaction Limit</b> ให้ต่ำลง จะช่วยลดความเสี่ยงจากการที่ Admin เติมพอยต์ผิดพลาด (Fat-finger Error) ได้ดีมาก</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 bg-purple-50 p-2 rounded border border-purple-100">🎯 ตัวอย่างผลลัพธ์ (Expected Results)</h3>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm text-slate-600 space-y-2">
                  <p>⚠️ <b>ข้อควรระวัง:</b> หากปรับ "Points Earning Rate" จาก 100 บาท เป็น 50 บาท จะส่งผลให้ผู้ซื้อสินค้าได้รับพอยต์ <b>เพิ่มขึ้น 2 เท่า</b> ทันทีเมื่อออเดอร์ใหม่ได้รับการอนุมัติ (Paid)</p>
                  <p>ระบบจะ <b>ไม่มีผลย้อนหลัง</b> กับบิลที่อนุมัติไปแล้ว การเปลี่ยนแปลงจะเริ่มนับจากบิล หรือโฆษณาในวินาทีถัดไป</p>
                </div>
              </section>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
              <button onClick={() => setShowGuide(false)} className="px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded hover:bg-slate-900 transition-colors">
                รับทราบและเข้าใจ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}