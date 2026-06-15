import React from 'react';
import { Calculator } from 'lucide-react';

export default function PricingSimulation({ 
  simCost, setSimCost, simCategory, setSimCategory, 
  config, runSimulation, simResult 
}) {
  if (!config) return null;
  const uniqueCategories = [...new Set(config.rules.map(r => r.category))];

  return (
    <div className="bg-[var(--dh-bg-surface)] p-5 rounded-2xl shadow-sm border-2 border-indigo-500/20 flex-1 flex flex-col relative overflow-hidden transition-colors">
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none"><Calculator size={150} /></div>
      <h2 className="font-black text-sm text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
          จำลองคำนวณราคา (Simulation)
      </h2>
      
      <div className="space-y-4 relative z-10 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest block mb-1">ราคาทุน (Cost)</label>
            <input type="number" value={simCost} onChange={(e) => setSimCost(e.target.value)} placeholder="เช่น 1500" className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-xl px-3 py-2.5 text-sm font-black text-[var(--dh-text-main)] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner" />
          </div>
          <div>
            <label className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest block mb-1">หมวดหมู่</label>
            <select value={simCategory} onChange={(e) => setSimCategory(e.target.value)} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--dh-text-main)] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all shadow-inner cursor-pointer">
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              <option value="Other">อื่นๆ (ไม่มีกฎ)</option>
            </select>
          </div>
        </div>

        <button onClick={runSimulation} className="w-full bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/30 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95">
          ทดสอบคำนวณราคา
        </button>

        {simResult ? (
          <div className="mt-auto pt-4 border-t border-indigo-500/10 flex flex-col animate-in zoom-in-95 duration-300">
            {/* Simulation Glow Effect */}
            <div className="text-center bg-[var(--dh-bg-base)] rounded-xl p-4 border border-[var(--dh-border)] shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              
              <p className="text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest">ราคาขายปลีกสุทธิ (Retail Price)</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums tracking-tighter drop-shadow-sm">฿{simResult.calculatedPrice.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-[var(--dh-text-muted)] mt-1.5 opacity-80">ราคาดิบก่อนปัดเศษ: ฿{simResult.rawPrice.toFixed(2)}</p>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-xs px-2">
                <span className="font-bold text-[var(--dh-text-muted)]">กำไรสุทธิ:</span>
                <span className="font-black text-[var(--dh-text-main)] tabular-nums">฿{simResult.margin.toLocaleString()} <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1">({simResult.marginPercent.toFixed(1)}%)</span></span>
              </div>
              <div className="flex justify-between items-center text-xs px-2">
                <span className="font-bold text-[var(--dh-text-muted)]">กฎที่ทำงาน:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px] bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                  {simResult.appliedRule 
                    ? `${simResult.appliedRule.operator} ${simResult.appliedRule.threshold} | ${simResult.appliedRule.action} ${simResult.appliedRule.value}` 
                    : 'ไม่มี (ขายราคาทุน)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs bg-[var(--dh-bg-base)] p-2.5 rounded-lg border border-[var(--dh-border)] mt-2">
                <span className="font-bold text-[var(--dh-text-muted)]">สถานะปัดเศษ:</span>
                <span className="font-black text-amber-600 dark:text-amber-400 text-[10px] uppercase tracking-wider">{simResult.appliedRoundingType}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-4 flex-1 flex flex-col items-center justify-center opacity-40 text-[var(--dh-text-muted)] transition-opacity">
              <Calculator size={40} className="mb-2" strokeWidth={1.5}/>
              <span className="text-xs font-bold">รอจำลองข้อมูล</span>
          </div>
        )}
      </div>
    </div>
  );
}
