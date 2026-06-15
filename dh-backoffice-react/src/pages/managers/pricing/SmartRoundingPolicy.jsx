import React from 'react';
import { Calculator } from 'lucide-react';

export default function SmartRoundingPolicy({ config, handleRoundingChange }) {
  if (!config) return null;

  return (
    <div className="bg-[var(--dh-bg-surface)] p-5 rounded-2xl shadow-sm border border-[var(--dh-border)] shrink-0 transition-colors">
      <h2 className="font-black text-sm text-[var(--dh-text-main)] uppercase tracking-widest mb-4 flex items-center gap-2">
        <Calculator size={14} className="text-[var(--dh-text-muted)]"/> ปัดเศษอัตโนมัติ (Psychological Pricing)
      </h2>
      <div className="space-y-3">
        
        {/* Tactile Radio Card (Custom) */}
        <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-300 ${config.rounding?.type === 'custom' ? 'border-blue-500 bg-blue-500/5 shadow-sm transform scale-[1.01]' : 'border-[var(--dh-border)] bg-[var(--dh-bg-base)] hover:border-blue-500/30'}`}>
          <input type="radio" name="roundType" value="custom" checked={config.rounding?.type === 'custom'} onChange={() => handleRoundingChange('type', 'custom')} className="mt-1 w-4 h-4 text-blue-600 border-[var(--dh-border)] bg-[var(--dh-bg-surface)] cursor-pointer" />
          <div className="w-full">
            <p className={`font-black text-xs transition-colors ${config.rounding?.type === 'custom' ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--dh-text-main)]'}`}>เปิดใช้งานปัดเศษ (Custom)</p>
            
            {config.rounding?.type === 'custom' && (
              <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                <div>
                  <label className="text-[10px] font-bold text-[var(--dh-text-muted)] block mb-1">ให้ราคาลงท้ายด้วย (เงื่อนไข 1)</label>
                  <input 
                    type="text" 
                    placeholder="เช่น 90 หรือ 99" 
                    value={config.rounding?.primaryTarget || ''} 
                    onChange={(e) => handleRoundingChange('primaryTarget', e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full border border-[var(--dh-border)] bg-[var(--dh-bg-surface)] rounded-lg px-3 py-2 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-inner" 
                  />
                </div>
                
                <div className="pt-3 border-t border-blue-500/10">
                  <label className="flex items-center gap-2 cursor-pointer mb-2.5">
                    <input type="checkbox" checked={config.rounding?.enableFallback || false} onChange={(e) => handleRoundingChange('enableFallback', e.target.checked)} className="w-3.5 h-3.5 rounded text-blue-600 border-[var(--dh-border)] bg-[var(--dh-bg-surface)] cursor-pointer" />
                    <span className="text-[10px] font-black text-[var(--dh-text-main)]">เปิดใช้เงื่อนไขสำรอง (Fallback)</span>
                  </label>
                  
                  {config.rounding?.enableFallback && (
                    <div className="pl-6 animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold text-[var(--dh-text-muted)] block mb-1">ถ้าเงื่อนไขแรกใช้ไม่ได้ ให้ลงท้ายด้วย</label>
                      <input 
                        type="text" 
                        placeholder="เช่น 9" 
                        value={config.rounding?.fallbackTarget || ''} 
                        onChange={(e) => handleRoundingChange('fallbackTarget', e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full border border-[var(--dh-border)] bg-[var(--dh-bg-surface)] rounded-lg px-3 py-2 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-inner" 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </label>

        {/* Tactile Radio Card (None) */}
        <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-300 ${config.rounding?.type === 'none' ? 'border-[var(--dh-text-muted)] bg-[var(--dh-bg-surface)] shadow-sm transform scale-[1.01]' : 'border-[var(--dh-border)] bg-[var(--dh-bg-base)] hover:border-[var(--dh-text-muted)]'}`}>
          <input type="radio" name="roundType" value="none" checked={config.rounding?.type === 'none'} onChange={() => handleRoundingChange('type', 'none')} className="mt-1 w-4 h-4 text-slate-600 border-[var(--dh-border)] bg-[var(--dh-bg-surface)] cursor-pointer" />
          <div>
            <p className={`font-black text-xs transition-colors ${config.rounding?.type === 'none' ? 'text-[var(--dh-text-main)]' : 'text-[var(--dh-text-muted)]'}`}>ไม่ปัดเศษ (ตามจริง)</p>
            <p className="text-[10px] font-bold text-[var(--dh-text-muted)] mt-0.5">ระบบจะใช้ทศนิยมปัดขึ้นตามผลลัพธ์ดิบ</p>
          </div>
        </label>

      </div>
    </div>
  );
}
