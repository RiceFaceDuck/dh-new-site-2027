import React from 'react';
import { RefreshCw } from 'lucide-react';
import { HighlightText } from '../HighlightText';

export default function ProductDetailSubstitutes({ substitutes, handleSelectProduct, highlightData }) {
  if (!substitutes || substitutes.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-dh-accent-light/50 rounded-lg border border-dh-accent/30 transition-colors">
      <div className="text-[11px] font-extrabold text-dh-accent uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <RefreshCw size={14}/> สินค้าใช้แทนกันได้ (Substitutes)
      </div>
      <div className="grid grid-cols-2 gap-2">
        {substitutes.map(sub => {
          const isInactive = sub.isActive === false;
          return (
            <div key={sub.id} onClick={() => handleSelectProduct(sub)} className={`group/sub p-2.5 rounded-md border cursor-pointer flex justify-between items-center transition-all duration-300 hover:shadow-dh-card hover:-translate-y-[1px] ${isInactive ? 'bg-red-50/50 border-red-200 hover:border-red-400' : 'bg-dh-surface border-dh-border hover:border-dh-accent'}`}>
              <div className="min-w-0 pr-2">
                <div className={`font-extrabold text-[12px] mb-0.5 transition-colors flex items-center gap-1 ${isInactive ? 'text-red-500 line-through' : 'text-dh-main group-hover/sub:text-dh-accent'}`}>
                  <HighlightText text={sub.sku} highlightData={highlightData}/>
                  {isInactive && <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded no-underline shrink-0">เลิกขาย</span>}
                </div> 
                <div className="text-[10px] font-bold text-dh-muted truncate"><HighlightText text={sub.name} highlightData={highlightData}/></div>
              </div>
              <span className={`text-[10px] font-black bg-dh-base border px-1.5 py-0.5 rounded shrink-0 shadow-sm group-hover/sub:scale-105 transition-transform ${isInactive ? 'text-red-400 border-red-200' : 'text-dh-accent border-dh-border'}`}>มี {sub.stockQuantity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
