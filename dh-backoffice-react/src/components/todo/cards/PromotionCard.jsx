import React from 'react';
import { Tag, Calendar, Sparkles, CheckCircle2, Trash2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PromotionCard({ todo, formatDate, handleAction, isProcessing, handleRejectClick }) {
  const navigate = useNavigate();
  const promo = todo?.payload || todo?.promotion || {};
  const promoType = (promo.type || promo.discountType || '').toUpperCase();
  const promoValue = promo.value !== undefined ? promo.value : promo.discountValue;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-amber-200 dark:border-amber-800/60 flex flex-col h-full relative overflow-hidden transition-all hover:shadow-md hover:border-amber-300">
      
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center transition-all duration-300">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-2"></div>
          <span className="text-xs font-bold text-amber-600 animate-pulse">กำลังประมวลผล...</span>
        </div>
      )}

      {/* Header */}
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

      {/* Content */}
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
        <div className="mb-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> หมดเขต: {formatDate ? formatDate(promo.endDate) : String(promo.endDate)}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
        <button
          onClick={() => handleAction && handleAction(todo.id, 'complete', todo.type)}
          disabled={isProcessing}
          className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          title="รับทราบโปรโมชันและปิดงานเข้าประวัติ"
        >
          <CheckCircle2 size={16} /> รับทราบแล้ว
        </button>

        <button
          onClick={() => navigate('/billing')}
          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors"
          title="เปิดหน้าระบบขาย/เปิดบิล (POS)"
        >
          <ShoppingCart size={15} /> ไปหน้าขาย
        </button>

        <button
          onClick={handleRejectClick}
          disabled={isProcessing}
          className="flex justify-center items-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
          title="ลบหรือปิดการแจ้งเตือนนี้"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
