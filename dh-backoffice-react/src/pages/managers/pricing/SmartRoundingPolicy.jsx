import { Calculator, Check } from 'lucide-react';

export default function SmartRoundingPolicy({ config, handleRoundingChange }) {
  if (!config) return null;
  const isCustom = config.rounding?.type === 'custom';

  return (
    <div className="bg-(--dh-bg-surface) px-4 py-3 rounded-2xl shadow-xs border border-(--dh-border) shrink-0 transition-all flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 shrink-0">
        <Calculator size={15} className="text-blue-500" />
        <span className="font-black uppercase tracking-wider text-(--dh-text-main) text-xs">
          ปัดเศษอัตโนมัติ (Psychological Pricing)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Toggle Buttons */}
        <div className="flex bg-(--dh-bg-base) p-1 rounded-xl border border-(--dh-border) text-[11px] font-bold">
          <button
            type="button"
            onClick={() => handleRoundingChange('type', 'custom')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              isCustom 
                ? 'bg-blue-600 text-white font-black shadow-xs' 
                : 'text-(--dh-text-muted) hover:text-(--dh-text-main)'
            }`}
          >
            <Check size={11} /> เปิดปัดเศษ (Custom)
          </button>
          <button
            type="button"
            onClick={() => handleRoundingChange('type', 'none')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isCustom 
                ? 'text-(--dh-text-muted) hover:text-(--dh-text-main)' 
                : 'bg-slate-700 text-white font-black shadow-xs'
            }`}
          >
            ไม่ปัด (ตามจริง)
          </button>
        </div>

        {/* Inputs for Custom */}
        {isCustom && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5 bg-(--dh-bg-base) px-2.5 py-1 rounded-xl border border-(--dh-border)">
              <span className="text-[10px] font-bold text-(--dh-text-muted)">ลงท้ายด้วย:</span>
              <input
                type="text"
                placeholder="เช่น 90"
                value={config.rounding?.primaryTarget || ''}
                onChange={(e) => handleRoundingChange('primaryTarget', e.target.value.replace(/[^0-9]/g, ''))}
                className="w-14 bg-(--dh-bg-surface) border border-(--dh-border) rounded-md px-1.5 py-0.5 text-xs font-black text-blue-600 dark:text-blue-400 text-center outline-hidden focus:border-blue-500 shadow-inner"
              />
            </div>

            <label className="flex items-center gap-1.5 bg-(--dh-bg-base) px-2.5 py-1 rounded-xl border border-(--dh-border) cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.rounding?.enableFallback || false}
                onChange={(e) => handleRoundingChange('enableFallback', e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm text-blue-600 border-(--dh-border) bg-(--dh-bg-surface) cursor-pointer"
              />
              <span className="text-[10px] font-bold text-(--dh-text-muted)">สำรอง:</span>
              {config.rounding?.enableFallback && (
                <input
                  type="text"
                  placeholder="เช่น 9"
                  value={config.rounding?.fallbackTarget || ''}
                  onChange={(e) => handleRoundingChange('fallbackTarget', e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-10 bg-(--dh-bg-surface) border border-(--dh-border) rounded-md px-1.5 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400 text-center outline-hidden focus:border-amber-500 shadow-inner animate-in fade-in"
                />
              )}
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
