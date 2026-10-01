import React from 'react';
import { Tag, Calendar, Sparkles } from 'lucide-react';

export default function PromotionCard({ todo, formatDate }) {
  const promo = todo?.payload || todo?.promotion || {};
  const promoType = (promo.type || promo.discountType || '').toUpperCase();
  const promoValue = promo.value !== undefined ? promo.value : promo.discountValue;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-amber-200 dark:border-amber-800/60 flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md hover:border-amber-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 shadow-xs">
            <Tag size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mt-1">
              {todo.title || promo.name || promo.title || 'การแจ้งเตือนโปรโมชัน'}
            </h3>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                #{todo.id?.slice(-6).toUpperCase()}
              </span>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Sparkles size={11} /> โปรโมชัน
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 mb-4">
        {todo.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-amber-50/40 dark:bg-slate-900/50 p-3 rounded-xl border border-amber-100 dark:border-slate-700/50 whitespace-pre-line">
            {todo.description}
          </p>
        )}

        {promoValue !== undefined && promoValue !== null && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">ประเภทส่วนลด</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {promoType === 'PERCENTAGE' ? 'ส่วนลดเปอร์เซ็นต์' : 'ส่วนลดเงินสด'}
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">มูลค่าส่วนลด</span>
              <span className="font-bold text-amber-600">
                {promoValue} {promoType === 'PERCENTAGE' ? '%' : ' ฿'}
              </span>
            </div>
          </div>
        )}
      </div>

      {promo.endDate && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> หมดเขต: {formatDate ? formatDate(promo.endDate) : String(promo.endDate)}
          </span>
        </div>
      )}
    </div>
  );
}
