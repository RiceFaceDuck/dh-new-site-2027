import React from 'react';
import { Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';

export default function PricingRulesTable({ config, addRule, removeRule, handleRuleChange }) {
  if (!config) return null;

  return (
    <div className="flex-1 flex flex-col bg-[var(--dh-bg-surface)] rounded-2xl shadow-sm border border-[var(--dh-border)] overflow-hidden transition-colors duration-300 min-h-[400px]">
      <div className="p-4 border-b border-[var(--dh-border)] bg-[var(--dh-bg-base)] flex justify-between items-center shrink-0">
        <h2 className="font-black text-sm text-[var(--dh-text-main)] uppercase tracking-widest flex items-center gap-2">
          <Settings size={16} className="text-[var(--dh-text-muted)]"/> เงื่อนไขราคา (Pricing Rules)
        </h2>
        <button onClick={addRule} className="text-xs bg-[var(--dh-bg-surface)] hover:bg-[var(--dh-text-main)] hover:text-[var(--dh-bg-surface)] border border-[var(--dh-border)] text-[var(--dh-text-main)] px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 transition-colors shadow-sm active:scale-95">
          <Plus size={14} strokeWidth={3}/> เพิ่มเงื่อนไข
        </button>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left text-sm min-w-[700px] border-collapse">
          <thead className="bg-[var(--dh-bg-surface)] text-[10px] font-black text-[var(--dh-text-muted)] uppercase tracking-widest sticky top-0 z-10 border-b-2 border-[var(--dh-border)] shadow-sm">
            <tr>
              <th className="px-4 py-3 w-40">หมวดหมู่</th>
              <th className="px-3 py-3 text-center w-24">สัญลักษณ์</th>
              <th className="px-3 py-3 w-32">ราคาทุน</th>
              <th className="px-3 py-3 text-center w-24">การกระทำ</th>
              <th className="px-3 py-3 w-28">จำนวน</th>
              <th className="px-3 py-3 text-center w-24">สถานะ</th>
              <th className="px-4 py-3 text-right w-16">ลบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--dh-border)]">
            {config.rules.map((rule, index) => (
              <tr key={rule.id} className="hover:bg-[var(--dh-bg-base)] transition-colors group relative">
                <td className="px-4 py-2.5 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--dh-accent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <input type="text" value={rule.category} onChange={(e) => handleRuleChange(index, 'category', e.target.value)} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] focus:ring-1 focus:ring-[var(--dh-accent-light)] transition-all" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <select value={rule.operator} onChange={(e) => handleRuleChange(index, 'operator', e.target.value)} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] cursor-pointer text-center">
                    <option value="<">{'< (น้อยกว่า)'}</option><option value="<=">{'<= (ไม่เกิน)'}</option><option value=">">{'> (มากกว่า)'}</option><option value=">=">{'>= (ตั้งแต่)'}</option><option value="all">ทั้งหมด</option>
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input type="number" value={rule.threshold} onChange={(e) => handleRuleChange(index, 'threshold', Number(e.target.value))} disabled={rule.operator === 'all'} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <select value={rule.action} onChange={(e) => handleRuleChange(index, 'action', e.target.value)} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-black text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] cursor-pointer text-center text-blue-600 dark:text-blue-400">
                    <option value="*">* (คูณ)</option><option value="/">/ (หาร)</option>
                  </select>
                </td>
                <td className="px-3 py-2.5">
                  <input type="number" step="0.01" value={rule.value} onChange={(e) => handleRuleChange(index, 'value', Number(e.target.value))} className="w-full bg-[var(--dh-bg-base)] border border-[var(--dh-border)] rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--dh-text-main)] outline-none focus:border-[var(--dh-accent)] focus:ring-1 focus:ring-[var(--dh-accent-light)] transition-all" />
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => handleRuleChange(index, 'isActive', !rule.isActive)} className={`text-[10px] px-3 py-1.5 rounded-md font-black uppercase tracking-wider transition-colors border ${rule.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-[var(--dh-bg-surface)] text-[var(--dh-text-muted)] border-[var(--dh-border)] opacity-60 hover:opacity-100'}`}>
                    {rule.isActive ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => removeRule(index)} className="p-1.5 text-[var(--dh-text-muted)] hover:text-rose-500 bg-[var(--dh-bg-base)] hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <Trash2 size={16} strokeWidth={2.5}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border-t border-[var(--dh-border)] flex items-start gap-2 shrink-0">
        <AlertTriangle size={14} className="shrink-0 mt-0.5 opacity-80"/>
        <p>ระบบจะทำงานแบบ Top-Down ตามลำดับหมวดหมู่ (หากหมวดหมู่เดียวกันมีเงื่อนไขแคบกว่า แนะนำให้ลาก/พิมพ์ไว้ด้านบน)</p>
      </div>
    </div>
  );
}
