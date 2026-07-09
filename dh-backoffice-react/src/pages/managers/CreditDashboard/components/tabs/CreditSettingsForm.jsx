import React from 'react';
import { ShieldAlert, Lock, Loader2, Check, Save } from 'lucide-react';

const FlatToggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between py-3 border-b border-slate-200 last:border-0 px-3 hover:bg-slate-50 transition-none">
    <div className="pr-4">
      <div className="text-sm font-bold text-slate-800 uppercase tracking-wide">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{description}</div>
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-xs border-2 transition-none focus:outline-hidden 
        ${checked ? 'bg-slate-800 border-slate-800' : 'bg-slate-200 border-slate-200'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform bg-white shadow-xs transition-transform duration-100 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  </div>
);

export default function CreditSettingsForm({ 
  settings, 
  setSettings, 
  isLoading, 
  isSaving, 
  saveSuccess, 
  handleToggle, 
  handleChange, 
  handleSaveSettings 
}) {
  return (
    <>
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
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest border-b border-slate-300 pb-2 mb-3 flex items-center gap-2">
                  <Lock size={14} className="text-slate-500" /> Security Rules
                </h4>
                <div className="bg-white border border-slate-300 rounded-xs">
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
                <div className="bg-white border border-slate-300 rounded-xs p-4 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Points Earning Rate (THB)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">ยอดสั่งซื้อกี่บาท ต่อการได้รับ 1 Point</p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono text-xs font-bold">฿</span>
                      </div>
                      <input 
                        type="text" 
                        value={settings.pointsEarningRate?.toLocaleString('th-TH') || '100'}
                        onChange={(e) => handleChange(e, 'pointsEarningRate')}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xs text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-hidden transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Ad Impression Cost (Points)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">แต้มที่หัก ต่อการแสดงโฆษณา 100 ครั้ง</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={settings.adImpressionCost?.toLocaleString('th-TH') || '5'}
                        onChange={(e) => handleChange(e, 'adImpressionCost')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xs text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-hidden transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Ad Click Cost (Points)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">แต้มที่หัก ต่อการคลิกเข้าชมโปรไฟล์ 1 ครั้ง</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={settings.adClickCost?.toLocaleString('th-TH') || '2'}
                        onChange={(e) => handleChange(e, 'adClickCost')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xs text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-hidden transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Partner Ranking Cost (Points)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">แต้มที่หัก ต่อวัน สำหรับการเป็น Partner แนะนำ</p>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={settings.partnerRankingCost?.toLocaleString('th-TH') || '50'}
                        onChange={(e) => handleChange(e, 'partnerRankingCost')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xs text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-hidden transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      SKU Bonus Rules (Format: SKU:Points)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">กติกาแต้มพิเศษเมื่อซื้อสินค้ารหัสที่กำหนด (1 บรรทัดต่อ 1 กติกา เช่น NB-001:500)</p>
                    <div className="relative">
                      <textarea 
                        value={settings.skuBonusRules || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, skuBonusRules: e.target.value }))}
                        placeholder="NB-001:500&#10;RAM-16GB:100"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xs text-sm font-mono text-slate-800 focus:border-slate-800 focus:bg-white outline-hidden transition-none min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest border-b border-slate-300 pb-2 mb-3 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-slate-500" /> Operational Limits
                </h4>
                
                <div className="bg-white border border-slate-300 rounded-xs p-4 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Max Transaction Limit (THB)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">ขีดจำกัดยอดเงินสูงสุดที่อนุญาตให้เติม/ตัดได้ต่อ 1 ครั้ง</p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono text-xs font-bold">฿</span>
                      </div>
                      <input 
                        type="text" 
                        value={settings.maxTransactionLimit.toLocaleString('th-TH')}
                        onChange={(e) => handleChange(e, 'maxTransactionLimit')}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xs text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-hidden transition-none text-right font-mono"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div className={!settings.notifyLargeTransactions ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      Large Transaction Threshold (THB)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">เกณฑ์ยอดเงินขั้นต่ำที่จะถือว่าเป็นรายการขนาดใหญ่ (Large TXN)</p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-mono text-xs font-bold">฿</span>
                      </div>
                      <input 
                        type="text" 
                        value={settings.largeTransactionThreshold.toLocaleString('th-TH')}
                        onChange={(e) => handleChange(e, 'largeTransactionThreshold')}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xs text-sm font-bold text-slate-800 focus:border-slate-800 focus:bg-white outline-hidden transition-none text-right font-mono"
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
          className={`px-6 py-2 rounded-xs font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-none
            ${isSaving || isLoading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </>
  );
}
