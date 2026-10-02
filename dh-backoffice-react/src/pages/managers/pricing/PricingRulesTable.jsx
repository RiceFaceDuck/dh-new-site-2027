import { useMemo, useRef, useEffect } from 'react';
import { Settings, Plus, Trash2, AlertTriangle, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { normalizeCategory } from 'dh-shared/src/utils/pricingEngine';

export default function PricingRulesTable({ 
  config, 
  addRule, 
  removeRule, 
  handleRuleChange,
  moveRule,
  categories = [],
  matchedRuleId = null 
}) {
  const rowRefs = useRef({});

  const formattedCategories = useMemo(() => {
    const seen = new Set();
    const result = [];
    (categories || []).forEach(item => {
      const val = item.type || item.name;
      const normKey = normalizeCategory(val);
      if (!seen.has(normKey)) {
        seen.add(normKey);
        result.push({
          id: item.id || val,
          value: val,
          name: item.name,
          normKey: normKey
        });
      }
    });
    return result;
  }, [categories]);

  useEffect(() => {
    if (matchedRuleId && rowRefs.current[matchedRuleId]) {
      rowRefs.current[matchedRuleId].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [matchedRuleId]);

  if (!config) return null;

  return (
    <div className="flex-1 flex flex-col bg-(--dh-bg-surface) rounded-2xl shadow-xs border border-(--dh-border) overflow-hidden transition-colors duration-300 min-h-[400px]">
      
      {/* Header Bar */}
      <div className="p-4 border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center shrink-0 shadow-sm">
        <h2 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Settings size={16} />
          </div>
          <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-xs">
            เงื่อนไขราคา (Pricing Rules)
          </span>
          {matchedRuleId && (
            <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 animate-pulse backdrop-blur-xs">
              <Sparkles size={11} className="text-amber-400" /> ไฮไลต์กฎที่ตรงกับสินค้า
            </span>
          )}
        </h2>

        <button 
          type="button"
          onClick={addRule} 
          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition-all shadow-md hover:shadow-indigo-500/20 active:scale-95 cursor-pointer"
        >
          <Plus size={14} strokeWidth={3} /> เพิ่มเงื่อนไข
        </button>
      </div>
      
      {/* Rules Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
        <table className="w-full text-left text-sm min-w-[760px] border-collapse">
          <thead className="bg-(--dh-bg-surface) text-[10px] font-black text-(--dh-text-muted) uppercase tracking-widest sticky top-0 z-10 border-b-2 border-(--dh-border) shadow-xs">
            <tr>
              <th className="px-2 py-3 text-center w-12">ลำดับ</th>
              <th className="px-2 py-3 text-center w-16">สลับ</th>
              <th className="px-3 py-3 w-44">หมวดหมู่</th>
              <th className="px-3 py-3 text-center w-24">สัญลักษณ์</th>
              <th className="px-3 py-3 w-28">ราคาทุน</th>
              <th className="px-3 py-3 text-center w-20">การกระทำ</th>
              <th className="px-3 py-3 w-24">จำนวน</th>
              <th className="px-3 py-3 text-center w-20">สถานะ</th>
              <th className="px-4 py-3 text-right w-14">ลบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--dh-border)">
            {config.rules.map((rule, index) => {
              const isMatched = matchedRuleId === rule.id;
              return (
                <tr 
                  key={rule.id} 
                  ref={el => rowRefs.current[rule.id] = el}
                  className={`transition-all duration-300 group relative ${
                    isMatched 
                      ? 'bg-blue-500/20 dark:bg-blue-600/30 border-l-4 border-l-blue-600 ring-1 ring-blue-500/40 font-black z-10 shadow-xs' 
                      : 'hover:bg-(--dh-bg-base)'
                  }`}
                >
                  {/* ลำดับ Top-Down */}
                  <td className="px-2 py-2.5 text-center font-mono font-black text-xs text-(--dh-text-muted)">
                    #{index + 1}
                  </td>

                  {/* ปุ่ม Move Up / Down */}
                  <td className="px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveRule && moveRule(index, 'up')}
                        title="เลื่อนขึ้น (เพิ่มลำดับความสำคัญ Top-Down)"
                        className="p-1 rounded-md text-(--dh-text-muted) hover:text-indigo-600 hover:bg-indigo-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronUp size={14} strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        disabled={index === config.rules.length - 1}
                        onClick={() => moveRule && moveRule(index, 'down')}
                        title="เลื่อนลง (ลดลำดับความสำคัญ)"
                        className="p-1 rounded-md text-(--dh-text-muted) hover:text-indigo-600 hover:bg-indigo-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronDown size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-2.5 relative">
                    {!isMatched && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-(--dh-accent) opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    )}
                    <select 
                      value={rule.category} 
                      onChange={(e) => handleRuleChange(index, 'category', e.target.value)} 
                      className="w-full bg-(--dh-bg-base) border border-(--dh-border) rounded-md px-2.5 py-1.5 text-xs font-bold text-(--dh-text-main) outline-hidden focus:border-(--dh-accent) focus:ring-1 focus:ring-(--dh-accent-light) transition-all cursor-pointer appearance-none"
                    >
                      <option value="" disabled>-- เลือกหมวดหมู่ --</option>
                      {rule.category && !formattedCategories.some(cat => normalizeCategory(cat.value) === normalizeCategory(rule.category)) && (
                        <option value={rule.category}>{rule.category}</option>
                      )}
                      {formattedCategories.map(cat => (
                        <option key={cat.id || cat.value} value={cat.value}>
                          {cat.name} ({cat.normKey})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <select 
                      value={rule.operator} 
                      onChange={(e) => handleRuleChange(index, 'operator', e.target.value)} 
                      className="w-full bg-(--dh-bg-base) border border-(--dh-border) rounded-md px-2.5 py-1.5 text-xs font-bold text-(--dh-text-main) outline-hidden focus:border-(--dh-accent) cursor-pointer text-center"
                    >
                      <option value="<">{'< (น้อยกว่า)'}</option>
                      <option value="<=">{'<= (ไม่เกิน)'}</option>
                      <option value=">">{'> (มากกว่า)'}</option>
                      <option value=">=">{'>= (ตั้งแต่)'}</option>
                      <option value="all">ทั้งหมด</option>
                    </select>
                  </td>

                  <td className="px-3 py-2.5">
                    <input 
                      type="number" 
                      value={rule.threshold} 
                      onChange={(e) => handleRuleChange(index, 'threshold', Math.max(0, Number(e.target.value) || 0))} 
                      disabled={rule.operator === 'all'} 
                      className="w-full bg-(--dh-bg-base) border border-(--dh-border) rounded-md px-2.5 py-1.5 text-xs font-bold text-(--dh-text-main) outline-hidden focus:border-(--dh-accent) disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
                    />
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <select 
                      value={rule.action} 
                      onChange={(e) => handleRuleChange(index, 'action', e.target.value)} 
                      className="w-full bg-(--dh-bg-base) border border-(--dh-border) rounded-md px-2.5 py-1.5 text-xs font-black text-(--dh-text-main) outline-hidden focus:border-(--dh-accent) cursor-pointer text-center text-blue-600 dark:text-blue-400"
                    >
                      <option value="*">* (คูณ)</option>
                      <option value="/">/ (หาร)</option>
                    </select>
                  </td>

                  <td className="px-3 py-2.5">
                    <input 
                      type="number" 
                      step="0.01" 
                      value={rule.value} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const cleanVal = isNaN(val) ? 1 : val;
                        handleRuleChange(index, 'value', rule.action === '/' && cleanVal <= 0 ? 0.01 : cleanVal);
                      }} 
                      className="w-full bg-(--dh-bg-base) border border-(--dh-border) rounded-md px-2.5 py-1.5 text-xs font-bold text-(--dh-text-main) outline-hidden focus:border-(--dh-accent) focus:ring-1 focus:ring-(--dh-accent-light) transition-all" 
                    />
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <button 
                      type="button"
                      onClick={() => handleRuleChange(index, 'isActive', !rule.isActive)} 
                      className={`text-[10px] px-3 py-1.5 rounded-md font-black uppercase tracking-wider transition-colors border cursor-pointer ${
                        rule.isActive 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-(--dh-bg-surface) text-(--dh-text-muted) border-(--dh-border) opacity-60 hover:opacity-100'
                      }`}
                    >
                      {rule.isActive ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  <td className="px-4 py-2.5 text-right">
                    <button 
                      type="button"
                      onClick={() => removeRule(index)} 
                      className="p-1.5 text-(--dh-text-muted) hover:text-rose-500 bg-(--dh-bg-base) hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    >
                      <Trash2 size={16} strokeWidth={2.5}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Top-Down Note */}
      <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border-t border-(--dh-border) flex items-start gap-2 shrink-0">
        <AlertTriangle size={14} className="shrink-0 mt-0.5 opacity-80"/>
        <p>ระบบจะทำงานแบบ Top-Down ตามลำดับในตารางนี้ (แถวบนจะถูกพิจารณาก่อนเสมอ สามารถใช้ปุ่มลูกศรเพื่อสลับลำดับได้)</p>
      </div>

    </div>
  );
}
